import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { WebSocketServer, WebSocket } from 'ws'
import { createContext } from './context'
import { findAvailablePort, getLocalIP } from './utils'
import { registerCoreRoutes } from './routes/core'
import { registerGenerationRoutes } from './routes/generation'
import { registerMediaRoutes } from './routes/media'
import { registerBackendRoutes } from './routes/backend'
import {
  registerNetworkRoutes,
  startCloudflare,
  startNgrok,
  stopCloudflare,
  stopNgrok,
  updateLocalNetworkUrl
} from './routes/network'
import { registerSetupRoutes } from './routes/setup'

const ctx = createContext()
const app = express()

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use('/output', express.static(ctx.paths.outputDir))
app.use('/temp', express.static(ctx.paths.tempDir))

app.use('/fontawesome', express.static(path.join(ctx.paths.root, 'node_modules', '@fortawesome', 'fontawesome-free')))
app.use('/tailwindcss', express.static(path.join(ctx.paths.root, 'node_modules', 'tailwindcss', 'dist')))

let publicDir = path.join(ctx.paths.root, 'dist')
if (!fs.existsSync(publicDir)) publicDir = path.join(ctx.paths.root, 'out', 'renderer')
if (!fs.existsSync(publicDir)) publicDir = path.join(ctx.paths.root, 'public')
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir))
  console.log('[Server] Web UI enabled from:', publicDir)
} else {
  app.get('/', (_req, res) => {
    res.json({ message: 'StableUI API Server', status: 'running', endpoints: { status: '/api/status', models: '/api/models', gallery: '/api/gallery' } })
  })
}

app.get(['/api/health', '/health'], (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

registerCoreRoutes(app, ctx)
registerGenerationRoutes(app, ctx)
registerMediaRoutes(app, ctx)
registerBackendRoutes(app, ctx)
registerNetworkRoutes(app, ctx)
registerSetupRoutes(app, ctx)

app.get('/{*splat}', (_req, res) => {
  const indexPath = path.join(publicDir, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).json({ error: 'Not found' })
  }
})

console.log('[Server] Initializing...')
const keepAlive = setInterval(() => undefined, 1000)

findAvailablePort(ctx.port)
  .then((port) => {
    const server = app.listen(port, ctx.host, async () => {
      ctx.state.networkStatus.local.enabled = ctx.state.networkStatus.local.enabled || ctx.host === '0.0.0.0'
      updateLocalNetworkUrl(ctx)
      const localURL = `http://${getLocalIP()}:${port}`
      const localhostURL = `http://${ctx.host === '0.0.0.0' ? 'localhost' : ctx.host}:${port}`
      console.log(`Web UI: ${localhostURL}`)
      if (ctx.host === '0.0.0.0') console.log(`Local Network: ${localURL}`)
      console.log(`[Server] Running on port: ${port}`)

      if (ctx.hasFlag('--ngrok')) {
        const token = process.env.NGROK_AUTHTOKEN
        if (token) await startNgrok(ctx, port, token)
        else console.warn('[Ngrok] No authtoken found in environment (NGROK_AUTHTOKEN). Tunnel not started.')
      }
      if (ctx.hasFlag('--cloudflare')) await startCloudflare(ctx, port)
    })

    const wss = new WebSocketServer({ server })

    wss.on('connection', (ws) => {
      console.log('[WebSocket] Client connected')

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString())
          console.log('[WebSocket] Received:', msg.type)
          if (msg.type === 'heartbeat') {
            ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }))
          }
        } catch (e) {
          console.error('[WebSocket] Invalid message:', e)
        }
      })

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected')
      })

      ws.send(JSON.stringify({ type: 'backend_ready', timestamp: Date.now() }))
    })

    ctx.state.progressBus.on('progress', (progress) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'generation_progress', data: progress }))
        }
      })
    })

    ctx.state.progressBus.on('start', (progress) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'generation_started', data: progress }))
          client.send(JSON.stringify({ type: 'queue_updated', data: { running: true } }))
        }
      })
    })

    ctx.state.progressBus.on('end', (progress) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'generation_completed', data: progress }))
          client.send(JSON.stringify({ type: 'gallery_updated', timestamp: Date.now() }))
          client.send(JSON.stringify({ type: 'queue_updated', data: { running: false } }))
        }
      })
    })

    ctx.state.progressBus.on('failed', (error) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'generation_failed', data: error }))
          client.send(JSON.stringify({ type: 'queue_updated', data: { running: false } }))
        }
      })
    })

    ctx.state.logBus.on('log', (log) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'log', data: log }))
        }
      })
    })

    ctx.state.wss = wss
  })
  .catch((error) => {
    clearInterval(keepAlive)
    console.error('Failed to find available port:', error)
    process.exit(1)
  })

async function cleanup(): Promise<void> {
  console.log('[Server] Cleanup...')
  try {
    await stopNgrok(ctx)
  } catch (error) {
    console.error('Error stopping ngrok:', error)
  }
  try {
    await stopCloudflare(ctx)
  } catch (error) {
    console.error('Error stopping cloudflare:', error)
  }
  if (ctx.state.cliProcess) ctx.state.cliProcess.kill()
  if (ctx.state.sdProcess) ctx.state.sdProcess.kill()
  process.exit()
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

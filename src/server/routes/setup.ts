import type { Express } from 'express'
import fs from 'fs'
import path from 'path'
import type { AppContext } from '../types'

interface AppState {
  firstRun: boolean
  setupComplete: boolean
  skipped: boolean
}

const defaultAppState: AppState = {
  firstRun: true,
  setupComplete: false,
  skipped: false
}

function getStateFilePath(ctx: AppContext): string {
  return path.join(ctx.paths.configDir, 'app-state.json')
}

function readAppState(ctx: AppContext): AppState {
  const statePath = getStateFilePath(ctx)
  try {
    if (!fs.existsSync(statePath)) return { ...defaultAppState }
    const raw = fs.readFileSync(statePath, 'utf-8')
    const parsed = JSON.parse(raw)
    return {
      firstRun: typeof parsed.firstRun === 'boolean' ? parsed.firstRun : defaultAppState.firstRun,
      setupComplete:
        typeof parsed.setupComplete === 'boolean'
          ? parsed.setupComplete
          : defaultAppState.setupComplete,
      skipped: typeof parsed.skipped === 'boolean' ? parsed.skipped : defaultAppState.skipped
    }
  } catch (e) {
    console.error('[Setup] Failed to read app state:', e)
    return { ...defaultAppState }
  }
}

function writeAppState(ctx: AppContext, state: AppState): void {
  const statePath = getStateFilePath(ctx)
  try {
    const dir = path.dirname(statePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2))
  } catch (e) {
    console.error('[Setup] Failed to write app state:', e)
  }
}

export function registerSetupRoutes(app: Express, ctx: AppContext): void {
  app.get('/api/setup', (_req, res) => {
    const state = readAppState(ctx)
    res.json({
      firstRun: state.firstRun,
      setupComplete: state.setupComplete,
      skipped: state.skipped,
      port: ctx.port,
      isDev: process.env.NODE_ENV !== 'production'
    })
  })

  app.post('/api/setup/complete', (_req, res) => {
    const state = readAppState(ctx)
    writeAppState(ctx, { ...state, firstRun: false, setupComplete: true, skipped: false })
    res.json({ success: true })
  })

  app.post('/api/setup/reopen', (_req, res) => {
    const state = readAppState(ctx)
    writeAppState(ctx, { ...state, setupComplete: false, skipped: false })
    res.json({ success: true })
  })

  app.post('/api/setup/skip', (_req, res) => {
    const state = readAppState(ctx)
    writeAppState(ctx, { ...state, skipped: true })
    res.json({ success: true })
  })

  app.post(['/api/config', '/config'], (req, res) => {
    try {
      const dir = path.dirname(ctx.paths.appConfigFile)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(ctx.paths.appConfigFile, JSON.stringify(req.body, null, 2))
      res.json({ success: true })
    } catch (e) {
      console.error('[Config] Failed to save config:', e)
      res.status(500).json({ error: 'Failed to save config' })
    }
  })

  app.get(['/api/config', '/config'], (_req, res) => {
    try {
      if (fs.existsSync(ctx.paths.appConfigFile)) {
        const config = JSON.parse(fs.readFileSync(ctx.paths.appConfigFile, 'utf-8'))
        res.json(config)
      } else {
        res.json({ theme: 'dark', output: 'local', autosave: true })
      }
    } catch (e) {
      console.error('[Config] Failed to load config:', e)
      res.json({ theme: 'dark', output: 'local', autosave: true })
    }
  })
}

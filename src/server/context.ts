import { EventEmitter } from 'events'
import fs from 'fs'
import path from 'path'
import type { AppContext, BackendConfig, Paths } from './types'

const MODEL_DIRS = [
  'diffusion',
  'uncond_diffusion',
  'vae',
  'audio_vae',
  'llm',
  'llm_vision',
  't5xxl',
  'embeddings_connectors',
  'clip',
  'clip_vision',
  'loras',
  'controlnet',
  'photomaker',
  'upscale',
  'hires_upscalers',
  'taesd',
  'embeddings'
]

function getArg(args: string[], name: string, fallback: string): string {
  const index = args.indexOf(name)
  return index !== -1 && args[index + 1] ? args[index + 1] : fallback
}

function getEnvPath(name: string, fallback: string): string {
  const value = process.env[name]
  return value && value.trim() ? path.resolve(value) : fallback
}

function loadBackendConfig(configFile: string): BackendConfig {
  try {
    if (fs.existsSync(configFile)) {
      return JSON.parse(fs.readFileSync(configFile, 'utf8'))
    }
  } catch (error) {
    console.error('Error loading config:', error)
  }

  return {
    activeVersion: 'custom',
    installedVersions: [],
    customBinaryExists: false
  }
}

function ensureDirectories(paths: Paths): void {
  for (const dir of MODEL_DIRS) {
    fs.mkdirSync(path.join(paths.modelsDir, dir), { recursive: true })
  }

  fs.mkdirSync(paths.outputDir, { recursive: true })
  fs.mkdirSync(paths.backendDir, { recursive: true })
  fs.mkdirSync(paths.customDir, { recursive: true })
  fs.mkdirSync(paths.releasesDir, { recursive: true })
  fs.mkdirSync(paths.tempDir, { recursive: true })
  fs.mkdirSync(paths.cacheDir, { recursive: true })
  fs.mkdirSync(paths.configDir, { recursive: true })
  fs.mkdirSync(paths.logDir, { recursive: true })
}

export function createContext(): AppContext {
  const args = process.argv.slice(2)
  const port = parseInt(getArg(args, '--port', process.env.PORT || '3000'), 10)
  const host = getArg(args, '--host', process.env.HOST || '0.0.0.0')
  const sdServerUrl = process.env.SD_SERVER_URL || 'http://localhost:1234'
  const resourcesPath = process.env.STABLE_RESOURCES_PATH || process.cwd()
  const configDir = getEnvPath('CONFIG_PATH', path.join(resourcesPath, 'config'))
  const paths: Paths = {
    root: resourcesPath,
    backendDir: path.join(resourcesPath, 'backend'),
    customDir: path.join(resourcesPath, 'backend', 'custom'),
    releasesDir: path.join(resourcesPath, 'backend', 'releases'),
    modelsDir: getEnvPath('MODEL_PATH', path.join(resourcesPath, 'models')),
    outputDir: getEnvPath('OUTPUT_PATH', path.join(resourcesPath, 'output')),
    tempDir: path.join(resourcesPath, 'temp'),
    cacheDir: getEnvPath('CACHE_PATH', path.join(resourcesPath, 'cache')),
    configDir,
    logDir: getEnvPath('LOG_PATH', path.join(resourcesPath, 'logs')),
    configFile: getEnvPath('STABLE_BACKEND_CONFIG_PATH', path.join(resourcesPath, 'backend-config.json')),
    appConfigFile: path.join(configDir, 'config.json'),
    historyFile: path.join(configDir, 'history.json')
  }

  console.log('[Server] Mode:', process.env.STABLE_PACKAGED === '1' ? 'PACKAGED' : 'DEVELOPMENT')
  console.log('[Server] Resources path:', resourcesPath)
  console.log('[Server] SD server URL:', sdServerUrl)

  ensureDirectories(paths)

  const state = {
    backendConfig: loadBackendConfig(paths.configFile),
    serverLogs: [] as string[],
    logBus: new EventEmitter(),
    sdProcess: null,
    cliProcess: null,
    server: null,
    wss: null,
    networkStatus: {
      local: { enabled: args.includes('--local'), url: null },
      ngrok: { enabled: false, url: null, error: null },
      cloudflare: { enabled: false, url: null, error: null }
    },
    downloads: {},
    ngrokListener: null,
    cloudflareTunnel: null,
    progress: null,
    progressBus: new EventEmitter()
  }

  const savedModelsDir = state.backendConfig.modelsDir
  if (savedModelsDir && typeof savedModelsDir === 'string') paths.modelsDir = savedModelsDir
  const savedOutputDir = state.backendConfig.outputDir
  if (savedOutputDir && typeof savedOutputDir === 'string') paths.outputDir = savedOutputDir
  const savedBackendDir = state.backendConfig.backendDir
  if (savedBackendDir && typeof savedBackendDir === 'string') paths.backendDir = savedBackendDir

  return {
    args,
    host,
    port,
    sdServerUrl,
    paths,
    state,
    hasFlag: (name) => args.includes(name),
    getActiveBackendPath: () =>
      state.backendConfig.activeVersion === 'custom'
        ? paths.customDir
        : path.join(paths.releasesDir, state.backendConfig.activeVersion),
    saveBackendConfig: () => {
      fs.writeFileSync(paths.configFile, JSON.stringify(state.backendConfig, null, 2))
    }
  }
}

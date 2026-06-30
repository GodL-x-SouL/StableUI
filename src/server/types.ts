import type { ChildProcess } from 'child_process'
import type { EventEmitter } from 'events'
import type { Server } from 'http'
import type { WebSocketServer } from 'ws'

export type JsonObject = Record<string, any>

export interface ProgressInfo {
  current: number
  total: number
  itPerSec: number
  label: string
  startedAt: number
  updatedAt: number
}

export interface BackendConfig {
  activeVersion: string
  installedVersions: string[]
  customBinaryExists: boolean
  [key: string]: any
}

export interface Paths {
  root: string
  backendDir: string
  customDir: string
  releasesDir: string
  modelsDir: string
  outputDir: string
  tempDir: string
  cacheDir: string
  configDir: string
  logDir: string
  configFile: string
  appConfigFile: string
  historyFile: string
}

export interface NetworkStatus {
  local: { enabled: boolean; url: string | null }
  ngrok: { enabled: boolean; url: string | null; error: string | null }
  cloudflare: { enabled: boolean; url: string | null; error: string | null }
}

export interface DownloadTask {
  id: string
  label: string
  targetPath: string
  url: string
  status: 'downloading' | 'completed' | 'failed' | 'cancelled' | 'paused'
  receivedBytes: number
  totalBytes: number | null
  startedAt: number
  updatedAt: number
  error?: string
  cancel?: () => void
  resume?: () => void
}

export interface RuntimeState {
  backendConfig: BackendConfig
  serverLogs: string[]
  logBus: EventEmitter
  sdProcess: ChildProcess | null
  cliProcess: ChildProcess | null
  server: Server | null
  wss: WebSocketServer | null
  networkStatus: NetworkStatus
  downloads: Record<string, DownloadTask>
  ngrokListener: any
  cloudflareTunnel: ChildProcess | null
  progress: ProgressInfo | null
  progressBus: EventEmitter
}

export interface AppContext {
  args: string[]
  host: string
  port: number
  sdServerUrl: string
  paths: Paths
  state: RuntimeState
  getActiveBackendPath: () => string
  saveBackendConfig: () => void
  hasFlag: (name: string) => boolean
}

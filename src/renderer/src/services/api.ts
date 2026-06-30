/**
 * API service for StableUI backend communication
 * Uses same-origin requests when served from the backend
 */

let serverPort = 3000
let useRelative = false

/**
 * Initialize the API with the server port
 * Called from App.vue on mount
 */
export function initializeApi(port: number): void {
  serverPort = port
  const hostname = window.location.hostname
  if (hostname && hostname !== '' && hostname !== 'file:') {
    useRelative = true
  }
  console.log('[API] Initialized with port:', port, 'relative:', useRelative)
}

/**
 * Get the current API base URL
 */
export function getApiBase(): string {
  if (useRelative) return ''
  const hostname = window.location.hostname || 'localhost'
  return `http://${hostname}:${serverPort}`
}

export const API_BASE = new Proxy({} as { toString: () => string }, {
  get: () => getApiBase()
}) as unknown as string

/**
 * Get full URL for output images
 */
export function getOutputUrl(filename: string): string {
  return `${getApiBase()}/output/${filename}`
}

/**
 * Get full URL for local absolute paths (served via /api/file endpoint)
 */
export function getFileUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('blob:')) return path
  return `${getApiBase()}/api/file?path=${encodeURIComponent(path)}`
}

/**
 * Generic API request function
 */
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getApiBase()}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `Request failed: ${response.status}`)
  }

  return response.json()
}

/**
 * POST request helper
 */
export async function apiPost<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

/**
 * GET request helper
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' })
}

/**
 * FormData POST request helper (for file uploads)
 */
export async function apiPostForm<T>(endpoint: string, formData: FormData): Promise<T> {
  const response = await fetch(`${getApiBase()}${endpoint}`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `Request failed: ${response.status}`)
  }

  return response.json()
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' })
}

/**
 * API endpoints as constants for type safety
 */
export const API_ENDPOINTS = {
  STATUS: '/api/status',
  MODELS: '/api/models',
  GENERATE_CLI: '/api/generate-cli',
  GENERATE_SERVER: '/api/generate',
  CANCEL_CLI: '/api/cancel-cli',
  CANCEL: '/api/cancel',
  GENERATION_PROGRESS: '/api/generation/progress',
  INPAINT: '/api/inpaint',
  GENERATE_VIDEO: '/api/generate-video',
  GALLERY: '/api/gallery',
  DELETE: '/api/delete',
  START: '/api/start',
  STOP: '/api/stop',
  BACKEND_CONFIG: '/api/backend/config',
  BACKEND_RELEASES: '/api/backend/releases',
  BACKEND_DOWNLOAD: '/api/backend/download',
  BACKEND_SET_ACTIVE: '/api/backend/set-active',
  NETWORK_STATUS: '/api/network/status',
  NETWORK_NGROK: '/api/network/ngrok',
  NETWORK_CLOUDFLARE: '/api/network/cloudflare'
} as const

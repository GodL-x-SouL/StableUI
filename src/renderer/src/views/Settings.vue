<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGet, apiPost } from '@/services/api'
import {
  Settings as SettingsIcon,
  RefreshCw,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-vue-next'
import { useSetup } from '@/composables/useSetup'

const { reopenSetup } = useSetup()

interface BackendConfig {
  activeVersion: string
  customBinaryExists: boolean
  installedVersions: string[]
  activeBackendPath: string
  activeBackendValid: boolean
}

// Backend state
const config = ref<BackendConfig>({
  activeVersion: 'custom',
  customBinaryExists: false,
  installedVersions: [],
  activeBackendPath: '',
  activeBackendValid: false
})

const serverOnline = ref(false)

// Network state
const localNetworkEnabled = ref(false)
const localNetworkUrl = ref('')

// Paths state
const backendPath = ref('')
const modelsPath = ref('')
const outputPath = ref('')
const pathSaveStatus = ref('')
const pathsConfigured = ref({ backendDir: false, modelsDir: false, outputDir: false })

/**
 * fetchConfig() - Fetches current backend configuration
 */
async function fetchConfig(): Promise<void> {
  try {
    const data = await apiGet<BackendConfig>('/api/backend/config')
    config.value = data
  } catch (e) {
    console.error('Failed to fetch backend config:', e)
  }
}

/**
 * checkServerStatus() - Check if server is online
 */
async function checkServerStatus(): Promise<void> {
  try {
    await apiGet('/api/status')
    serverOnline.value = true
  } catch {
    serverOnline.value = false
  }
}

/**
 * fetchNetworkStatus() - Get network sharing status
 */
async function fetchNetworkStatus(): Promise<void> {
  try {
    const data = await apiGet<any>('/api/network/status')
    localNetworkEnabled.value = data.local?.enabled || false
    localNetworkUrl.value = data.local?.url || ''
  } catch {
    console.log('Network status not available')
  }
}

/**
 * fetchPaths() - Fetch current models and output paths
 */
async function fetchPaths(): Promise<void> {
  try {
    const data = await apiGet<{ modelsDir: string; outputDir: string; backendDir: string; configured: { backendDir: boolean; modelsDir: boolean; outputDir: boolean } }>('/api/paths')
    pathsConfigured.value = data.configured
    backendPath.value = data.configured.backendDir ? data.backendDir : ''
    modelsPath.value = data.configured.modelsDir ? data.modelsDir : ''
    outputPath.value = data.configured.outputDir ? data.outputDir : ''
  } catch (e) {
    console.error('Failed to fetch paths:', e)
  }
}

/**
 * savePath() - Save a path configuration
 */
async function savePath(type: 'modelsDir' | 'outputDir' | 'backendDir'): Promise<void> {
  const pathMap = { modelsDir: modelsPath.value, outputDir: outputPath.value, backendDir: backendPath.value }
  const newPath = pathMap[type]
  if (!newPath.trim()) return
  try {
    await apiPost('/api/paths', { type, path: newPath })
    pathsConfigured.value[type] = true
    pathSaveStatus.value = type
    setTimeout(() => { pathSaveStatus.value = '' }, 2000)
  } catch (e) {
    console.error('Failed to save path:', e)
  }
}

/**
 * copyUrl() - Copy URL to clipboard
 */
async function copyUrl(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

onMounted(async () => {
  await checkServerStatus()
  await fetchConfig()
  await fetchPaths()
  await fetchNetworkStatus()
})
</script>

<template>
  <div class="h-full overflow-y-auto overflow-x-hidden p-5 md:p-6 bg-card">
    <div class="mx-auto space-y-5 px-5 md:px-8 max-w-[1500px]">
      <!-- Header -->
      <header class="flex items-center gap-3">
        <SettingsIcon class="w-7 h-7 text-foreground" />
        <div>
          <h1 class="text-xl font-semibold">Settings</h1>
          <p class="text-[12px] text-muted-foreground">Backend binary and network settings</p>
        </div>
      </header>

      <!-- Active Backend Status -->
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-[14px] font-semibold">Active Backend</h2>
            <p class="mt-1 text-[12px] text-muted-foreground leading-[17px]">Current backend binary status and setup.</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="reopenSetup"
              style="height:30px;padding:0 12px;border-radius:8px;border:1px solid var(--color-border);font-size:10px;font-weight:500;background:transparent;color:var(--color-muted-foreground);cursor:pointer;transition:all 0.15s ease;display:inline-flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap;"
              @mouseenter="$event.currentTarget.style.color='var(--color-foreground)'"
              @mouseleave="$event.currentTarget.style.color='var(--color-muted-foreground)'"
            >
              <RefreshCw class="w-3 h-3" />
              Run setup wizard
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div
            class="w-3 h-3 rounded-full"
            :class="config.activeBackendValid ? 'bg-green-500' : 'bg-red-500'"
          ></div>
          <span
            class="font-medium text-[13px]"
            :class="config.activeBackendValid ? 'text-green-400' : 'text-red-400'"
          >
            {{ config.activeVersion || 'Not configured' }}
          </span>
          <span
            v-if="config.activeBackendValid"
            class="px-2 py-0.5 text-[11px] bg-green-500/20 text-green-400 rounded-lg"
          >
            Valid
          </span>
          <span v-else class="px-2 py-0.5 text-[11px] bg-red-500/20 text-red-400 rounded-lg">
            Binary Not Found
          </span>
        </div>

        <div
          v-if="!config.activeBackendValid"
          class="p-3 bg-muted/20 rounded-[10px] text-[13px] text-foreground"
        >
          <AlertTriangle class="w-4 h-4 inline mr-1" />
          Place sd-cli and sd-server binaries in the custom folder, or download a release below.
        </div>
      </section>

      <!-- Set Paths Manually -->
      <section class="space-y-3">
        <div>
          <h2 class="text-[14px] font-semibold">Set Paths Manually</h2>
          <p class="mt-1 text-[12px] text-muted-foreground leading-[17px]">Override default backend, models and output directories.</p>
        </div>

        <div class="space-y-1">
          <label class="text-[12px] text-muted-foreground font-medium">Backend Path</label>
          <div class="flex gap-2">
            <input
              v-model="backendPath"
              type="text"
              placeholder="/path/to/backend"
              style="flex:1;height:36px;border-radius:10px;background:color-mix(in srgb, var(--color-muted) 30%, transparent);padding:0 12px;font-size:12px;color:var(--color-foreground);border:1px solid transparent;outline:none;transition:all 0.15s ease;"
              @focus="$event.currentTarget.style.borderColor='var(--color-ring)';$event.currentTarget.style.boxShadow='0 0 0 1px var(--color-ring)'"
              @blur="$event.currentTarget.style.borderColor='transparent';$event.currentTarget.style.boxShadow='none'"
            />
            <button
              @click="savePath('backendDir')"
              style="height:36px;width:140px;flex-shrink:0;border-radius:10px;border:1px solid var(--color-border);font-size:13px;font-weight:500;background:var(--color-primary);color:var(--color-primary-foreground);cursor:pointer;transition:all 0.15s ease;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;"
            >
              <Check v-if="pathSaveStatus === 'backendDir'" class="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-[12px] text-muted-foreground font-medium">Models Path</label>
          <div class="flex gap-2">
            <input
              v-model="modelsPath"
              type="text"
              placeholder="/path/to/models"
              style="flex:1;height:36px;border-radius:10px;background:color-mix(in srgb, var(--color-muted) 30%, transparent);padding:0 12px;font-size:12px;color:var(--color-foreground);border:1px solid transparent;outline:none;transition:all 0.15s ease;"
              @focus="$event.currentTarget.style.borderColor='var(--color-ring)';$event.currentTarget.style.boxShadow='0 0 0 1px var(--color-ring)'"
              @blur="$event.currentTarget.style.borderColor='transparent';$event.currentTarget.style.boxShadow='none'"
            />
            <button
              @click="savePath('modelsDir')"
              style="height:36px;width:140px;flex-shrink:0;border-radius:10px;border:1px solid var(--color-border);font-size:13px;font-weight:500;background:var(--color-primary);color:var(--color-primary-foreground);cursor:pointer;transition:all 0.15s ease;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;"
            >
              <Check v-if="pathSaveStatus === 'modelsDir'" class="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-[12px] text-muted-foreground font-medium">Output Path</label>
          <div class="flex gap-2">
            <input
              v-model="outputPath"
              type="text"
              placeholder="/path/to/output"
              style="flex:1;height:36px;border-radius:10px;background:color-mix(in srgb, var(--color-muted) 30%, transparent);padding:0 12px;font-size:12px;color:var(--color-foreground);border:1px solid transparent;outline:none;transition:all 0.15s ease;"
              @focus="$event.currentTarget.style.borderColor='var(--color-ring)';$event.currentTarget.style.boxShadow='0 0 0 1px var(--color-ring)'"
              @blur="$event.currentTarget.style.borderColor='transparent';$event.currentTarget.style.boxShadow='none'"
            />
            <button
              @click="savePath('outputDir')"
              style="height:36px;width:140px;flex-shrink:0;border-radius:10px;border:1px solid var(--color-border);font-size:13px;font-weight:500;background:var(--color-primary);color:var(--color-primary-foreground);cursor:pointer;transition:all 0.15s ease;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;"
            >
              <Check v-if="pathSaveStatus === 'outputDir'" class="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>
      </section>

      <!-- Network Sharing -->
      <section class="space-y-3">
        <div>
          <h2 class="text-[14px] font-semibold">Network Sharing</h2>
          <p class="mt-1 text-[12px] text-muted-foreground leading-[17px]">Access from other devices on your local network.</p>
        </div>

        <!-- Local Network -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[13px] font-medium">Local Network</span>
            <div class="text-[11px] font-semibold px-2 py-0.5 rounded-lg" :class="localNetworkEnabled ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'">
              {{ localNetworkEnabled ? 'Active' : 'Disabled' }}
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground mb-2">
            Enable by starting with <code class="bg-muted/50 px-1 rounded-lg">--local</code> flag.
          </p>
          <div
            v-if="localNetworkUrl && localNetworkEnabled"
            @click="copyUrl(localNetworkUrl)"
            class="p-2 bg-muted/30 rounded-[10px] text-[11px] font-mono text-foreground cursor-pointer hover:bg-muted/50 flex items-center justify-between"
          >
            <span>{{ localNetworkUrl }}</span>
            <Copy class="w-3 h-3" />
          </div>
        </div>
      </section>

      <!-- Server Status -->
      <section>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-[14px] font-semibold">Express Server Status</h2>
            <p class="mt-1 text-[12px] text-muted-foreground leading-[17px]">Internal API server health check.</p>
          </div>
          <div class="flex items-center gap-3">
            <div
              class="w-3 h-3 rounded-full"
              :class="serverOnline ? 'bg-green-500' : 'bg-destructive'"
            ></div>
            <span class="text-[13px]">{{ serverOnline ? 'Online' : 'Offline' }}</span>
            <button
              @click="checkServerStatus"
              style="height:30px;width:30px;border-radius:8px;border:1px solid transparent;background:transparent;cursor:pointer;transition:all 0.15s ease;display:inline-flex;align-items:center;justify-content:center;"
              @mouseenter="$event.currentTarget.style.borderColor='var(--color-border)';$event.currentTarget.style.background='var(--color-card)'"
              @mouseleave="$event.currentTarget.style.borderColor='transparent';$event.currentTarget.style.background='transparent'"
            >
              <RefreshCw class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

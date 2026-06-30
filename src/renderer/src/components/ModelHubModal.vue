<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Download, Loader2, X, Key, Check, FileDown, BookOpen, Link } from 'lucide-vue-next'
import { useConfigStore } from '@/stores/config'
import { apiGet, apiPost } from '@/services/api'
import { hubModels, type HubModel, type HubFile } from '@/lib/starterPacks'
import Select from '@/components/ui/Select.vue'

defineProps<{ open: boolean }>()

const emit = defineEmits<{ close: [] }>()
const configStore = useConfigStore()
const activeModelId = ref('custom')
const downloading = ref<string | null>(null)
const downloadStatus = ref<Record<string, string>>({})
const hfToken = ref(localStorage.getItem('stable-hf-token') || '')
const civitaiToken = ref(localStorage.getItem('stable-civitai-token') || '')
const modelscopeToken = ref(localStorage.getItem('stable-modelscope-token') || '')
const showTokenDialog = ref(false)
const customUrl = ref('')
const customFolder = ref('diffusion')

const CUSTOM_MODEL_FOLDERS = [
  { label: 'audio_vae', value: 'audio_vae' },
  { label: 'clip', value: 'clip' },
  { label: 'clip_vision', value: 'clip_vision' },
  { label: 'controlnet', value: 'controlnet' },
  { label: 'diffusion', value: 'diffusion' },
  { label: 'embeddings', value: 'embeddings' },
  { label: 'embeddings_connectors', value: 'embeddings_connectors' },
  { label: 'hires_upscalers', value: 'hires_upscalers' },
  { label: 'llm', value: 'llm' },
  { label: 'llm_vision', value: 'llm_vision' },
  { label: 'loras', value: 'loras' },
  { label: 'photomaker', value: 'photomaker' },
  { label: 't5xxl', value: 't5xxl' },
  { label: 'taesd', value: 'taesd' },
  { label: 'uncond_diffusion', value: 'uncond_diffusion' },
  { label: 'upscale', value: 'upscale' },
  { label: 'vae', value: 'vae' }
]

const isCustomPage = computed(() => activeModelId.value === 'custom')

const activeModel = computed(() => hubModels.find((model) => model.id === activeModelId.value) || hubModels[0])

function saveTokens(): void {
  localStorage.setItem('stable-hf-token', hfToken.value)
  localStorage.setItem('stable-civitai-token', civitaiToken.value)
  localStorage.setItem('stable-modelscope-token', modelscopeToken.value)
}

function applyPreset(model = activeModel.value): void {
  configStore.applyPreset(model.presetId)
}

function extractFilename(url: string): string {
  const parts = url.split('/')
  return parts[parts.length - 1].split('?')[0] || 'model.bin'
}

async function downloadCustomModel(): Promise<void> {
  let url = customUrl.value.trim()
  if (!url) return
  try {
    const u = new URL(url)
    if (u.hostname.endsWith('huggingface.co')) {
      u.pathname = u.pathname.replace('/blob/', '/resolve/')
    }
    url = u.href
  } catch { /* keep original */ }
  const filename = extractFilename(customUrl.value.trim())
  const key = `${customFolder.value}/${filename}`
  downloading.value = key
  downloadStatus.value[key] = 'Downloading...'
  startPolling()
  try {
    await apiPost('/api/models/download', { url, category: customFolder.value, filename })
    downloadStatus.value[key] = 'Downloaded'
    customUrl.value = ''
  } catch (error) {
    downloadStatus.value[key] = error instanceof Error ? error.message : 'Download failed'
  } finally {
    downloading.value = null
    stopPolling()
  }
}

async function downloadFile(file: HubFile): Promise<void> {
  const key = `${file.category}/${file.filename}`
  downloading.value = key
  downloadStatus.value[key] = 'Downloading...'
  startPolling()
  try {
    const payload: Record<string, unknown> = { ...file }
    if (hfToken.value && activeModel.value.gated) {
      payload.hfToken = hfToken.value
    }
    await apiPost('/api/models/download', payload)
    downloadStatus.value[key] = 'Downloaded'
    downloading.value = null
    stopPolling()
  } catch (error) {
    downloadStatus.value[key] = error instanceof Error ? error.message : 'Download failed'
    downloading.value = null
    stopPolling()
  }
}

async function downloadPack(): Promise<void> {
  applyPreset()
  for (const file of activeModel.value.files) {
    await downloadFile(file)
  }
}

function isDownloaded(key: string): boolean {
  return downloadStatus.value[key] === 'Downloaded'
}

let pollInterval: ReturnType<typeof setInterval> | null = null

async function syncDownloadState(): Promise<void> {
  try {
    const result = await apiGet<{ downloads: Array<{ targetPath: string; status: string }> }>('/api/downloads')
    const activeDownloads = result.downloads || []

    if (downloading.value) {
      const key = downloading.value
      const filename = key.split('/')[1]
      const serverTask = activeDownloads.find((d) => d.targetPath.includes(filename))

      if (!serverTask || serverTask.status === 'completed') {
        downloadStatus.value[key] = 'Downloaded'
        downloading.value = null
        stopPolling()
      } else if (serverTask.status === 'cancelled' || serverTask.status === 'failed') {
        downloadStatus.value[key] = serverTask.status === 'cancelled' ? 'Cancelled' : 'Failed'
        downloading.value = null
        stopPolling()
      }
    }
  } catch {
    // ignore polling errors
  }
}

function startPolling(): void {
  if (pollInterval) return
  pollInterval = setInterval(syncDownloadState, 1500)
}

function stopPolling(): void {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

onMounted(() => {
  syncDownloadState()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.model-hub-modal :deep(.primary-metal-button) {
  border-radius: 10px !important;
  border: 1px solid var(--color-border) !important;
  box-shadow: none !important;
}
.model-hub-modal .hub-primary-btn {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  border: 1px solid var(--color-border);
  box-shadow: none;
}
.model-hub-modal .hub-primary-btn:hover:not(:disabled) {
  background: var(--flax-primary-hover);
}
.model-hub-modal .hub-primary-btn:disabled {
  opacity: 0.4;
  box-shadow: none;
}
</style>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm titlebar-no-drag">
      <div class="model-hub-modal flex flex-col max-h-[700px] w-full max-w-[1060px] overflow-hidden rounded-[14px] border border-border bg-card shadow-2xl">

        <!-- Header -->
        <div class="flex h-[44px] items-center justify-between border-b border-border/70 px-5 shrink-0">
          <h2 class="text-[16px] font-semibold text-foreground">Model Hub</h2>
          <button
            class="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] metal-icon-button text-muted-foreground transition-colors hover:text-foreground"
            @click="emit('close')"
          >
            <X class="w-[18px] h-[18px]" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex min-h-0 flex-1">

          <!-- Sidebar -->
          <aside class="w-[220px] shrink-0 border-r border-border/70 flex flex-col">
            <div class="flex-1 overflow-y-auto p-3 config-panel-scroll space-y-0.5">
              <!-- Custom Models nav -->
              <button
                class="group flex h-[34px] w-full items-center gap-2 rounded-[10px] px-3 text-left transition-colors"
                :class="
                  activeModelId === 'custom'
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                "
                @click="activeModelId = 'custom'"
              >
                <span
                  class="h-[5px] w-[5px] shrink-0 rounded-full transition-colors"
                  :class="activeModelId === 'custom' ? 'bg-primary' : 'bg-muted-foreground/30 group-hover:bg-muted-foreground/50'"
                />
                <span class="truncate text-[14px] font-medium">Custom Models</span>
              </button>

              <!-- Divider -->
              <div class="my-2 border-t border-border/50"></div>

              <!-- Preset models -->
              <button
                v-for="model in hubModels"
                :key="model.id"
                class="group flex h-[34px] w-full items-center gap-2 rounded-[10px] px-3 text-left transition-colors"
                :class="
                  activeModelId === model.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                "
                @click="activeModelId = model.id"
              >
                <span
                  class="h-[5px] w-[5px] shrink-0 rounded-full transition-colors"
                  :class="activeModelId === model.id ? 'bg-primary' : 'bg-muted-foreground/30 group-hover:bg-muted-foreground/50'"
                />
                <span class="truncate text-[14px] font-medium">{{ model.name }}</span>
              </button>
            </div>
          </aside>

          <!-- Content -->
          <section class="flex min-w-0 flex-1 flex-col">

            <!-- Custom Models Page -->
            <template v-if="isCustomPage">
              <!-- Custom Model Header -->
              <div class="border-b border-border/70 px-5 py-4 shrink-0">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <h3 class="text-[14px] font-semibold text-foreground leading-tight">Custom Models</h3>
                    <p class="mt-1 text-[12px] text-muted-foreground leading-[17px] max-w-[75%]">Download models from HuggingFace, CivitAI, or ModelScope by pasting a direct URL.</p>
                  </div>
                  <button
                    class="flex h-[30px] w-[75px] shrink-0 items-center justify-center gap-1 rounded-[8px] border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    @click="showTokenDialog = true"
                  >
                    <Key class="w-[11px] h-[11px] shrink-0" />
                    <span style="font-size:10px;font-weight:500">Token</span>
                  </button>
                </div>
              </div>

              <div class="flex-1 overflow-y-auto p-5 config-panel-scroll">
                <div class="space-y-5">

                  <!-- URL Input -->
                  <div>
                    <label class="block text-[13px] font-medium text-foreground mb-1.5">Custom Model URL</label>
                    <input
                      v-model="customUrl"
                      type="text"
                      placeholder="Paste HuggingFace, CivitAI or ModelScope model URL..."
                      style="height:36px;width:100%;border-radius:10px;background:color-mix(in srgb, var(--color-muted) 30%, transparent);padding:0 12px;font-size:12px;color:var(--color-foreground);border:1px solid transparent;outline:none;transition:all 0.15s ease;"
                      @focus="$event.currentTarget.style.borderColor='var(--color-ring)';$event.currentTarget.style.boxShadow='0 0 0 1px var(--color-ring)'"
                      @blur="$event.currentTarget.style.borderColor='transparent';$event.currentTarget.style.boxShadow='none'"
                    />
                  </div>

                  <!-- Folder Dropdown -->
                  <div>
                    <label class="block text-[13px] font-medium text-foreground mb-1.5">Download Folder</label>
                    <Select
                      v-model="customFolder"
                      :options="CUSTOM_MODEL_FOLDERS"
                      placeholder="Select folder..."
                      class="w-full"
                    />
                  </div>

                  <!-- Download Status -->
                  <div
                    v-if="downloading"
                    class="rounded-md border border-border/30 bg-muted/10 px-4 py-3"
                  >
                    <div class="flex items-center gap-2">
                      <Loader2 class="w-4 h-4 animate-spin text-primary" />
                      <span class="text-[13px] font-medium text-foreground">
                        Downloading to {{ customFolder }}...
                      </span>
                    </div>
                    <p class="mt-1 text-[11px] text-muted-foreground truncate">{{ downloading }}</p>
                  </div>

                  <div
                    v-else-if="downloadStatus[Object.keys(downloadStatus).find(k => downloadStatus[k] === 'Downloaded') || '']"
                    class="rounded-[10px] border border-primary/10 bg-primary/5 px-4 py-3"
                  >
                    <div class="flex items-center gap-2">
                      <Check class="w-4 h-4 text-primary" />
                      <span class="text-[13px] font-medium text-primary">Download complete</span>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Custom Models Footer -->
              <div class="border-t border-border/70 px-5 py-3 shrink-0 flex items-center justify-end gap-2">
                <button
                  style="height:36px;width:140px;flex-shrink:0;border-radius:10px;border:1px solid var(--color-border);font-size:13px;font-weight:500;background:var(--color-primary);color:var(--color-primary-foreground);cursor:pointer;transition:all 0.15s ease;display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;"
                  :disabled="!customUrl.trim() || !!downloading"
                  @click="downloadCustomModel"
                >
                  <Loader2 v-if="downloading" class="w-3.5 h-3.5 animate-spin" />
                  <Download v-else class="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </template>

            <!-- Preset Model Page -->
            <template v-else>
              <!-- Model Header -->
              <div class="border-b border-border/70 px-5 py-4 shrink-0">
                <div class="flex items-start justify-between gap-4">
                  <div class="min-w-0">
                    <h3 class="text-[14px] font-semibold text-foreground leading-tight">{{ activeModel.name }}</h3>
                    <p class="mt-1 text-[12px] text-muted-foreground leading-[17px] max-w-[75%]">{{ activeModel.description }}</p>
                    <div v-if="activeModel.gated" class="mt-2 inline-flex h-[24px] items-center gap-1.5 rounded-[8px] bg-amber-500/10 px-2.5 text-[11px] font-medium text-amber-500">
                      <Key class="w-3.5 h-3.5" />
                      Gated model — requires HuggingFace token
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      class="flex h-[30px] w-[75px] shrink-0 items-center justify-center gap-1 rounded-[8px] border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      @click="showTokenDialog = true"
                    >
                      <Key class="w-[11px] h-[11px] shrink-0" />
                      <span style="font-size:10px;font-weight:500">Token</span>
                    </button>
                    <button
                      class="flex h-[30px] w-[75px] shrink-0 items-center justify-center gap-1 rounded-[8px] border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      @click="window.open(activeModel.docsUrl, '_blank')"
                    >
                      <BookOpen class="w-[11px] h-[11px] shrink-0" />
                      <span style="font-size:10px;font-weight:500">Docs</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- File List -->
              <div class="flex-1 overflow-y-auto p-5 config-panel-scroll">
                <div
                  v-if="activeModel.files.length === 0"
                  class="rounded-[10px] border border-dashed border-border/60 bg-muted/20 p-6 text-center"
                >
                  <p class="text-[13px] text-muted-foreground leading-relaxed">
                    This model has gated or variable filenames.<br />
                    Apply the configuration, then download weights from the docs.
                  </p>
                </div>

                <div v-else class="space-y-2">
                  <div
                    v-for="file in activeModel.files"
                    :key="`${file.category}/${file.filename}`"
                    class="flex items-center justify-between gap-4 rounded-md border border-border/30 bg-muted/10 px-4 py-3 transition-all hover:border-border hover:bg-muted/20"
                    :class="isDownloaded(`${file.category}/${file.filename}`) ? 'border-primary/20 bg-primary/5' : ''"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="truncate text-[13px] font-semibold text-foreground">{{ file.label }}</span>
                        <span
                          class="shrink-0 rounded-[6px] px-2 py-px text-[10px] font-medium"
                          :class="file.required ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'"
                        >
                          {{ file.required ? 'Required' : 'Optional' }}
                        </span>
                      </div>
                      <p class="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {{ file.category }}/{{ file.filename }}
                      </p>
                      <p
                        v-if="downloadStatus[`${file.category}/${file.filename}`]"
                        class="mt-0.5 text-[11px] font-medium"
                        :class="isDownloaded(`${file.category}/${file.filename}`) ? 'text-primary' : 'text-muted-foreground'"
                      >
                        {{ downloadStatus[`${file.category}/${file.filename}`] }}
                      </p>
                    </div>

                    <button
                      v-if="isDownloaded(`${file.category}/${file.filename}`)"
                      class="flex h-[30px] shrink-0 items-center gap-1.5 rounded-[8px] px-3 font-medium text-primary whitespace-nowrap"
                      disabled
                    >
                      <Check class="w-3.5 h-3.5" />
                      <span style="font-size:13px">Downloaded</span>
                    </button>
                    <button
                      v-else
                      class="flex h-[30px] shrink-0 items-center gap-1.5 rounded-[8px] border border-border/30 px-3 font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                      :disabled="!!downloading"
                      @click="downloadFile(file)"
                    >
                      <Loader2 v-if="downloading === `${file.category}/${file.filename}`" class="w-3.5 h-3.5 animate-spin" />
                      <FileDown v-else class="w-3.5 h-3.5" />
                      <span style="font-size:13px">Download</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Preset Footer -->
              <div class="border-t border-border/70 px-5 py-3 shrink-0 flex items-center justify-end gap-2">
                <button
                  class="h-[36px] w-[140px] shrink-0 rounded-[10px] border border-border/60 font-medium text-foreground transition-colors hover:bg-muted whitespace-nowrap"
                  @click="applyPreset()"
                >
                  <span style="font-size:13px">Apply Config</span>
                </button>
                <button
                  class="h-[36px] w-[140px] shrink-0 rounded-[10px] border border-border/60 font-medium transition-colors hub-primary-btn disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                  :disabled="activeModel.files.length === 0 || !!downloading"
                  @click="downloadPack"
                >
                  <span style="font-size:13px">Download &amp; Apply</span>
                </button>
              </div>
            </template>
          </section>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Token Dialog -->
  <Teleport to="body">
    <div v-if="showTokenDialog" class="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div class="flex flex-col w-full max-w-[400px] overflow-hidden rounded-[14px] border border-border bg-card shadow-2xl">
        <div class="flex h-[44px] items-center justify-between border-b border-border/70 px-5 shrink-0">
          <h2 class="text-[16px] font-semibold text-foreground">API Tokens</h2>
          <button
            class="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] metal-icon-button text-muted-foreground transition-colors hover:text-foreground"
            @click="showTokenDialog = false"
          >
            <X class="w-[18px] h-[18px]" />
          </button>
        </div>

        <div class="p-5 space-y-4">
          <div>
            <label class="block text-[13px] font-medium text-foreground mb-1.5">HuggingFace Token</label>
            <input
              v-model="hfToken"
              type="password"
              placeholder="hf_..."
              style="height:36px;width:100%;border-radius:10px;background:color-mix(in srgb, var(--color-muted) 30%, transparent);padding:0 12px;font-size:12px;color:var(--color-foreground);border:1px solid transparent;outline:none;transition:all 0.15s ease;"
              @focus="$event.currentTarget.style.borderColor='var(--color-ring)';$event.currentTarget.style.boxShadow='0 0 0 1px var(--color-ring)'"
              @blur="$event.currentTarget.style.borderColor='transparent';$event.currentTarget.style.boxShadow='none'"
            />
          </div>
          <div>
            <label class="block text-[13px] font-medium text-foreground mb-1.5">CivitAI Token</label>
            <input
              v-model="civitaiToken"
              type="password"
              placeholder="CivitAI token..."
              style="height:36px;width:100%;border-radius:10px;background:color-mix(in srgb, var(--color-muted) 30%, transparent);padding:0 12px;font-size:12px;color:var(--color-foreground);border:1px solid transparent;outline:none;transition:all 0.15s ease;"
              @focus="$event.currentTarget.style.borderColor='var(--color-ring)';$event.currentTarget.style.boxShadow='0 0 0 1px var(--color-ring)'"
              @blur="$event.currentTarget.style.borderColor='transparent';$event.currentTarget.style.boxShadow='none'"
            />
          </div>
          <div>
            <label class="block text-[13px] font-medium text-foreground mb-1.5">ModelScope Token</label>
            <input
              v-model="modelscopeToken"
              type="password"
              placeholder="ModelScope token..."
              style="height:36px;width:100%;border-radius:10px;background:color-mix(in srgb, var(--color-muted) 30%, transparent);padding:0 12px;font-size:12px;color:var(--color-foreground);border:1px solid transparent;outline:none;transition:all 0.15s ease;"
              @focus="$event.currentTarget.style.borderColor='var(--color-ring)';$event.currentTarget.style.boxShadow='0 0 0 1px var(--color-ring)'"
              @blur="$event.currentTarget.style.borderColor='transparent';$event.currentTarget.style.boxShadow='none'"
            />
          </div>
        </div>

        <div class="border-t border-border/70 px-5 py-3 shrink-0 flex items-center justify-end">
          <button
            style="height:36px;width:140px;flex-shrink:0;border-radius:10px;border:1px solid var(--color-border);font-size:13px;font-weight:500;background:var(--color-primary);color:var(--color-primary-foreground);cursor:pointer;transition:all 0.15s ease;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;"
            @mouseenter="$event.currentTarget.style.opacity='0.9'"
            @mouseleave="$event.currentTarget.style.opacity='1'"
            @click="saveTokens(); showTokenDialog = false"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

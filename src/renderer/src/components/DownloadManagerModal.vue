<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Download, Loader2, Pause, Play, X, XCircle } from 'lucide-vue-next'
import { apiGet, apiPost } from '@/services/api'

interface DownloadTask {
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
}

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const downloads = ref<DownloadTask[]>([])
let pollInterval: ReturnType<typeof setInterval> | null = null

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

function progressPercent(task: DownloadTask): number {
  if (!task.totalBytes || task.totalBytes <= 0) return 0
  return Math.min(100, Math.max(0, (task.receivedBytes / task.totalBytes) * 100))
}

async function fetchDownloads(): Promise<void> {
  const result = await apiGet<{ downloads: DownloadTask[] }>('/api/downloads')
  downloads.value = result.downloads || []
}

async function cancelDownload(id: string): Promise<void> {
  await apiPost(`/api/downloads/${id}/cancel`, {})
  await fetchDownloads()
}

async function pauseDownload(id: string): Promise<void> {
  await apiPost(`/api/downloads/${id}/pause`, {})
  await fetchDownloads()
}

async function resumeDownload(id: string): Promise<void> {
  await apiPost(`/api/downloads/${id}/resume`, {})
  await fetchDownloads()
}

function startPolling(): void {
  if (pollInterval) return
  pollInterval = setInterval(fetchDownloads, 1000)
}

function stopPolling(): void {
  if (!pollInterval) return
  clearInterval(pollInterval)
  pollInterval = null
}

onMounted(() => {
  fetchDownloads()
  startPolling()
})

onUnmounted(stopPolling)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm titlebar-no-drag"
    >
      <div class="download-manager-shell flex max-h-[80vh] w-full max-w-[1060px] flex-col overflow-hidden rounded-[14px] border border-border bg-card shadow-2xl">
        <header class="download-manager-header flex h-[44px] shrink-0 items-center justify-between border-b border-border/70 px-5">
          <h2 class="text-[16px] font-semibold text-foreground">Download Manager</h2>
          <button
            class="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] metal-icon-button text-muted-foreground transition-colors hover:text-foreground"
            @click="emit('close')"
          >
            <X class="w-[18px] h-[18px]" />
          </button>
        </header>

        <div class="download-manager-list flex-1 overflow-y-auto p-5 config-panel-scroll">
          <div
            v-if="downloads.length === 0"
            class="download-manager-empty rounded-[10px] border border-border/60 p-6 text-center text-sm text-muted-foreground"
          >
            <div class="download-manager-icon mx-auto mb-3 flex h-12 w-12 items-center justify-center text-white">
              <Download class="h-5 w-5" />
            </div>
            <p class="font-semibold text-foreground">No downloads yet</p>
            <p class="mt-1 text-xs text-muted-foreground">
              Start a model or backend download to track it here.
            </p>
          </div>

          <div v-else class="space-y-2">
            <article
              v-for="task in downloads"
              :key="task.id"
              class="download-manager-card rounded-[10px] border border-border/60 px-4 py-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <Loader2 v-if="task.status === 'downloading'" class="w-3.5 h-3.5 animate-spin text-primary" />
                    <Pause v-else-if="task.status === 'paused'" class="w-3.5 h-3.5 text-yellow-500" />
                    <XCircle v-else-if="task.status === 'failed' || task.status === 'cancelled'" class="w-3.5 h-3.5 text-destructive" />
                    <Download v-else class="w-3.5 h-3.5 text-green-500" />
                    <span class="truncate text-[13px] font-semibold text-foreground">{{ task.label }}</span>
                    <span
                      class="shrink-0 rounded-[6px] px-2 py-px text-[10px] font-medium"
                      :class="{
                        'bg-primary/15 text-primary': task.status === 'downloading',
                        'bg-yellow-500/15 text-yellow-500': task.status === 'paused',
                        'bg-green-500/15 text-green-600': task.status === 'completed',
                        'bg-destructive/15 text-destructive': task.status === 'failed' || task.status === 'cancelled'
                      }"
                    >
                      {{ task.status }}
                    </span>
                  </div>
                  <p class="mt-0.5 truncate text-[11px] text-muted-foreground" :title="task.targetPath">
                    {{ task.targetPath }}
                  </p>
                </div>

                <div v-if="task.status === 'downloading' || task.status === 'paused'" class="flex items-center gap-2">
                  <button
                    v-if="task.status === 'downloading'"
                    style="height:36px;width:140px;flex-shrink:0;border-radius:10px;border:1px solid color-mix(in srgb, var(--color-destructive) 34%, transparent);font-size:13px;font-weight:500;background:color-mix(in srgb, var(--color-destructive) 10%, transparent);color:var(--color-destructive);cursor:pointer;transition:all 0.15s ease;display:inline-flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap;"
                    @mouseenter="$event.currentTarget.style.borderColor='var(--color-destructive)';$event.currentTarget.style.background='var(--color-destructive)';$event.currentTarget.style.color='var(--color-destructive-foreground)'"
                    @mouseleave="$event.currentTarget.style.borderColor='color-mix(in srgb, var(--color-destructive) 34%, transparent)';$event.currentTarget.style.background='color-mix(in srgb, var(--color-destructive) 10%, transparent)';$event.currentTarget.style.color='var(--color-destructive)'"
                    @click="pauseDownload(task.id)"
                  >
                    <Pause style="width:12px;height:12px;" />
                    Stop
                  </button>
                  <button
                    v-if="task.status === 'paused'"
                    style="height:36px;width:140px;flex-shrink:0;border-radius:10px;border:1px solid var(--color-border);font-size:13px;font-weight:500;background:var(--color-primary);color:var(--color-primary-foreground);cursor:pointer;transition:all 0.15s ease;display:inline-flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap;"
                    @mouseenter="$event.currentTarget.style.opacity='0.9'"
                    @mouseleave="$event.currentTarget.style.opacity='1'"
                    @click="resumeDownload(task.id)"
                  >
                    <Play style="width:12px;height:12px;" />
                    Resume
                  </button>
                  <button
                    style="height:36px;width:140px;flex-shrink:0;border-radius:10px;border:1px solid var(--color-border);font-size:13px;font-weight:500;background:transparent;color:var(--color-muted-foreground);cursor:pointer;transition:all 0.15s ease;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;"
                    @mouseenter="$event.currentTarget.style.background='var(--color-muted)';$event.currentTarget.style.color='var(--color-foreground)'"
                    @mouseleave="$event.currentTarget.style.background='transparent';$event.currentTarget.style.color='var(--color-muted-foreground)'"
                    @click="cancelDownload(task.id)"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div class="download-manager-progress mt-2 h-2 overflow-hidden rounded-full">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="!task.totalBytes && task.status === 'downloading' ? 'w-1/3 animate-pulse' : ''"
                  :style="task.totalBytes ? { width: progressPercent(task) + '%' } : undefined"
                ></div>
              </div>

              <div class="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                <span>
                  {{ formatBytes(task.receivedBytes) }}<template v-if="task.totalBytes"> / {{ formatBytes(task.totalBytes) }}</template>
                </span>
                <span v-if="task.totalBytes">{{ progressPercent(task).toFixed(0) }}%</span>
                <span v-else>Size unknown</span>
              </div>

              <p v-if="task.error" class="mt-2 text-xs text-destructive">{{ task.error }}</p>
            </article>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

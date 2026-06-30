<script setup lang="ts">
import type { Component } from 'vue'
import {
  Brush,
  Download,
  ImageIcon,
  Images,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  Terminal
} from 'lucide-vue-next'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useConfigStore } from '@/stores/config'
import { useRuntimeStatus } from '@/composables/useRuntimeStatus'
import DownloadManagerModal from '@/components/DownloadManagerModal.vue'
import ModelHubModal from '@/components/ModelHubModal.vue'
import Tooltip from '../ui/Tooltip.vue'

interface NavItem {
  id: string
  label: string
  icon: Component
}

const props = defineProps<{
  currentTab: string
  sidebarCollapsed: boolean
  setupNeeded?: boolean
}>()

const emit = defineEmits<{
  toggleSidebar: []
  toggleMobileConfig: []
  toggleLogs: []
  openSetup: []
}>()

const router = useRouter()
const route = useRoute()

const routeMap: Record<string, string> = {
  text2image: '/text2image',
  edit: '/edit',
  gallery: '/gallery',
  settings: '/settings'
}

const navItems: NavItem[] = [
  { id: 'text2image', label: 'Text2Image', icon: ImageIcon },
  { id: 'edit', label: 'Edit', icon: Brush },
  { id: 'gallery', label: 'Gallery', icon: Images },
  { id: 'settings', label: 'Settings', icon: Settings }
]

const isDark = ref(false)
const showModelHub = ref(false)
const showDownloadManager = ref(false)
const configStore = useConfigStore()
const { config } = storeToRefs(configStore)
const {
  sdServerRunning,
  backendVersion,
  backendValid,
  runtimeState,
  runtimeLabel,
  startRuntimeStatusPolling,
  stopRuntimeStatusPolling
} = useRuntimeStatus()

const statusDotClass = computed(() => {
  if (runtimeState.value === 'online') return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.68)]'
  if (runtimeState.value === 'offline')
    return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.45)]'
  return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.52)]'
})

const statusHint = computed(() => {
  if (config.value.backendMode === 'server' && backendValid.value && !sdServerRunning.value) {
    return 'Server mode is selected but sd-server is offline.'
  }
  if (!backendValid.value) return 'Backend binary is not valid.'
  return config.value.backendMode === 'server' ? 'Server mode active.' : 'CLI mode active.'
})

function applyTheme(dark: boolean): void {
  isDark.value = dark
  document.documentElement.classList.toggle('dark', dark)
  localStorage.setItem('stable-theme', dark ? 'dark' : 'light')
}

onMounted(() => {
  applyTheme(localStorage.getItem('stable-theme') !== 'light')
  startRuntimeStatusPolling()
})

onUnmounted(() => {
  stopRuntimeStatusPolling()
})

function toggleTheme(): void {
  applyTheme(!isDark.value)
}

function isActive(id: string): boolean {
  return props.currentTab === id
}

function handleNavClick(id: string): void {
  router.push(routeMap[id] || '/' + id)
}
</script>

<template>
  <header
    class="titlebar-shell relative z-[10000] h-[44px] flex items-center justify-between select-none titlebar-drag titlebar-border"
  >
    <nav class="titlebar-shell h-full hidden md:flex items-center gap-2 px-4 titlebar-no-drag">
      <button
        @click="emit('toggleSidebar')"
        class="h-[34px] w-[34px] shrink-0 metal-icon-button flex items-center justify-center text-muted-foreground hover:text-foreground titlebar-no-drag rounded-[10px]"
        :aria-label="props.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        type="button"
      >
        <PanelLeftOpen v-if="props.sidebarCollapsed" class="w-[18px] h-[18px]" />
        <PanelLeftClose v-else class="w-[18px] h-[18px]" />
      </button>

      <div class="mx-1 h-4 w-px bg-border/80"></div>

      <Tooltip v-for="item in navItems" :key="item.id" :text="item.label">
        <button
          @click="handleNavClick(item.id)"
          class="h-[34px] w-[34px] metal-icon-button flex items-center justify-center titlebar-no-drag rounded-[10px]"
          :class="[
            isActive(item.id)
              ? 'primary-metal-button'
              : 'text-muted-foreground hover:text-foreground'
          ]"
          type="button"
        >
          <component :is="item.icon" class="w-[18px] h-[18px]" />
        </button>
      </Tooltip>

      <div
        class="runtime-status-dot-wrap group relative flex h-[34px] items-center justify-center titlebar-no-drag"
      >
        <button
          class="runtime-status-dot-button flex h-[34px] w-[34px] items-center justify-center"
          type="button"
          :aria-label="runtimeLabel"
        >
          <span class="h-2.5 w-2.5 rounded-full" :class="statusDotClass"></span>
        </button>

        <div
          class="runtime-status-popover pointer-events-none absolute left-0 top-full z-[10001] mt-2 w-64 opacity-0 translate-y-1 transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-y-0"
        >
          <div class="rounded-lg border border-border bg-card p-3 text-xs shadow-xl">
            <div class="mb-2 flex items-center gap-2 border-b border-border/70 pb-2">
              <span class="h-2 w-2 rounded-full" :class="statusDotClass"></span>
              <span class="font-semibold text-foreground">Runtime status</span>
            </div>
            <div class="space-y-1.5 text-muted-foreground">
              <div class="flex items-center justify-between gap-3">
                <span>Server</span>
                <span
                  class="font-medium"
                  :class="sdServerRunning ? 'text-green-600' : 'text-yellow-600'"
                  >{{ sdServerRunning ? 'Online' : 'Offline' }}</span
                >
              </div>
              <div class="flex items-center justify-between gap-3">
                <span>Backend</span>
                <span
                  class="max-w-36 truncate font-medium"
                  :class="backendValid ? 'text-foreground' : 'text-red-500'"
                  :title="backendVersion"
                  >{{ backendVersion }}</span
                >
              </div>
              <div class="flex items-center justify-between gap-3">
                <span>Mode</span>
                <span class="font-medium text-foreground">{{
                  config.backendMode.toUpperCase()
                }}</span>
              </div>
            </div>
            <p
              class="mt-2 border-t border-border/70 pt-2 text-[11px] leading-4 text-muted-foreground"
            >
              {{ statusHint }}
            </p>
          </div>
        </div>
      </div>

    </nav>

    <!-- Center: Model Hub -->
    <div
      class="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 titlebar-no-drag"
    >
      <button
        @click="showModelHub = true"
        class="h-[34px] rounded-[10px] px-3 metal-icon-button flex items-center justify-center text-muted-foreground hover:text-foreground titlebar-no-drag"
        type="button"
      >
        <span style="font-size:15px;font-weight:700">Model Hub</span>
      </button>
    </div>

    <div class="flex min-w-0 flex-1 items-center px-3 md:hidden">
      <span class="truncate text-sm font-semibold tracking-tight">StableUI</span>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center h-full gap-2 pr-4 titlebar-no-drag">
      <!-- Mobile config toggle (shown on small screens only) -->
      <button
        @click="emit('toggleMobileConfig')"
        class="h-[34px] w-[34px] metal-icon-button flex items-center justify-center text-muted-foreground hover:text-foreground titlebar-no-drag md:hidden rounded-[10px]"
        type="button"
        title="Settings"
        aria-label="Open mobile settings"
      >
        <PanelLeftClose class="w-[18px] h-[18px]" />
      </button>

      <button
        v-if="props.setupNeeded"
        class="h-[34px] rounded-[10px] px-2 text-[13px] font-medium flex items-center gap-1.5 bg-yellow-500/12 text-yellow-600 hover:bg-yellow-500/20 titlebar-no-drag md:hidden"
        type="button"
        @click="emit('openSetup')"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
        Setup
      </button>

      <button
        @click="showDownloadManager = true"
        class="h-[34px] w-[34px] metal-icon-button flex items-center justify-center text-muted-foreground hover:text-foreground titlebar-no-drag md:hidden rounded-[10px]"
        type="button"
        title="Downloads"
        aria-label="Open download manager"
      >
        <Download class="w-[18px] h-[18px]" />
      </button>

      <button
        @click="emit('toggleLogs')"
        class="h-[34px] w-[34px] metal-icon-button flex items-center justify-center text-muted-foreground hover:text-foreground titlebar-no-drag md:hidden rounded-[10px]"
        type="button"
        title="Server Logs"
        aria-label="Open server logs"
      >
        <Terminal class="w-[18px] h-[18px]" />
      </button>

      <button
        v-if="props.setupNeeded"
        class="hidden h-[34px] rounded-[10px] px-2 text-[13px] font-medium md:flex items-center gap-1.5 bg-yellow-500/12 text-yellow-600 hover:bg-yellow-500/20 titlebar-no-drag"
        type="button"
        @click="emit('openSetup')"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
        Setup
      </button>

      <Tooltip text="Downloads">
        <button
          @click="showDownloadManager = true"
          class="hidden h-[34px] w-[34px] metal-icon-button md:flex items-center justify-center text-muted-foreground hover:text-foreground titlebar-no-drag rounded-[10px]"
          type="button"
        >
          <Download class="w-[18px] h-[18px]" />
        </button>
      </Tooltip>

      <Tooltip text="Server Logs">
        <button
          @click="emit('toggleLogs')"
          class="hidden h-[34px] w-[34px] metal-icon-button md:flex items-center justify-center text-muted-foreground hover:text-foreground titlebar-no-drag rounded-[10px]"
          type="button"
        >
          <Terminal class="w-[18px] h-[18px]" />
        </button>
      </Tooltip>

      <Tooltip :text="isDark ? 'Light mode' : 'Dark mode'">
        <button
          @click="toggleTheme"
          class="h-[34px] w-[34px] metal-icon-button flex items-center justify-center text-muted-foreground hover:text-foreground titlebar-no-drag rounded-[10px]"
          type="button"
        >
          <Sun v-if="isDark" class="w-[18px] h-[18px]" />
          <Moon v-else class="w-[18px] h-[18px]" />
        </button>
      </Tooltip>
    </div>
    <ModelHubModal :open="showModelHub" @close="showModelHub = false" />
    <DownloadManagerModal :open="showDownloadManager" @close="showDownloadManager = false" />
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Titlebar from './components/layout/Titlebar.vue'
import ConfigPanel from './components/layout/ConfigPanel.vue'
import MobileNav from './components/layout/MobileNav.vue'
import ToastContainer from './components/ToastContainer.vue'
import FloatingLogPanel from './components/FloatingLogPanel.vue'
import { initializeApi } from './services/api'
import { useSetup } from './composables/useSetup'
import SetupWizard from './components/SetupWizard.vue'

const route = useRoute()
const router = useRouter()
const { isSetupNeeded, loadState, skipForNow, completeSetup, reopenSetup } = useSetup()

const showMobileConfig = ref(false)
const sidebarCollapsed = ref(false)
const showFloatingLogs = ref(false)

const currentTab = computed(() => {
  const name = route.name as string
  return name?.toLowerCase() || 'text2image'
})

const routeMap: Record<string, string> = {
  text2image: 'Text2Image',
  edit: 'Edit',
  gallery: 'Gallery',
  settings: 'Settings'
}

function navigateToTab(tab: string): void {
  const routeName = routeMap[tab] || tab
  router.push({ name: routeName })
}

onMounted(async () => {
  const hostname = window.location.hostname || 'localhost'
  const port = parseInt(window.location.port || '3000', 10)
  initializeApi(port)

  await loadState()
})
</script>

<template>
  <div class="flex flex-col h-screen text-foreground overflow-hidden select-none window-border p-3 md:p-4">
    <Titlebar
      :current-tab="currentTab"
      :sidebar-collapsed="sidebarCollapsed"
      :setup-needed="isSetupNeeded"
      @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed"
      @toggle-mobile-config="showMobileConfig = !showMobileConfig"
      @toggle-logs="showFloatingLogs = !showFloatingLogs"
      @open-setup="reopenSetup"
    />
    <div class="flex flex-1 min-h-0 overflow-hidden relative gap-2 pt-2">
      <ConfigPanel
        :collapsed="sidebarCollapsed"
        class="shrink-0 transition-[width] duration-300 ease-out"
        :class="[
          sidebarCollapsed
            ? 'md:flex md:w-[63px] md:relative md:translate-x-0'
            : 'md:flex md:w-[392px] md:relative md:translate-x-0',
          showMobileConfig
            ? 'fixed inset-0 z-50 w-full translate-x-0 flex md:absolute'
            : 'hidden md:flex'
        ]"
        @close="showMobileConfig = false"
        @expand="sidebarCollapsed = false"
      />
      <main class="main-panel flex-1 min-h-0 overflow-hidden flex flex-col relative w-full">
        <router-view v-slot="{ Component, route }">
          <transition
            name="route"
            mode="out-in"
            enter-active-class="transition-all duration-300 ease-out"
            leave-active-class="transition-all duration-200 ease-in"
            enter-from-class="opacity-0 translate-y-3 scale-[0.98]"
            leave-to-class="opacity-0 -translate-y-2 scale-[0.99]"
          >
            <div :key="route.path" class="h-full w-full">
              <keep-alive>
                <component :is="Component" />
              </keep-alive>
            </div>
          </transition>
        </router-view>
      </main>
    </div>
    <MobileNav class="md:hidden" :current-tab="currentTab" @navigate="navigateToTab" />
    <ToastContainer />
    <FloatingLogPanel v-model="showFloatingLogs" />
    <SetupWizard v-if="isSetupNeeded" @done="completeSetup" @skip="skipForNow" />
  </div>
</template>

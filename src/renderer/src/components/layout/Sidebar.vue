<script setup lang="ts">
import type { Component } from 'vue'
import { ImageIcon, Brush, Images, Settings } from 'lucide-vue-next'

interface NavItem {
  id: string
  label: string
  icon: Component
}

const props = defineProps<{
  currentTab: string
}>()

const emit = defineEmits<{
  navigate: [tab: string]
}>()

const navItems: NavItem[] = [
  { id: 'text2image', label: 'Text2Image', icon: ImageIcon },
  { id: 'edit', label: 'Edit', icon: Brush },
  { id: 'gallery', label: 'Gallery', icon: Images },
  { id: 'settings', label: 'Settings', icon: Settings }
]

function isActive(id: string): boolean {
  return props.currentTab === id
}

function handleNavClick(id: string): void {
  emit('navigate', id)
}
</script>

<template>
  <aside
    class="w-16 flex flex-col items-center py-3 rounded-2xl border border-border/80 bg-card/85 shadow-sm backdrop-blur-xl"
  >
    <nav class="flex flex-col gap-1.5 flex-1">
      <button
        v-for="item in navItems"
        :key="item.id"
        @click="handleNavClick(item.id)"
        class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-150"
        :class="[
          isActive(item.id)
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        ]"
        :title="item.label"
      >
        <component :is="item.icon" class="w-4.5 h-4.5" />
      </button>
    </nav>
  </aside>
</template>

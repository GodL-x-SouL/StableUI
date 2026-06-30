import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { MotionPlugin } from '@vueuse/motion'

import App from './App.vue'
import './assets/main.css'

if (localStorage.getItem('stable-theme') !== 'light') {
  document.documentElement.classList.add('dark')
}

import Text2Image from './views/Text2Image.vue'
import Edit from './views/Edit.vue'
import Gallery from './views/Gallery.vue'
import Settings from './views/Settings.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/text2image' },
    { path: '/text2image', name: 'Text2Image', component: Text2Image },
    { path: '/edit', name: 'Edit', component: Edit },
    { path: '/gallery', name: 'Gallery', component: Gallery },
    { path: '/settings', name: 'Settings', component: Settings }
  ]
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(MotionPlugin)

app.mount('#app')

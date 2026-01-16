import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/authStore'

const app = createApp(App)

/* ===================== */
/* Pinia 생성 + 등록 */
/* ===================== */
const pinia = createPinia()
app.use(pinia)

/* ===================== */
/* Router / UI */
/* ===================== */
app.use(router)
app.use(ElementPlus)

/* ===================== */
/* Store 사용 (pinia 등록 이후) */
/* ===================== */
const authStore = useAuthStore(pinia) // 🔥 핵심
authStore.loadFromStorage()

app.mount('#app')

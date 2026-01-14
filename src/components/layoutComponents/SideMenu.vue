<template>
  <aside class="side">
    <div class="hotel">
      <strong>Hotel Name</strong>
    </div>

    <nav class="menu-list">
      <div
          v-for="item in menus"
          :key="item.path"
          class="menu"
          :class="{ active: isActive(item.path) }"
          @click="go(item.path)"
      >
        {{ item.label }}
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const menus = [
  { label: '리포트', path: '/reports' },
  { label: '고객관리', path: '/customers' },
  { label: '고객활동', path: '/activities' },
  { label: '고객의소리', path: '/voc' },
  { label: '메시지', path: '/messages' },
  { label: '세팅', path: '/setting' },
  { label: '시스템설정', path: '/system' },
]

const go = (path) => router.push(path)
const isActive = (path) => route.path.startsWith(path)
</script>

<style scoped>
.side {
  width: 220px;
  background: #ffffff;
  border-right: 1px solid #e6eaf0;
  height: 100%;
}

.hotel {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #e6eaf0;
}

.menu-list {
  padding: 12px 8px;
}

.menu {
  padding: 12px 16px;
  margin-bottom: 6px;
  border-radius: 6px;
  cursor: pointer;
  color: #2e3a45;
  font-size: 14px;
}

.menu:hover {
  background: #f0f4f8;
}

.menu.active {
  background: #e6f0ff;
  color: #1d4ed8;
  font-weight: 600;
}
</style>

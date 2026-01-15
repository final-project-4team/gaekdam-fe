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
  border-right: 1px solid #eef2f7;
  height: 100%;
  padding: 12px 0 0 0;
}

.hotel {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #eef2f7;
  font-size: 15px;
}

/* 메뉴 리스트 */
.menu-list {
  padding: 12px 10px;
}

/* 메뉴 아이템 */
.menu {
  position: relative;
  padding: 11px 14px;
  margin-bottom: 6px;
  border-radius: 10px;
  cursor: pointer;
  color: #475569;
  font-size: 14px;
  transition: all 0.15s ease;
}

/* hover */
.menu:hover {
  background: #f8fafc;
}

/* active */
.menu.active {
  background: #f1f5ff;
  color: #7191e6;
  font-weight: 600;
}

/* 왼쪽 포인트 바 */
.menu.active::before {
  content: '';
  position: absolute;
  left: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 70%;
  border-radius: 4px;
  background: linear-gradient(
      to bottom,
      #60a5fa,
      #2563eb
  );
}
</style>

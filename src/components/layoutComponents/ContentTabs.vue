<template>
  <div class="tabs">
    <div
        v-for="tab in tabs"
        :key="tab.path"
        class="tab"
        :class="{ active: isActive(tab.path) }"
        @click="go(tab.path)"
    >
      {{ tab.label }}
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'

defineProps({
  tabs: {
    type: Array,
    required: true,
    // [{ label: string, path: string }]
  },
})

const router = useRouter()
const route = useRoute()

const go = (path) => router.push(path)
const isActive = (path) => route.path === path
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 24px;
}

/* 기본 탭 */
.tab {
  padding: 10px 2px;
  font-size: 14px;
  color: #7b8794;
  cursor: pointer;
  position: relative;
  font-weight: 500;
}

.tab:hover {
  color: #2e3a45;
}

/* active 탭 */
.tab.active {
  color: #1d4ed8;
  font-weight: 600;
}

.tab.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: #1d4ed8;
  border-radius: 2px;
}
</style>

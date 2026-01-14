<template>
  <div class="tabs">
    <span class="tab" @click="go('all')">전체</span>
    <span class="tab" @click="go('check')">체크인/체크아웃</span>
    <span class="tab" @click="go('facility')">부대시설 이용</span>
    <span class="tab" @click="go('timeline')">타임라인</span>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const go = (p) => router.push(`/activities/${p}`)
</script>

<style scoped>
.tabs {
  background: white;
  padding: 8px 16px;
  border-bottom: 1px solid #e6eaf0;
}
.tab {
  margin-right: 16px;
  cursor: pointer;
  font-weight: 600;
}
</style>

<template>
  <div class="crm-root">
    <TopBar />

    <div class="crm-body">
      <SideMenu />
      <div class="crm-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import TopBar from '@/components/layoutComponents/TopBar.vue'
import SideMenu from '@/components/layoutComponents/SideMenu.vue'
</script>

<style scoped>
.crm-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* TopBar 제외한 전체 */
.crm-body {
  flex: 1;
  display: flex;
  background: #f4f7fb;
  overflow: hidden; /* body 자체는 스크롤 금지 */
}

/* 메인 컨텐츠만 스크롤 */
.crm-content {
  flex: 1;
  padding: 10px 14px;
  overflow-y: auto; /* 여기서만 스크롤 */
}
</style>

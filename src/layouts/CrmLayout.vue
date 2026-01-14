<template>
  <div class="crm-root">
    <!-- 전역 상단 -->
    <TopBar />

    <div class="crm-body">
      <!-- 전역 사이드 -->
      <SideMenu />

      <!-- 메인 컨텐츠 -->
      <div class="crm-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import TopBar from '@/components/common/TopBar.vue'
import SideMenu from '@/components/common/SideMenu.vue'
</script>

<style scoped>
.crm-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.crm-body {
  flex: 1;
  display: flex;
}

.crm-content {
  flex: 1;
  background: #f4f7fb;
  padding: 16px;
  overflow: auto;
}
</style>

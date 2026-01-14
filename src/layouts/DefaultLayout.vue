<template>
  <div class="layout">
    <SideMenu />
    <div class="main">
      <TopBar />
      <PageContainer>
        <router-view />
      </PageContainer>
    </div>
  </div>
</template>

<script setup>
import SideMenu from '@/components/layout/SideMenu.vue'
import TopBar from '@/components/layout/TopBar.vue'
import PageContainer from '@/components/layout/PageContainer.vue'
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f4f7fb;
}
</style>
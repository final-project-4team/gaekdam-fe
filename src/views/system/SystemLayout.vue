<template>
  <MainContentLayout>
    <template #tabs>
      <ContentTabs :tabs="tabs" />
    </template>

    <router-view />
  </MainContentLayout>
</template>

<script setup>
import MainContentLayout from '@/components/layoutComponents/MainContentLayout.vue'
import ContentTabs from '@/components/layoutComponents/ContentTabs.vue'


const tabs = [
  { label: '시스템 로그', path: '/system/systemLog' },
  { label: '마이페이지', path: '/system/myPage' },
]
</script>
<template>
  <MainContentLayout>
    <template #tabs>
      <ContentTabs :tabs="Voctabs" />
    </template>

    <router-view />
  </MainContentLayout>
</template>

<script setup>
import MainContentLayout from '@/components/layoutComponents/MainContentLayout.vue'
import ContentTabs from '@/components/layoutComponents/ContentTabs.vue'


const Voctabs = [
  { label: '전체', path: '/voc/inquiries' },
  { label: '사건/사고 관리', path: '/voc/incidents' },
]
</script>
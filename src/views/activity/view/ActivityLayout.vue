<template>
  <MainContentLayout>
    <template #tabs>
      <ContentTabs :tabs="activityTabs" />
    </template>

    <router-view />
  </MainContentLayout>
</template>

<script setup>
import MainContentLayout from '@/components/layoutComponents/MainContentLayout.vue'
import ContentTabs from '@/components/layoutComponents/ContentTabs.vue'

const activityTabs = [
  { label: '전체', path: '/activities/all' },
  { label: '체크인 / 체크아웃', path: '/activities/check' },
  { label: '부대시설 이용', path: '/activities/facility' },
  { label: '타임라인', path: '/activities/timeline' },
]
</script>

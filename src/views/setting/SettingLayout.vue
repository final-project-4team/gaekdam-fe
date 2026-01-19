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
  { label: '직원 관리', path: '/setting/employee' },
  { label: '목표 관리', path: '/setting/objective' },
  { label: '부서 관리', path: '/setting/department' },
  { label: '권한 관리', path: '/setting/permission' },
  { label: '멤버십 관리', path: '/setting/membership' },
  { label: '로열티 관리', path: '/setting/loyalty' },
]
</script>

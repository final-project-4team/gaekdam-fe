<template>
  <div class="top-tabs">
    <div v-for="(l, i) in layouts" :key="l.id" class="top-tab" :class="{ active: selectedIndex === i }" @click="$emit('select', i)">
      <span>{{ l.name }}</span>
      <span class="top-delete"><span @click.stop><slot name="delete" :layout="l"></slot></span></span>
    </div>
    <BaseButton size="sm" @click="$emit('create')" class="add-tab">+</BaseButton>
  </div>
</template>

<script setup>
/**
 * ReportTopTabs.vue
 * - 목적: 상단 레이아웃 탭 UI를 presentation으로 처리
 * - props:
 *    layouts: Array - 레이아웃 목록
 *    selectedIndex: Number - 현재 선택된 인덱스
 * - emits:
 *    select(index), create()
 * - slot: "delete"(layout) - 탭 우측에 삭제 버튼을 삽입하기 위한 slot
 */
import BaseButton from '@/components/common/button/BaseButton.vue'
import { defineProps } from 'vue'
const props = defineProps({ layouts: Array, selectedIndex: Number })
</script>

<style scoped>
.top-tabs { display:flex; gap:8px; align-items:center; padding:6px 10px; }
.top-tab { padding:8px 14px; border-radius:8px; background:#f5f7fb; color:#4b5563; cursor:pointer; }
.top-tab.active { background: linear-gradient(135deg,#e6f0ff,#dfeaff); color:#1e3a8a; font-weight:600 }
.add-tab { margin-left:6px }
.top-tab { position: relative }
.top-delete { position: relative; display:inline-flex }
</style>

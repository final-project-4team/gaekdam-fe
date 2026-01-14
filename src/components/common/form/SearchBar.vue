<template>
  <div class="search-bar">
    <input
        class="input"
        :placeholder="placeholder"
        v-model="keyword"
    />

    <BaseButton @click="search">검색</BaseButton>
    <BaseButton @click="$emit('detail')">상세 검색</BaseButton>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseButton from '@/components/common/button/BaseButton.vue'

const keyword = ref('')

defineProps({
  placeholder: {
    type: String,
    default: '검색어 입력',
  },
})

const emit = defineEmits(['search', 'detail'])

const search = () => {
  emit('search', keyword.value)
}
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input {
  width: 240px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 13px;
}
</style>

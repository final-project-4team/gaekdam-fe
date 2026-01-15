<template>
  <div class="search-bar">
    <!-- 검색 기준 (옵션) -->
    <div v-if="searchTypes?.length" class="select-wrap">
      <select v-model="innerType">
        <option
            v-for="item in searchTypes"
            :key="item.value"
            :value="item.value"
        >
          {{ item.label }}
        </option>
      </select>
    </div>

    <!-- 입력 -->
    <div class="input-wrap">
      <input
          class="input"
          :placeholder="placeholder"
          v-model="keyword"
          @keyup.enter="search"
      />
    </div>

    <!-- 버튼들 -->
    <BaseButton
        type="ghost"
        size="sm"
        @click="search"
    >
      검색
    </BaseButton>

    <BaseButton
        v-if="showDetail"
        type="primary"
        size="sm"
        @click="$emit('detail')"
    >
      상세 검색
    </BaseButton>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import BaseButton from '@/components/common/button/BaseButton.vue'

const props = defineProps({
  placeholder: {
    type: String,
    default: '검색어 입력',
  },
  searchTypes: {
    type: Array,
    default: () => [], // [{ label, value }]
  },
  type: String,
  showDetail: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['search', 'detail', 'update:type'])

const keyword = ref('')
const innerType = ref(props.type || '')

watch(innerType, (v) => emit('update:type', v))

const search = () => {
  emit('search', {
    keyword: keyword.value,
    type: innerType.value,
  })
}
</script>


<style scoped>
.search-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* select */
.select-wrap select {
  height: 32px;
  padding: 0 10px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 13px;
}

/* input */
.input-wrap {
  position: relative;
}

.input {
  width: 260px;
  height: 32px;
  padding: 0 36px 0 12px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-size: 13px;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  border-color: #bfdbfe;
  box-shadow: 0 0 0 1px rgba(191,219,254,.4);
}


</style>

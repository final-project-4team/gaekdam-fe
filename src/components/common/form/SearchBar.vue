<template>
  <div class="search-bar">
    <!-- 검색 기준 -->
    <div v-if="searchTypes?.length" class="select-wrap">
      <select v-model="selectedKey">
        <option
            v-for="item in searchTypes"
            :key="item.key"
            :value="item.key"
        >
          {{ item.label }}
        </option>
      </select>
    </div>

    <!-- 입력 -->
    <div class="input-wrap">
      <!-- select 타입 -->
      <select
          v-if="current?.type === 'select'"
          class="input"
          v-model="value"
      >
        <option
            v-for="opt in current.options"
            :key="opt.value"
            :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>

      <!-- 일반 입력 -->
      <input
          v-else
          class="input"
          :type="current?.type === 'number' ? 'number' : 'text'"
          :placeholder="placeholder"
          v-model="value"
          @keyup.enter="submit"
      />
    </div>

    <!-- 버튼 -->
    <BaseButton type="ghost" size="sm" @click="submit">
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
import { ref, computed } from 'vue'
import BaseButton from '@/components/common/button/BaseButton.vue'

const props = defineProps({
  placeholder: {
    type: String,
    default: '검색어 입력',
  },
  searchTypes: {
    type: Array,
    default: () => [],
    // [{ label, key, type, options? }]
  },
  showDetail: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['search', 'detail'])

const selectedKey = ref(props.searchTypes[0]?.key)
const value = ref(null)

const current = computed(() =>
    props.searchTypes.find(t => t.key === selectedKey.value)
)

const submit = () => {
  if (!selectedKey.value) return

  emit('search', {
    key: selectedKey.value,
    value: value.value,
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

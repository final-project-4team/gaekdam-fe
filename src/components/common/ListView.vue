<template>
  <div class="list-view">
    <!-- ===================== -->
    <!-- Toolbar -->
    <!-- ===================== -->
    <div class="toolbar">
      <SearchBar
          v-if="showSearch"
          :searchTypes="searchTypes"
          v-model:type="searchType"
          :showDetail="showDetail"
          @search="onSearch"
          @detail="openDetailModal"
      />

      <FilterGroup
          v-if="filters?.length"
          :filters="filters"
          @change="onFilter"
      />
    </div>

    <!-- ===================== -->
    <!-- Table + Paging -->
    <!-- ===================== -->
    <TableWithPaging
        :columns="columns"
        :rows="filteredRows"
        :pageSize="pageSize"
        @row-click="$emit('row-click', $event)"
    />

    <!-- ===================== -->
    <!-- Detail Search Modal -->
    <!-- ===================== -->
    <BaseDetailSearchModal
        v-if="showDetailModal"
        @close="closeDetailModal"
        @apply="applyDetail"
        @reset="resetDetail"
    >
      <!-- 부모(TestView)가 만든 폼이 여기로 들어옴 -->
      <slot name="detail-form" />
    </BaseDetailSearchModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

import SearchBar from '@/components/common/form/SearchBar.vue'
import FilterGroup from '@/components/common/filter/FilterGroup.vue'
import TableWithPaging from '@/components/common/table/TableWithPaging.vue'
import BaseDetailSearchModal from '@/components/common/modal/BaseDetailSearchModal.vue'

/* ===================== */
/* Props */
/* ===================== */
const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },

  filters: { type: Array, default: () => [] },
  searchTypes: { type: Array, default: () => [] },

  showSearch: { type: Boolean, default: true },
  showDetail: { type: Boolean, default: false },
  pageSize: { type: Number, default: 10 },

  /**
   * 상세검색 조건 (부모 v-model:detail 로 받음)
   * 예) { customerName:'', reservationNo:'', status:'' }
   */
  detail: { type: Object, default: () => ({}) },
})

const emit = defineEmits([
  'row-click',
  'update:detail', // ✅ v-model:detail 업데이트
])

/* ===================== */
/* State */
/* ===================== */
const keyword = ref('')
const searchType = ref('')
const filterValues = ref({})

/* 상세검색 모달 */
const showDetailModal = ref(false)

/* ===================== */
/* Filtering Logic */
/* ===================== */
const filteredRows = computed(() => {
  let result = [...props.rows]

  // 1) 기본 검색(SearchBar)
  if (keyword.value) {
    const kw = String(keyword.value)

    result = result.filter((row) => {
      // 기준 없으면 전체 검색
      if (!searchType.value) {
        return Object.values(row).some((v) => String(v).includes(kw))
      }

      // 기준 있으면 해당 필드만 검색
      const fieldMap = {
        CUSTOMER_NAME: 'customerName',
        RESERVATION_NO: 'reservationNo',
        ROOM_NO: 'roomNo',
      }
      const field = fieldMap[searchType.value]
      return field ? String(row?.[field] ?? '').includes(kw) : true
    })
  }

  // 2) FilterGroup 필터
  Object.entries(filterValues.value).forEach(([key, value]) => {
    if (value) result = result.filter((row) => row?.[key] === value)
  })

  // 3) 상세검색(detail) - v-model로 받은 값 반영
  Object.entries(props.detail || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return
    result = result.filter((row) =>
        String(row?.[key] ?? '').includes(String(value))
    )
  })

  return result
})

/* ===================== */
/* Handlers */
/* ===================== */
const onSearch = (payload) => {
  // SearchBar가 string을 주는 버전 / object를 주는 버전 둘 다 대응
  if (typeof payload === 'string') {
    keyword.value = payload
    searchType.value = ''
  } else {
    keyword.value = payload.keyword
    searchType.value = payload.type
  }
}

const onFilter = (values) => {
  filterValues.value = values
}

/* ===================== */
/* Detail Search Controls */
/* ===================== */
const openDetailModal = () => {
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
}

/**
 *  적용: 사실상 "모달 닫기"만 해도 됨
 * (왜냐면 detailForm은 v-model로 이미 값이 들어가 있음)
 */
const applyDetail = () => {
  showDetailModal.value = false
}

/**
 *  초기화: 부모의 detail 값을 비워줘야 "실제로" 초기화됨
 */
const resetDetail = () => {
  emit('update:detail', {}) // 부모 detailForm을 {} 로 바꿈
}
</script>

<style scoped>
.list-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

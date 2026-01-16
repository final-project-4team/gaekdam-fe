<template>
  <div class="list-view">
    <!-- Toolbar -->
    <div class="toolbar">
      <SearchBar
          v-if="showSearch"
          :searchTypes="searchTypes"
          :type="searchType"
          :showDetail="showDetail"
          @update:type="t => emit('update:searchType', t)"
          @search="payload => emit('search', payload)"
          @detail="openDetailModal"
      />

      <FilterGroup
          v-if="filters?.length"
          :filters="filters"
          @change="values => emit('filter', values)"
      />
    </div>

    <!-- Table + Paging -->
    <TableWithPaging
        :columns="columns"
        :rows="rows"
        :page="page"
        :pageSize="pageSize"
        :total="total"
        @page-change="p => emit('page-change', p)"
        @sort-change="s => emit('sort-change', s)"
        @row-click="$emit('row-click', $event)"
    />

    <!-- Detail Search Modal -->
    <BaseDetailSearchModal
        v-if="showDetailModal"
        @close="closeDetailModal"
        @apply="applyDetail"
        @reset="emit('update:detail', {})"
    >
      <slot name="detail-form" />
    </BaseDetailSearchModal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SearchBar from '@/components/common/form/SearchBar.vue'
import FilterGroup from '@/components/common/filter/FilterGroup.vue'
import TableWithPaging from '@/components/common/table/TableWithPaging.vue'
import BaseDetailSearchModal from '@/components/common/modal/BaseDetailSearchModal.vue'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },

  page: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  total: { type: Number, required: true },

  filters: { type: Array, default: () => [] },
  searchTypes: { type: Array, default: () => [] },

  searchType: { type: String, default: '' },

  showSearch: { type: Boolean, default: true },
  showDetail: { type: Boolean, default: false },
})

const emit = defineEmits([
  'row-click',
  'page-change',
  'sort-change',
  'search',
  'filter',
  'update:detail',
  'update:searchType',
])

const showDetailModal = ref(false)

const openDetailModal = () => {
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
}

const applyDetail = () => {
  showDetailModal.value = false
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
}
</style>

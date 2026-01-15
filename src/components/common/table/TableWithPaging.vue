<template>
  <div class="table-with-paging">
    <BaseTable
        :columns="columns"
        :rows="pagedRows"
        @row-click="$emit('row-click', $event)"
        @sort-change="onSortChange"
    />

    <Pagination
        v-if="totalPages > 1"
        :current="page"
        :pages="pages"
        @change="changePage"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseTable from '@/components/common/table/BaseTable.vue'
import Pagination from '@/components/common/pagination/Pagination.vue'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  pageSize: { type: Number, default: 10 },
})

defineEmits(['row-click', 'page-change'])

const page = ref(1)
const sortKey = ref('')
const sortOrder = ref('asc')

const totalPages = computed(() =>
    Math.max(1, Math.ceil(props.rows.length / props.pageSize))
)

const pages = computed(() =>
    Array.from({ length: totalPages.value }, (_, i) => i + 1)
)

/** 정렬은 "페이징 전에" */
const sortedRows = computed(() => {
  if (!sortKey.value) return props.rows

  const copied = [...props.rows]
  copied.sort((a, b) => {
    const av = a?.[sortKey.value]
    const bv = b?.[sortKey.value]

    // null/undefined 처리
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1

    // 숫자면 숫자 비교, 아니면 문자열 비교
    const isNum = !isNaN(Number(av)) && !isNaN(Number(bv))
    const left = isNum ? Number(av) : String(av)
    const right = isNum ? Number(bv) : String(bv)

    if (left === right) return 0
    const dir = sortOrder.value === 'asc' ? 1 : -1
    return left > right ? dir : -dir
  })

  return copied
})

const pagedRows = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return sortedRows.value.slice(start, start + props.pageSize)
})

const changePage = (p) => {
  page.value = p
}

const onSortChange = ({ key, order }) => {
  sortKey.value = key
  sortOrder.value = order
  page.value = 1
}

/** rows 바뀌면 page reset */
watch(
    () => props.rows,
    () => {
      page.value = 1
    }
)
</script>

<style scoped>
.table-with-paging {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>

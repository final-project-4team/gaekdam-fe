<template>
  <div class="table-wrapper">
    <table class="base-table">
      <!-- 컬럼 폭 -->
      <colgroup>
        <col
            v-for="col in columns"
            :key="col.key"
            :style="col.width ? { width: col.width } : null"
        />
      </colgroup>

      <thead>
      <tr>
        <th
            v-for="col in columns"
            :key="col.key"
            :class="['th', { sortable: col.sortable, active: sortKey === col.key }]"
            @click="onSort(col)"
        >
          <!-- 정렬 기준 텍스트 -->
          <span class="th-label">
              {{ col.label }}
            </span>

          <!-- 정렬 아이콘 (레이아웃 분리) -->
          <span v-if="col.sortable" class="sort-icon">
              <!-- 기본 -->
              <svg
                  v-if="sortKey !== col.key"
                  viewBox="0 0 24 24"
                  class="icon inactive"
              >
                <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
              </svg>

            <!-- ASC -->
              <svg
                  v-else-if="sortOrder === 'asc'"
                  viewBox="0 0 24 24"
                  class="icon active"
              >
                <path d="M8 14l4-4 4 4" />
              </svg>

            <!-- DESC -->
              <svg
                  v-else
                  viewBox="0 0 24 24"
                  class="icon active"
              >
                <path d="M8 10l4 4 4-4" />
              </svg>
            </span>
        </th>
      </tr>
      </thead>

      <tbody>
      <tr
          v-for="row in rows"
          :key="row.id"
          class="table-row"
          @click="$emit('row-click', row)"
      >
        <td
            v-for="col in columns"
            :key="col.key"
            :class="col.align ? `align-${col.align}` : 'align-center'"
        >
          {{ row[col.key] }}
        </td>
      </tr>

      <tr v-if="!rows?.length">
        <td :colspan="columns.length" class="empty">
          데이터가 없습니다.
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
})

const emit = defineEmits(['row-click', 'sort-change'])

const sortKey = ref('')
const sortOrder = ref('asc')

const onSort = (col) => {
  if (!col.sortable) return

  if (sortKey.value === col.key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = col.key
    sortOrder.value = 'asc'
  }

  emit('sort-change', { key: sortKey.value, order: sortOrder.value })
}

/* columns 변경 시 정렬 상태 보호 */
watch(
    () => props.columns,
    () => {
      if (sortKey.value && !props.columns.some(c => c.key === sortKey.value)) {
        sortKey.value = ''
        sortOrder.value = 'asc'
        emit('sort-change', { key: '', order: 'asc' })
      }
    }
)
</script>

<style scoped>
.table-wrapper {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e6eaf0;
}

.base-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

/* 공통 셀 */
th, td {
  padding: 12px;
  border-top: 1px solid #eef2f7;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 헤더 */
th {
  position: relative;
  background: #f8fafc;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  border-top: none;
  user-select: none;
  text-align: center;
}

.th-label {
  display: inline-block;
}

/* 정렬 아이콘 (레이아웃 제외) */
.sort-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
}

th.sortable {
  cursor: pointer;
}

th.sortable:hover {
  background: #eef2ff;
}

th.active {
  color: #1d4ed8;
}

/* 아이콘 */
.icon {
  width: 14px;
  height: 14px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
}

.icon.inactive {
  color: #cbd5e1;
}

.icon.active {
  color: #1d4ed8;
}

/* 바디 */
.table-row {
  cursor: pointer;
  transition: background 0.15s ease;
}

.table-row:hover {
  background: #f1f5ff;
}

.empty {
  text-align: center;
  color: #94a3b8;
  padding: 24px 12px;
}

/* 정렬 */
.align-left { text-align: left; }
.align-center { text-align: center; }
.align-right { text-align: right; }
</style>

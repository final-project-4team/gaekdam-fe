<template>
  <div class="activity-check">

    <!-- ===================== -->
    <!-- Today Summary -->
    <!-- ===================== -->
    <TodayCheckSummary
        :summary="summary"
        :active="summaryType"
        @select="onSelectSummary"
    />

    <!-- ===================== -->
    <!-- Today Operation List -->
    <!-- ===================== -->
    <ListView
        :columns="columns"
        :rows="rows"
        :page="page"
        :pageSize="pageSize"
        :total="total"
        show-search
        @search="onSearch"
        @page-change="onPageChange"
        @row-click="openDetail"
    >
      <!-- 운영 상태 -->
      <template #cell-operationStatus="{ value }">
        <span class="status" :class="value">
          {{ STATUS_LABEL[value] }}
        </span>
      </template>

      <!-- 체크인 / 체크아웃 -->
      <template #cell-action="{ row }">
        <div class="action-buttons">
          <BaseButton
              type="primary"
              size="sm"
              :disabled="!canCheckin(row.operationStatus)"
              @click.stop="checkin(row)"
          >
            체크인 등록
          </BaseButton>

          <BaseButton
              type="warning"
              size="sm"
              :disabled="!canCheckout(row.operationStatus)"
              @click.stop="checkout(row)"
          >
            체크아웃 등록
          </BaseButton>
        </div>
      </template>
    </ListView>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import ListView from '@/components/common/ListView.vue'
import BaseButton from '@/components/common/button/BaseButton.vue'
import TodayCheckSummary from './TodayCheckSummary.vue'
import {
  getTodayOperationListApi,
  getTodayOperationSummaryApi,
} from '@/api/reservation'

/* ===================== */
/* Status Label */
const STATUS_LABEL = {
  CHECKIN_PLANNED: '체크인예정',
  STAYING: '투숙중',
  CHECKOUT_PLANNED: '체크아웃예정',
  COMPLETED: '완료',
}

/* ===================== */
/* Paging */
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const rows = ref([])

/* ===================== */
/* Summary */
const summaryType = ref('ALL_TODAY')

const summary = ref({
  ALL_TODAY: 0,
  CHECKIN_PLANNED: 0,
  CHECKOUT_PLANNED: 0,
  STAYING: 0,
  COMPLETED: 0,
})

/* ===================== */
/* Search */
const detail = reactive({
  customerName: null,
  reservationCode: null,
})

/* ===================== */
/* Columns */
const columns = [
  { key: 'reservationCode', label: '예약번호' },
  { key: 'customerName', label: '고객명' },
  { key: 'roomType', label: '객실유형' },
  { key: 'plannedCheckinDate', label: '체크인 예정' },
  { key: 'plannedCheckoutDate', label: '체크아웃 예정' },
  { key: 'operationStatus', label: '운영상태' },
  { key: 'action', label: '처리', width: 220 },
]

/* ===================== */
/* API */
const loadSummary = async () => {
  const res = await getTodayOperationSummaryApi()
  const data = res.data.data

  summary.value = {
    ALL_TODAY:
        (data.CHECKIN_PLANNED || 0)
        + (data.CHECKOUT_PLANNED || 0)
        + (data.STAYING || 0)
        + (data.COMPLETED || 0),

    CHECKIN_PLANNED: data.CHECKIN_PLANNED || 0,

    // 체크아웃 카드는 완료 포함
    CHECKOUT_PLANNED:
        (data.CHECKOUT_PLANNED || 0)
        + (data.COMPLETED || 0),

    STAYING: data.STAYING || 0,

    COMPLETED: data.COMPLETED || 0,
  }
}

const loadList = async () => {
  const res = await getTodayOperationListApi({
    page: page.value,
    size: pageSize.value,
    summaryType: summaryType.value === 'ALL_TODAY'
        ? undefined
        : summaryType.value,
    detail,
  })

  const data = res.data.data
  rows.value = data.content || []
  total.value = data.totalElements
}

/* ===================== */
/* Events */
const onSelectSummary = async (type) => {
  summaryType.value = type
  page.value = 1
  await loadList()
}

const onSearch = async ({ key, value }) => {
  page.value = 1
  detail.customerName = null
  detail.reservationCode = null

  if (!value) return loadList()

  if (key === 'keyword' || key === 'customerName') {
    detail.customerName = value
  }

  if (key === 'reservationCode') {
    detail.reservationCode = Number(value)
  }

  await loadList()
}

const onPageChange = async (p) => {
  page.value = p
  await loadList()
}

const openDetail = (row) => {
  console.log('open detail', row.reservationCode)
}

/* ===================== */
/* Button Rules */
const canCheckin = (status) =>
    status === 'CHECKIN_PLANNED'

const canCheckout = (row) =>
    row.operationStatus === 'CHECKOUT_PLANNED'
    && row.actualCheckinAt != null

const checkin = (row) => {
  console.log('checkin', row.reservationCode)
}

const checkout = (row) => {
  console.log('checkout', row.reservationCode)
}

/* ===================== */
onMounted(async () => {
  await loadSummary()
  await loadList()
})
</script>

<style scoped>
.activity-check {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.status {
  font-weight: 600;
}

.status.CHECKIN_PLANNED {
  color: #2563eb;
}

.status.STAYING {
  color: #047857;
}

.status.CHECKOUT_PLANNED {
  color: #d97706;
}

.status.COMPLETED {
  color: #6b7280;
}
</style>

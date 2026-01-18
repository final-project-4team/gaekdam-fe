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
    <!-- Operation List -->
    <!-- ===================== -->
    <ListView
        :columns="columns"
        :rows="rows"
        :page="page"
        :pageSize="pageSize"
        :total="total"
        :searchTypes="searchTypes"
        show-search
        @search="onSearch"
        @page-change="onPageChange"
        @row-click="openDetail"
    >
      <!-- 운영 상태 -->
      <template #cell-operationStatus="{ value }">
        <span class="status" :class="value">{{ value }}</span>
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
  getTodayReservationSummaryApi,
  getOperationBoardApi,
} from '@/api/reservation'

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
  allToday: 0,
  todayCheckIn: 0,
  todayCheckOut: 0,
  stayingRooms: 0,
})

/* ===================== */
/* Search / Filter State */
const detail = reactive({
  customerName: null,
  reservationCode: null,
})

const filters = reactive({})

/* ===================== */
/* Columns */
const columns = [
  { key: 'reservationCode', label: '예약번호', sortable: true },
  { key: 'customerName', label: '고객명' },
  { key: 'roomType', label: '객실유형' },
  { key: 'plannedCheckinDate', label: '체크인 예정' },
  { key: 'plannedCheckoutDate', label: '체크아웃 예정' },
  { key: 'operationStatus', label: '운영상태' },
  { key: 'action', label: '처리', width: 220 },
]

const searchTypes = [
  { label: '전체', value: 'keyword' },
  { label: '고객명', value: 'customerName' },
  { label: '예약번호', value: 'reservationCode' },
]

/* ===================== */
/* API */
const loadSummary = async () => {
  const res = await getTodayReservationSummaryApi()
  summary.value = res.data.data
}

const loadList = async () => {
  const res = await getOperationBoardApi({
    page: page.value,
    size: pageSize.value,
    summaryType: summaryType.value,
    filters,
    detail,
  })

  rows.value = res.data.data.content
  total.value = res.data.data.totalElements
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

  // 초기화
  detail.customerName = null
  detail.reservationCode = null

  if (!value) {
    await loadList()
    return
  }

  if (key === 'keyword') {
    detail.customerName = value
    return loadList()
  }

  if (key === 'customerName') {
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
    status === 'RESERVED' || status === 'CHECKIN_PLANNED'

const canCheckout = (status) =>
    status === 'CHECKOUT_PLANNED' || status === 'STAYING'

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

.status.STAYING {
  color: #047857;
}

.status.CHECKIN_PLANNED {
  color: #2563eb;
}

.status.CHECKOUT_PLANNED {
  color: #d97706;
}
</style>

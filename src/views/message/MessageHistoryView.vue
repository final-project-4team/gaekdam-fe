<template>
  <div class="message-history-page">
    <ListView
        :columns="columns"
        :rows="rows"
        :page="page"
        :pageSize="pageSize"
        :total="total"
        :filters="filters"
        @filter="onFilter"
        @sort-change="onSortChange"
        @page-change="onPageChange"
    >
      <!-- 상태 컬럼 -->
      <template #cell-status="{ row }">
        <span
            class="status-text"
            :class="row.status"
        >
          {{ STATUS_LABEL[row.status] }}
        </span>
      </template>
    </ListView>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ListView from '@/components/common/ListView.vue'
import { getMessageSendHistoryApi } from '@/api/message/messageSendHistoryApi'
import { getPropertyListByHotelGroupApi } from '@/api/property/propertyApi'

/* ===================== */
/* 상태 라벨 */
/* ===================== */
const STATUS_LABEL = {
  SCHEDULED: '예약됨',
  SENT: '발송완료',
  FAILED: '실패',
}

/* ===================== */
/* 테이블 컬럼 */
/* ===================== */
const columns = [
  { key: 'stageNameKor', label: '여정 단계' },
  { key: 'templateTitle', label: '메시지 템플릿' },
  { key: 'reservationCode', label: '예약코드', align: 'center' },
  { key: 'stayCode', label: '투숙코드', align: 'center' },
  { key: 'status', label: '상태', align: 'center' },
  { key: 'sentAt', label: '발송 시각', sortable: true, align: 'center' },
]

/* ===================== */
/* 상태 */
/* ===================== */
const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

/* ===================== */
/* 정렬 */
/* ===================== */
const sortState = ref({
  sortBy: 'sentAt',
  direction: 'DESC',
})

/* ===================== */
/* 필터 */
/* ===================== */
const propertyOptions = ref([])

const filterValues = ref({
  propertyCode: null,
  status: null,
})

const filters = computed(() => [
  {
    key: 'propertyCode',
    options: propertyOptions.value,
  },
  {
    key: 'status',
    options: [
      { label: '전체 상태', value: '' },
      { label: '예약됨', value: 'SCHEDULED' },
      { label: '발송완료', value: 'SENT' },
      { label: '실패', value: 'FAILED' },
    ],
  },
])

/* ===================== */
/* 데이터 로딩 */
/* ===================== */
const loadHistories = async () => {
  const res = await getMessageSendHistoryApi({
    page: page.value,
    size: pageSize.value,
    sort: sortState.value,
    search: {
      propertyCode: filterValues.value.propertyCode,
      status: filterValues.value.status,
    },
  })

  const data = res.data.data
  rows.value = data.content || []
  total.value = data.totalElements
}

/* ===================== */
/* 이벤트 */
/* ===================== */
const onFilter = (values) => {
  filterValues.value = {
    propertyCode: values.propertyCode || null,
    status: values.status || null,
  }
  page.value = 1
  loadHistories()
}

const onSortChange = (sort) => {
  sortState.value = sort
  page.value = 1
  loadHistories()
}

const onPageChange = (p) => {
  page.value = p
  loadHistories()
}

/* ===================== */
/* 초기 로딩 */
/* ===================== */
onMounted(async () => {
  // 지점 필터 옵션
  const res = await getPropertyListByHotelGroupApi()
  const list = res.data.data || []

  propertyOptions.value = [
    { label: '전체 지점', value: '' },
    ...list.map(p => ({
      label: p.propertyName,
      value: p.propertyCode,
    })),
  ]

  loadHistories()
})
</script>

<style scoped>
.message-history-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-text {
  font-size: 12px;
  font-weight: 600;
}

.status-text.SENT {
  color: #16a34a;
}

.status-text.FAILED {
  color: #dc2626;
}

.status-text.SCHEDULED {
  color: #6b7280;
}
</style>

<template>
  <div class="activity-all-page">
    <ListView
        :columns="columns"
        :rows="rows"
        :page="page"
        :pageSize="pageSize"
        :total="totalCount"

        :filters="filters"
        :searchTypes="searchTypes"
        :searchType="searchType"

        show-search
        show-detail

        @update:searchType="v => searchType = v"
        @search="onSearch"
        @filter="onFilter"
        @page-change="onPageChange"
        @sort-change="onSortChange"
    >
      <!-- 상세검색 UI는 유지하되 현재 로직 미연결 -->
      <template #detail-form>
        <div class="detail-form">
          <div class="row">
            <label>운영상태</label>
            <select>
              <option value="">전체</option>
              <option value="RESERVED">RESERVED</option>
              <option value="CANCELED">CANCELED</option>
              <option value="NO_SHOW">NO_SHOW</option>
            </select>
          </div>
        </div>
      </template>
    </ListView>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import ListView from "@/components/common/ListView.vue"
import { getReservationListApi } from "@/api/reservation/reservationApi"

/* ===================== */
/* UI 설정 */
/* ===================== */
const searchTypes = [
  { label: '전체', key: 'keyword', type: 'text' },
]
const filters = [
  {
    key: "status",
    options: [
      { label: "운영상태", value: "" },
      { label: "RESERVED", value: "RESERVED" },
      { label: "CANCELED", value: "CANCELED" },
      { label: "NO_SHOW", value: "NO_SHOW" },
    ],
  },
  {
    key: "reservationChannel",
    options: [
      { label: "채널", value: "" },
      { label: "WEB", value: "WEB" },
      { label: "OTA", value: "OTA" },
    ],
  },
]

const columns = [
  { key: "reservationCode", label: "예약번호", sortable: true },
  { key: "reservationStatus", label: "운영상태", sortable: true },
  { key: "checkinDate", label: "투숙예정일", sortable: true },
  { key: "checkoutDate", label: "투숙종료일", sortable: true },
  { key: "guestCount", label: "투숙인원", sortable: true },
  { key: "reservationChannel", label: "채널", sortable: true },
]

/* ===================== */
/* 상태 */
/* ===================== */
const rows = ref([])
const totalCount = ref(0)

const page = ref(1)
const pageSize = ref(10)

const keyword = ref("")
const searchType = ref("")
const filterValues = ref({})
const sortState = ref({})



/* ===================== */
/* API */
/* ===================== */
const loadReservations = async () => {
  const res = await getReservationListApi({
    page: page.value,
    size: pageSize.value,

    // ReservationSearchRequest
    keyword: keyword.value || undefined,
    status: filterValues.value.status || undefined,
    reservationChannel: filterValues.value.reservationChannel || undefined,

    // SortRequest
    sortBy: sortState.value.sortBy || "createdAt",
    direction: sortState.value.direction || "DESC",
  })

  const data = res.data.data
  rows.value = data.content
  totalCount.value = data.totalElements
}

/* ===================== */
/* 이벤트 */
/* ===================== */
const onSearch = ({ key, value }) => {
  page.value = 1

  if (key === 'keyword') {
    keyword.value = value
  }

  loadReservations()
}

const onFilter = (values) => {
  filterValues.value = values
  page.value = 1
  loadReservations()
}

const onSortChange = ({ sortBy, direction }) => {
  sortState.value = { sortBy, direction }
  loadReservations()
}

const onPageChange = (p) => {
  page.value = p
  loadReservations()
}

onMounted(loadReservations)
</script>

<style scoped>
.activity-all-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 20px;
}

.detail-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-form .row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-form label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.detail-form select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
</style>

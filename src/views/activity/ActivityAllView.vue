<template>
  <div class="activity-all-page">

    <!-- ===================== -->
    <!-- 고객활동 전체 리스트 -->
    <!-- ===================== -->
    <ListView
        :columns="columns"
        :rows="rows"
        :total="totalCount"
        :filters="filters"
        :searchTypes="searchTypes"
        show-detail
        v-model:detail="detailForm"

        @search="onSearch"
        @filter="onFilter"
        @sort-change="onSortChange"
        @page-change="onPageChange"

        @row-click="openRowModal"
    >
      <!-- ===================== -->
      <!-- 상세검색 폼 -->
      <!-- ===================== -->
      <template #detail-form>
        <div class="detail-form">
          <div class="row">
            <label>고객명</label>
            <input v-model="detailForm.customerName" />
          </div>

          <div class="row">
            <label>예약번호</label>
            <input v-model="detailForm.reservationNo" />
          </div>

          <div class="row">
            <label>운영상태</label>
            <select v-model="detailForm.status">
              <option value="">전체</option>
              <option value="투숙중">투숙중</option>
              <option value="체크인예정">체크인예정</option>
              <option value="체크아웃예정">체크아웃예정</option>
            </select>
          </div>
        </div>
      </template>
    </ListView>

    <!-- ===================== -->
    <!-- 예약 상세 모달 -->
    <!-- ===================== -->
    <BaseModal
        v-if="showRowModal"
        title="예약 상세"
        @close="closeRowModal"
    >
      <div v-if="selectedRow" class="detail-view">
        <p><b>예약번호:</b> {{ selectedRow.reservationNo }}</p>
        <p><b>고객명:</b> {{ selectedRow.customerName }}</p>
        <p><b>객실유형:</b> {{ selectedRow.roomType }}</p>
        <p><b>투숙기간:</b> {{ selectedRow.checkinDate }} ~ {{ selectedRow.checkoutDate }}</p>
        <p><b>운영상태:</b> {{ selectedRow.status }}</p>
      </div>
    </BaseModal>
  </div>
</template>


<script setup>
import { ref, onMounted } from "vue";

import ListView from "@/components/common/ListView.vue";
import BaseModal from "@/components/common/modal/BaseModal.vue";
import { getReservationListApi } from "@/api/reservation/reservationApi";

/* ===================== */
/* 검색 기준 */
/* ===================== */
const searchTypes = [
  { label: "전체", value: "" },
  { label: "고객명", value: "CUSTOMER_NAME" },
  { label: "예약번호", value: "RESERVATION_NO" },
];

/* ===================== */
/* 필터 */
/* ===================== */
const filters = [
  {
    key: "status",
    options: [
      { label: "운영상태", value: "" },
      { label: "투숙중", value: "투숙중" },
      { label: "체크인예정", value: "체크인예정" },
      { label: "체크아웃예정", value: "체크아웃예정" },
    ],
  },
  {
    key: "roomType",
    options: [
      { label: "객실유형", value: "" },
      { label: "디럭스", value: "디럭스" },
      { label: "스위트", value: "스위트" },
    ],
  },
];

/* ===================== */
/* 테이블 컬럼 */
/* ===================== */
const columns = [
  { key: "reservationNo", label: "예약번호", sortable: true, align: "center" },
  { key: "customerName", label: "고객명", sortable: true },
  { key: "roomType", label: "객실유형", sortable: true, align: "center" },
  { key: "checkinDate", label: "투숙예정일", sortable: true, align: "center" },
  { key: "checkoutDate", label: "투숙종료일", sortable: true, align: "center" },
  { key: "status", label: "운영상태", sortable: true, align: "center" },
];

/* ===================== */
/* 리스트 / 페이징 상태 */
/* ===================== */
const rows = ref([]);
const totalCount = ref(0);

const page = ref(1);
const pageSize = ref(10);

/* ===================== */
/* 검색 / 필터 / 정렬 상태 */
/* ===================== */
const keyword = ref("");
const searchType = ref("");
const filterValues = ref({});
const sortState = ref({});

/* ===================== */
/* 상세검색 상태 */
/* ===================== */
const detailForm = ref({
  customerName: "",
  reservationNo: "",
  status: "",
});

/* ===================== */
/* API 로딩 */
/* ===================== */
const loadReservations = async () => {
  const res = await getReservationListApi({
    page: page.value,
    size: pageSize.value,
    keyword: keyword.value,
    searchType: searchType.value,
    filters: filterValues.value,
    detail: detailForm.value,
    sort: sortState.value,
  });

  rows.value = res.data.data.items;
  totalCount.value = res.data.data.totalCount;
};

/* ===================== */
/* ListView 이벤트 핸들러 */
/* ===================== */
const onSearch = (payload) => {
  if (typeof payload === "string") {
    keyword.value = payload;
    searchType.value = "";
  } else {
    keyword.value = payload.keyword;
    searchType.value = payload.type;
  }
  page.value = 1;
  loadReservations();
};

const onFilter = (filters) => {
  filterValues.value = filters;
  page.value = 1;
  loadReservations();
};

const onSortChange = (sort) => {
  sortState.value = sort;
  loadReservations();
};

const onPageChange = (p) => {
  page.value = p;
  loadReservations();
};

/* ===================== */
/* Row Modal */
/* ===================== */
const showRowModal = ref(false);
const selectedRow = ref(null);

const openRowModal = (row) => {
  selectedRow.value = row;
  showRowModal.value = true;
};

const closeRowModal = () => {
  showRowModal.value = false;
  selectedRow.value = null;
};

/* ===================== */
/* 최초 진입 시 로드 */
/* ===================== */
onMounted(() => {
  loadReservations();
});
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

.detail-form input,
.detail-form select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.detail-view p {
  margin: 6px 0;
}

</style>

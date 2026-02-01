<!-- src/views/voc/view/InquiryListView.vue -->
<script setup>
import { ref, computed, onMounted } from "vue";
import ListView from "@/components/common/ListView.vue";
import { getInquiryListApi } from "@/api/voc/inquiryApi.js";
import InquiryDetailModal from "@/views/voc/inquiry/modal/InquiryDetailModal.vue";

/* Search Types (백엔드 searchType과 1:1 매칭) */
const searchTypes = [
  { label: "전체", value: "ALL" },
  { label: "키워드(제목)", value: "TITLE" },
  { label: "고객명", value: "CUSTOMER_NAME" },
  { label: "담당자명", value: "EMPLOYEE_NAME" },
  { label: "담당자ID", value: "EMPLOYEE_ID" },
];

/* Filters */
const filters = [
  {
    key: "inquiryCategoryCode",
    options: [
      { label: "문의유형", value: "" },
      { label: "문의", value: "1" },
      { label: "클레임", value: "2" },
    ],
  },
  {
    key: "status",
    options: [
      { label: "문의상태", value: "" },
      { label: "접수", value: "IN_PROGRESS" },
      { label: "답변완료", value: "ANSWERED" },
    ],
  },
];

/* Columns */
const columns = [
  { key: "inquiryCode", label: "번호", sortable: true },
  { key: "createdAt", label: "접수일시", sortable: true },
  { key: "customerName", label: "고객명", sortable: false },
  { key: "inquiryTitle", label: "제목", sortable: false },
  { key: "inquiryCategoryName", label: "유형", sortable: false },
  { key: "inquiryStatus", label: "상태", sortable: true },
  { key: "employeeName", label: "담당자명", sortable: false },
];

/* State */
const rows = ref([]);
const total = ref(0);

const page = ref(1);
const pageSize = ref(10);

const sortState = ref({ sortBy: "created_at", direction: "DESC" });
const filterValues = ref({});

// SearchBar가 주는 값 저장: { key: searchType, value: keyword }
const quickSearch = ref({ key: "ALL", value: "" });

const detailForm = ref({
  fromDate: "",
  toDate: "",
  propertyCode: "",
  inquiryCategoryCode: "",
});

/* Detail Modal */
const showDetailModal = ref(false);
const selectedInquiryCode = ref(null);

const openDetailModal = (row) => {
  selectedInquiryCode.value = row?.inquiryCode ?? null;
  if (!selectedInquiryCode.value) return;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedInquiryCode.value = null;
};

const statusLabel = (v) => {
  if (v === "IN_PROGRESS") return "접수";
  if (v === "ANSWERED") return "답변완료";
  return v ?? "-";
};

const formatDateTime = (iso) => {
  if (!iso) return "-";
  return String(iso).replace("T", " ").slice(0, 16);
};

const toNumberOrNull = (v) => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const buildParams = () => {
  const params = {
    page: page.value,
    size: pageSize.value,
    sortBy: sortState.value.sortBy || "created_at",
    direction: sortState.value.direction || "DESC",
  };

  // filters
  if (filterValues.value.status) params.status = filterValues.value.status;

  const cat = filterValues.value.inquiryCategoryCode || detailForm.value.inquiryCategoryCode;
  const catNum = toNumberOrNull(cat);
  if (catNum != null) params.inquiryCategoryCode = catNum;

  if (detailForm.value.fromDate) params.fromDate = detailForm.value.fromDate;
  if (detailForm.value.toDate) params.toDate = detailForm.value.toDate;

  const propNum = toNumberOrNull(detailForm.value.propertyCode);
  if (propNum != null) params.propertyCode = propNum;

  // search (서버에서 searchType + keyword 처리)
  const searchType = (quickSearch.value.key ?? "ALL").trim() || "ALL";
  const keyword = (quickSearch.value.value ?? "").trim();

  params.searchType = searchType;
  if (keyword) params.keyword = keyword;

  return params;
};

const fetchList = async () => {
  const res = await getInquiryListApi(buildParams());
  const pageData = res?.data?.data;

  rows.value = pageData?.content ?? [];
  total.value = pageData?.totalElements ?? 0;
};

// 서버검색 결과 그대로 보여줌
const displayRows = computed(() => rows.value);

/* Events */
const onSearch = async (payload) => {
  page.value = 1;

  // SearchBar payload 호환(key/value 또는 type/keyword)
  const key = payload?.key ?? payload?.type ?? payload?.searchType ?? "ALL";
  const value = payload?.value ?? payload?.keyword ?? "";

  quickSearch.value = { key, value };
  await fetchList();
};

const onFilter = async (values) => {
  page.value = 1;
  filterValues.value = values ?? {};
  await fetchList();
};

const onSortChange = async ({ sortBy, direction }) => {
  const map = {
    inquiryCode: "inquiry_code",
    createdAt: "created_at",
    inquiryStatus: "inquiry_status",
  };

  sortState.value = {
    sortBy: map[sortBy] ?? "created_at",
    direction: direction || "DESC",
  };
  await fetchList();
};

const onPageChange = async (p) => {
  page.value = p;
  await fetchList();
};

const onDetailReset = async () => {
  page.value = 1;
  filterValues.value = {};
  quickSearch.value = { key: "ALL", value: "" };
  sortState.value = { sortBy: "created_at", direction: "DESC" };
  detailForm.value = { fromDate: "", toDate: "", propertyCode: "", inquiryCategoryCode: "" };
  await fetchList();
};

const onDetailApply = async () => {
  page.value = 1;
  await fetchList();
};

onMounted(fetchList);
</script>

<template>
  <section class="page">
    <ListView
        :columns="columns"
        :rows="displayRows"
        :filters="filters"
        :searchTypes="searchTypes"
        :page="page"
        :pageSize="pageSize"
        :total="total"
        show-search
        show-detail
        v-model:detail="detailForm"
        @search="onSearch"
        @filter="onFilter"
        @sort-change="onSortChange"
        @page-change="onPageChange"
        @detail-reset="onDetailReset"
        @detail-apply="onDetailApply"
        @row-click="openDetailModal"
    >
      <template #cell-createdAt="{ row }">
        {{ formatDateTime(row.createdAt) }}
      </template>

      <template #cell-inquiryStatus="{ row }">
        {{ statusLabel(row.inquiryStatus) }}
      </template>

      <template #cell-customerName="{ row }">
        {{ row.customerName ?? "-" }}
      </template>

      <template #cell-inquiryTitle="{ row }">
        <span class="ellipsis" :title="row.inquiryTitle ?? ''">
          {{ row.inquiryTitle ?? "-" }}
        </span>
      </template>

      <template #cell-employeeName="{ row }">
        {{ row.employeeName ? row.employeeName : "미지정" }}
      </template>

      <!-- 상세검색 폼: 입력만 (버튼 제거) -->
      <template #detail-form>
        <div class="detail-form">
          <div class="row">
            <label>기간 From (YYYY-MM-DD)</label>
            <input v-model="detailForm.fromDate" placeholder="2026-01-01" />
          </div>

          <div class="row">
            <label>기간 To (YYYY-MM-DD)</label>
            <input v-model="detailForm.toDate" placeholder="2026-01-31" />
          </div>

          <div class="row">
            <label>지점(PropertyCode)</label>
            <input v-model="detailForm.propertyCode" placeholder="예: 1" />
          </div>

          <div class="row">
            <label>카테고리 코드</label>
            <input v-model="detailForm.inquiryCategoryCode" placeholder="예: 1(문의), 2(클레임)" />
          </div>
        </div>
      </template>

      <!-- 상세검색 하단 버튼: 여기만 사용 (ListView가 이 슬롯을 지원해야 함) -->
      <template #detail-footer>
        <div class="detail-footer">
          <button type="button" class="btn" @click="onDetailReset">초기화</button>
          <button type="button" class="btn btn--primary" @click="onDetailApply">적용</button>
        </div>
      </template>
    </ListView>

    <InquiryDetailModal
        v-if="showDetailModal"
        :inquiryCode="selectedInquiryCode"
        @close="closeDetailModal"
    />
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.detail-form input {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
}

.btn--primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.ellipsis {
  display: inline-block;
  max-width: 380px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
}
</style>

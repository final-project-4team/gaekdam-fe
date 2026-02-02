<!-- src/views/voc/InquiryListView.vue (예시 경로) -->
<script setup>
import { ref, computed, onMounted } from "vue";
import ListView from "@/components/common/ListView.vue";
import { getInquiryListApi } from "@/api/voc/inquiryApi.js";
import InquiryDetailModal from "@/views/voc/modal/InquiryDetailModal.vue";

/* Search Types */
const searchTypes = [
  { label: "전체", value: "" },
  { label: "키워드(제목/내용)", value: "keyword" },
  { label: "고객명(현재페이지)", value: "customerName" },
  { label: "담당자(현재페이지)", value: "employee" },
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

const columns = [
  { key: "inquiryCode", label: "번호", sortable: true },
  { key: "createdAt", label: "접수일시", sortable: true },
  { key: "customerName", label: "고객명", sortable: false },
  { key: "inquiryCategoryName", label: "유형", sortable: false },
  { key: "inquiryStatus", label: "상태", sortable: true },

  { key: "employeeName", label: "담당자명", sortable: false },
  // { key: "employeeLoginId", label: "담당자ID", sortable: false },
];

/* State */
const rows = ref([]);
const total = ref(0);

const page = ref(1);
const pageSize = ref(10);

const sortState = ref({ sortBy: "created_at", direction: "DESC" });
const filterValues = ref({});
const quickSearch = ref({ key: "", value: "" });

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

const buildParams = () => {
  const params = {
    page: page.value,
    size: pageSize.value,
    sortBy: sortState.value.sortBy || "created_at",
    direction: sortState.value.direction || "DESC",
  };

  if (filterValues.value.status) params.status = filterValues.value.status;

  const cat =
      filterValues.value.inquiryCategoryCode || detailForm.value.inquiryCategoryCode;
  if (cat) params.inquiryCategoryCode = Number(cat);

  if (detailForm.value.fromDate) params.fromDate = detailForm.value.fromDate;
  if (detailForm.value.toDate) params.toDate = detailForm.value.toDate;
  if (detailForm.value.propertyCode)
    params.propertyCode = Number(detailForm.value.propertyCode);

  const v = (quickSearch.value.value ?? "").trim();
  if (v && (quickSearch.value.key === "" || quickSearch.value.key === "keyword")) {
    params.keyword = v;
  }

  return params;
};

const fetchList = async () => {
  const res = await getInquiryListApi(buildParams());
  const pageData = res?.data?.data;

  rows.value = pageData?.content ?? [];
  total.value = pageData?.totalElements ?? 0;
};

const displayRows = computed(() => {
  const key = quickSearch.value.key;
  const value = (quickSearch.value.value ?? "").trim();
  if (!value) return rows.value;

  if (key === "customerName") {
    return rows.value.filter((r) =>
        String(r.customerName ?? "").includes(value)
    );
  }

  //
  if (key === "employee") {
    return rows.value.filter((r) => {
      const name = String(r.employeeName ?? "");
      const loginId = String(r.employeeLoginId ?? "");
      return name.includes(value) || loginId.includes(value);
    });
  }

  return rows.value;
});

/* Events */
const onSearch = async (payload) => {
  page.value = 1;
  quickSearch.value = { key: payload?.key ?? "", value: payload?.value ?? "" };

  // 서버 검색은 keyword(또는 전체)만
  if (quickSearch.value.key === "" || quickSearch.value.key === "keyword") {
    await fetchList();
  }
};

const onFilter = async (values) => {
  page.value = 1;
  filterValues.value = values;
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
  quickSearch.value = { key: "", value: "" };
  sortState.value = { sortBy: "created_at", direction: "DESC" };
  detailForm.value = { fromDate: "", toDate: "", propertyCode: "", inquiryCategoryCode: "" };
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
        @row-click="openDetailModal"
    >
      <template #cell-createdAt="{ row }">
        {{ formatDateTime(row.createdAt) }}
      </template>

      <template #cell-inquiryStatus="{ row }">
        {{ statusLabel(row.inquiryStatus) }}
      </template>

      <!-- ✅ 담당자명 / 담당자ID 컬럼 표시 -->
      <template #cell-employeeName="{ row }">
        {{ row.employeeName ?? "-" }}
      </template>

      <template #cell-employeeLoginId="{ row }">
        {{ row.employeeLoginId ?? "-" }}
      </template>

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
            <input
                v-model="detailForm.inquiryCategoryCode"
                placeholder="예: 1(문의), 2(클레임)"
            />
          </div>
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
</style>

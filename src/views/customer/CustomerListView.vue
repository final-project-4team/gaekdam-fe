<!-- src/views/customer/CustomerListView.vue -->
<template>
  <div class="customer-list-page">
    <div class="top-actions">
      <BaseButton type="ghost" size="sm" @click="openColumnModal">
        표시 항목 선택
      </BaseButton>
    </div>

    <ListView
        :columns="visibleColumns"
        :rows="rows"
        :filters="filters"
        :searchTypes="searchTypes"
        :page="page"
        :pageSize="pageSize"
        :total="totalCount"
        :searchType="searchType"
        show-search
        show-detail
        v-model:detail="detailForm"
        @update:searchType="(v) => (searchType.value = normalizeSearchType(v))"
        @search="onSearch"
        @filter="onFilter"
        @sort-change="onSortChange"
        @page-change="onPageChange"
        @row-click="goDetail"
    >
      <template #detail-form>
        <div class="detail-form">
          <div class="row">
            <label>고객명</label>
            <input v-model="detailForm.customerName" placeholder="고객명" />
          </div>

          <div class="row">
            <label>연락처</label>
            <input v-model="detailForm.phoneNumber" placeholder="010-0000-0000" />
          </div>

          <div class="row">
            <label>이메일</label>
            <input v-model="detailForm.email" placeholder="email@example.com" />
          </div>

          <div class="row">
            <label>고객코드</label>
            <input v-model="detailForm.customerCode" placeholder="숫자" />
          </div>

          <div class="row">
            <label>상태</label>
            <select v-model="detailForm.status">
              <option value="">전체</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="CAUTION">CAUTION</option>
            </select>
          </div>

          <p class="hint">
            * 상세검색 값은 서버 파라미터(customerName/phoneNumber/email/customerCode/status)로 반영됩니다.
          </p>
        </div>
      </template>
    </ListView>

    <BaseModal v-if="showColumnModal" title="표시 항목 선택" @close="showColumnModal = false">
      <div class="column-picker">
        <label v-for="c in columns" :key="c.key" class="chk">
          <input type="checkbox" v-model="columnKeySet" :value="c.key" />
          <span>{{ c.label }}</span>
        </label>

        <div class="modal-actions">
          <BaseButton type="ghost" size="sm" @click="resetColumns">초기화</BaseButton>
          <BaseButton type="primary" size="sm" @click="showColumnModal = false">적용</BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";

import ListView from "@/components/common/ListView.vue";
import BaseButton from "@/components/common/button/BaseButton.vue";
import BaseModal from "@/components/common/modal/BaseModal.vue";

import { useAuthStore } from "@/stores/authStore";
import { getCustomerListApi } from "@/api/customer/customerApi";

/* ===================== */
/* 기본 */
/* ===================== */
const router = useRouter();
const authStore = useAuthStore();

/* ===================== */
/* ✅ SearchTypes: TestView 방식으로 통일(label/value) */
/* - 전체는 value: "" */
/* ===================== */
const searchTypes = [
  { label: "전체", value: "" },
  { label: "고객명", value: "customerName" },
  { label: "대표 연락처", value: "phoneNumber" }, // ✅ 대표연락처 클릭 시 값이 바뀌게 됨
  { label: "이메일", value: "email" },
  { label: "고객코드", value: "customerCode" },
];

const DEFAULT_SEARCH_TYPE = "";
const normalizeSearchType = (v) => {
  const vv = (v ?? "").toString();
  return searchTypes.some((t) => t.value === vv) ? vv : DEFAULT_SEARCH_TYPE;
};

/* ===================== */
/* 필터 */
/* ===================== */
const filters = [
  {
    key: "status",
    options: [
      { label: "상태(전체)", value: "" },
      { label: "ACTIVE", value: "ACTIVE" },
      { label: "INACTIVE", value: "INACTIVE" },
      { label: "CAUTION", value: "CAUTION" },
    ],
  },
  {
    key: "contractType",
    options: [
      { label: "계약주체(전체)", value: "" },
      { label: "INDIVIDUAL", value: "INDIVIDUAL" },
      { label: "CORPORATE", value: "CORPORATE" },
    ],
  },
  {
    key: "nationalityType",
    options: [
      { label: "국적(전체)", value: "" },
      { label: "DOMESTIC", value: "DOMESTIC" },
      { label: "FOREIGN", value: "FOREIGN" },
    ],
  },
  {
    key: "inflowChannel",
    options: [
      { label: "유입채널(전체)", value: "" },
      { label: "WEB", value: "WEB" },
      { label: "OFFLINE", value: "OFFLINE" },
      { label: "OTA", value: "OTA" },
    ],
  },

  /* 멤버십 */
  {
    key: "membershipGrade",
    options: [
      { label: "멤버십(전체)", value: "" },
      { label: "미가입", value: "NONE" },
      { label: "BASIC", value: "BASIC" },
      { label: "BRONZE", value: "BRONZE" },
      { label: "SILVER", value: "SILVER" },
      { label: "GOLD", value: "GOLD" },
      { label: "PLATINUM", value: "PLATINUM" },
      { label: "DIAMOND", value: "DIAMOND" },
    ],
  },

  /* 로열티 */
  {
    key: "loyaltyGrade",
    options: [
      { label: "로열티(전체)", value: "" },
      { label: "-", value: "NONE" },
      { label: "GENERAL", value: "GENERAL" },
      { label: "EXCELLENT", value: "EXCELLENT" },
      { label: "VIP", value: "VIP" },
    ],
  },
];

/* ===================== */
/* 컬럼 */
/* ===================== */
const columns = [
  { key: "customerCode", label: "고객코드", sortable: true, align: "center" },
  { key: "customerName", label: "고객명", sortable: true, align: "center" },
  { key: "primaryContact", label: "대표 연락처", sortable: false, align: "center" },
  { key: "status", label: "상태", sortable: true, align: "center" },
  { key: "membershipGrade", label: "멤버십", sortable: true, align: "center" },
  { key: "loyaltyGrade", label: "로열티", sortable: true, align: "center" },
  { key: "lastUsedDate", label: "최근 이용", sortable: true, align: "center" },
  { key: "inflowChannel", label: "유입 채널", sortable: true, align: "center" },
  { key: "contractType", label: "계약 주체", sortable: true, align: "center" },
  { key: "nationalityType", label: "국적", sortable: true, align: "center" },
];

/* ===================== */
/* 표시 컬럼 선택 */
/* ===================== */
const showColumnModal = ref(false);
const columnKeySet = ref(columns.map((c) => c.key));

const visibleColumns = computed(() => {
  const set = new Set(columnKeySet.value);
  return columns.filter((c) => set.has(c.key));
});

const openColumnModal = () => (showColumnModal.value = true);
const resetColumns = () => (columnKeySet.value = columns.map((c) => c.key));

/* ===================== */
/* 상태 */
/* ===================== */
const rows = ref([]);
const totalCount = ref(0);

const page = ref(1);
const pageSize = ref(10);

/* ✅ 기본값: 전체 */
const searchType = ref(DEFAULT_SEARCH_TYPE);
const searchValue = ref("");

const filterValues = ref({});
const sortState = ref({ sortBy: "customer_code", direction: "DESC" });

const defaultDetailForm = () => ({
  customerName: "",
  phoneNumber: "",
  email: "",
  customerCode: "",
  status: "",
});

const detailForm = ref(defaultDetailForm());

/* ===================== */
/* normalize */
/* ===================== */
const t = (v) => (v ?? "").toString().trim();
const phoneDigits = (v) => (v ?? "").toString().replace(/\D/g, "");
const emailLower = (v) => (v ?? "").toString().trim().toLowerCase();

/* ===================== */
/* API */
/* ===================== */
const hotelGroupCode = computed(() => authStore.hotel?.hotelGroupCode);

const buildParams = () => {
  const d =
      detailForm.value && Object.keys(detailForm.value).length ? detailForm.value : defaultDetailForm();

  const params = {
    hotelGroupCode: hotelGroupCode.value,
    page: page.value,
    size: pageSize.value,

    // 필터
    status: filterValues.value.status || undefined,
    contractType: filterValues.value.contractType || undefined,
    nationalityType: filterValues.value.nationalityType || undefined,
    inflowChannel: filterValues.value.inflowChannel || undefined,

    // 추가 필터
    membershipGrade: filterValues.value.membershipGrade || undefined,
    loyaltyGrade: filterValues.value.loyaltyGrade || undefined,

    // 상세검색
    customerName: t(d.customerName) || undefined,
    phoneNumber: phoneDigits(d.phoneNumber) || undefined,
    email: emailLower(d.email) || undefined,
    customerCode: t(d.customerCode) ? Number(t(d.customerCode)) : undefined,
    ...(t(d.status) ? { status: t(d.status) } : {}),

    // 정렬
    sortBy: sortState.value.sortBy || "created_at",
    direction: sortState.value.direction || "DESC",
  };

  // 상단 검색
  const v = t(searchValue.value);
  const st = normalizeSearchType(searchType.value); // "" | customerName | phoneNumber | email | customerCode

  if (v) {
    // ✅ 전체(= "")면 keyword로 보내기
    if (st === "") params.keyword = v;

    if (st === "customerName") params.customerName = v;
    if (st === "phoneNumber") params.phoneNumber = phoneDigits(v);
    if (st === "email") params.email = emailLower(v);
    if (st === "customerCode") params.customerCode = Number(v);
  }

  return params;
};

const loadCustomers = async () => {
  if (!hotelGroupCode.value) return;

  const res = await getCustomerListApi(buildParams());
  const data = res.data?.data;

  rows.value = (data?.content ?? []).map((it) => ({
    customerCode: it.customerCode,
    customerName: it.customerName,
    primaryContact: it.primaryContact,
    status: it.status,
    membershipGrade: it.membershipGrade ?? "미가입",
    loyaltyGrade: it.loyaltyGrade ?? "-",
    lastUsedDate: it.lastUsedDate ?? "-",
    inflowChannel: it.inflowChannel ?? "-",
    contractType: it.contractType ?? "-",
    nationalityType: it.nationalityType ?? "-",
  }));

  totalCount.value = data?.totalElements ?? 0;
};

/* ===================== */
/* 이벤트 */
/* ===================== */
const onSearch = ({ key, value }) => {
  page.value = 1;

  // ✅ ListView가 key로 내려주는 값이 searchTypes.value랑 동일해야 함
  searchType.value = normalizeSearchType(key);
  searchValue.value = value ?? "";

  loadCustomers();
};

const onFilter = (values) => {
  filterValues.value = values;
  page.value = 1;
  loadCustomers();
};

const onSortChange = ({ sortBy, direction }) => {
  const map = {
    createdAt: "created_at",
    customerCode: "customer_code",
    customerName: "customer_name",
    lastUsedDate: "last_used_date",
  };

  sortState.value = {
    sortBy: map[sortBy] || sortBy || "created_at",
    direction: (direction || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC",
  };

  page.value = 1;
  loadCustomers();
};

const onPageChange = (p) => {
  page.value = p;
  loadCustomers();
};

/* ===================== */
/* 초기 로딩 */
/* ===================== */
watch(
    () => hotelGroupCode.value,
    (v) => {
      if (v) loadCustomers();
    },
    { immediate: true }
);

/* ===================== */
/* 상세검색 watch: debounce */
/* ===================== */
let detailTimer = null;
let lastDetailKey = "";

const normalizeDetailForKey = (d) => ({
  customerName: t(d.customerName),
  phoneNumber: phoneDigits(d.phoneNumber),
  email: emailLower(d.email),
  customerCode: t(d.customerCode),
  status: t(d.status),
});

watch(
    () => ({ ...detailForm.value }),
    (v) => {
      if (!v || Object.keys(v).length === 0) {
        detailForm.value = defaultDetailForm();
        return;
      }

      const key = JSON.stringify(normalizeDetailForKey(v));
      if (key === lastDetailKey) return;
      lastDetailKey = key;

      page.value = 1;

      clearTimeout(detailTimer);
      detailTimer = setTimeout(() => {
        loadCustomers();
      }, 450);
    },
    { deep: true }
);

onBeforeUnmount(() => {
  if (detailTimer) clearTimeout(detailTimer);
});

/* ===================== */
/* Row click -> 상세 */
/* ===================== */
const goDetail = (row) => {
  if (!row?.customerCode) return;
  router.push({ name: "CustomerDetail", params: { id: row.customerCode } });
};
</script>

<style scoped>
.customer-list-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
}

.top-actions {
  display: flex;
  justify-content: flex-end;
}

.detail-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-form .row {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  font-size: 14px;
}

.hint {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.column-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chk {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: #374151;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}
</style>

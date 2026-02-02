<template>
  <div class="incident-page">
    <ListView
        :columns="columns"
        :rows="rows"
        :filters="filters"
        :searchTypes="searchTypes"
        :page="page"
        :pageSize="pageSize"
        :total="total"
        show-search
        @search="onSearch"
        @filter="onFilter"
        @sort-change="onSortChange"
        @page-change="onPageChange"
        @row-click="openDetail"
    >
      <template #cell-incidentCode="{ row }">
        <span class="mono strong">{{ fmtIncidentNo(row.incidentCode) }}</span>
      </template>

      <template #cell-createdAt="{ row }">
        <span class="mono">{{ fmtDateTime(row.createdAt) }}</span>
      </template>

      <template #cell-inquiryCode="{ row }">
        <span class="mono">{{ row.inquiryCode ? fmtInquiryNo(row.inquiryCode) : "-" }}</span>
      </template>

      <!--  담당자: employeeName 우선 표시 -->
      <template #cell-employee="{ row }">
        <span class="mono">
          {{ row.employeeName ? row.employeeName : (row.employeeLoginId || row.employeeCode || "-") }}
        </span>
      </template>

      <template #cell-incidentStatus="{ row }">
        <span :class="['status-pill', row.incidentStatus]">
          {{ fmtStatus(row.incidentStatus) }}
        </span>
      </template>

      <template #cell-severity="{ row }">
        <span :class="['sev-pill', row.severity]">
          {{ row.severity || "-" }}
        </span>
      </template>
    </ListView>

    <div class="fab">
      <BaseButton type="primary" size="md" @click="openCreate">
        사건/사고 등록
      </BaseButton>
    </div>

    <IncidentDetailModal
        v-if="showDetail"
        :incidentCode="selectedIncidentCode"
        @close="closeDetail"
        @updated="load"
    />

    <IncidentCreateModal
        v-if="showCreate"
        @close="closeCreate"
        @created="afterCreated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import ListView from "@/components/common/ListView.vue";
import BaseButton from "@/components/common/button/BaseButton.vue";

import IncidentCreateModal from "../modal/IncidentCreateModal.vue";
import IncidentDetailModal from "../modal/IncidentDetailModal.vue";

import { getIncidentListApi } from "@/api/voc/incidentApi";

const columns = [
  { key: "incidentCode", label: "사건번호", sortable: true, align: "center" },
  { key: "createdAt", label: "등록일시", sortable: true, align: "center" },
  { key: "incidentTitle", label: "제목", sortable: false, align: "left" },
  { key: "inquiryCode", label: "연결 문의", sortable: false, align: "center" },
  { key: "employee", label: "담당자", sortable: false, align: "center" },
  { key: "incidentStatus", label: "상태", sortable: true, align: "center" },
  { key: "severity", label: "심각도", sortable: true, align: "center" },
];

const searchTypes = [
  { label: "전체", value: "" },
  { label: "제목/내용", value: "keyword" },
];

const filters = [
  {
    key: "status",
    options: [
      { label: "처리상태", value: "" },
      { label: "조치중", value: "IN_PROGRESS" },
      { label: "종결", value: "CLOSED" },
    ],
  },
  {
    key: "severity",
    options: [
      { label: "심각도", value: "" },
      { label: "LOW", value: "LOW" },
      { label: "MEDIUM", value: "MEDIUM" },
      { label: "HIGH", value: "HIGH" },
      { label: "CRITICAL", value: "CRITICAL" },
    ],
  },
];

const rows = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

const filterState = ref({ status: "", severity: "" });
const sortState = ref({ sortBy: "created_at", direction: "DESC" });
const searchValue = ref("");

const t = (v) => (v ?? "").toString().trim();

const buildParams = () => ({
  page: page.value,
  size: pageSize.value,
  status: filterState.value.status || undefined,
  severity: filterState.value.severity || undefined,
  ...(t(searchValue.value) ? { keyword: t(searchValue.value) } : {}),
  sortBy: sortState.value.sortBy || "created_at",
  direction: sortState.value.direction || "DESC",
});

const load = async () => {
  const res = await getIncidentListApi(buildParams());
  const data = res.data?.data;

  // ✅ employeeName/employeeLoginId 백에서 내려옴
  rows.value = (data?.content ?? []).map((r) => ({
    ...r,
    employeeName: r.employeeName ?? "",
    employeeLoginId: r.employeeLoginId ?? "",
  }));

  total.value = data?.totalElements ?? 0;
};

onMounted(load);

const onSearch = ({ value }) => {
  page.value = 1;
  searchValue.value = value ?? "";
  load();
};

const onFilter = (values) => {
  page.value = 1;
  filterState.value = { ...filterState.value, ...values };
  load();
};

const onSortChange = ({ sortBy, direction }) => {
  const map = {
    createdAt: "created_at",
    severity: "severity",
    incidentStatus: "incident_status",
  };

  sortState.value = {
    sortBy: map[sortBy] || "created_at",
    direction: (direction || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC",
  };

  page.value = 1;
  load();
};

const onPageChange = (p) => {
  page.value = p;
  load();
};

const showCreate = ref(false);
const showDetail = ref(false);
const selectedIncidentCode = ref(null);

const openCreate = () => (showCreate.value = true);
const closeCreate = () => (showCreate.value = false);

const openDetail = (row) => {
  selectedIncidentCode.value = row.incidentCode;
  showDetail.value = true;
};

const closeDetail = () => {
  showDetail.value = false;
  selectedIncidentCode.value = null;
};

const afterCreated = () => {
  showCreate.value = false;
  page.value = 1;
  load();
};

const pad2 = (n) => String(n).padStart(2, "0");
const fmtDateTime = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const fmtIncidentNo = (code) => (code ? `C-${code}` : "-");
const fmtInquiryNo = (code) => (code ? `Q-${code}` : "-");

const fmtStatus = (s) => {
  if (s === "IN_PROGRESS") return "조치중";
  if (s === "CLOSED") return "종결";
  return s || "-";
};
</script>

<style scoped>
.incident-page { position: relative; }
.fab { position: fixed; right: 28px; bottom: 28px; z-index: 30; }
.mono { font-variant-numeric: tabular-nums; }
.strong { font-weight: 800; }

.status-pill {
  display: inline-flex; align-items: center; height: 26px; padding: 0 10px;
  border-radius: 999px; font-size: 12px; font-weight: 800;
  border: 1px solid #e5e7eb; background: #f9fafb;
}
.status-pill.IN_PROGRESS { background: #eff6ff; border-color: #bfdbfe; }
.status-pill.CLOSED { background: #f3f4f6; border-color: #e5e7eb; }

.sev-pill {
  display: inline-flex; align-items: center; height: 26px; padding: 0 10px;
  border-radius: 999px; font-size: 12px; font-weight: 800;
  border: 1px solid #e5e7eb; background: #fff;
}
.sev-pill.CRITICAL { background: #fef2f2; border-color: #fecaca; }
.sev-pill.HIGH { background: #fff7ed; border-color: #fed7aa; }
.sev-pill.MEDIUM { background: #eff6ff; border-color: #bfdbfe; }
.sev-pill.LOW { background: #f0fdf4; border-color: #bbf7d0; }
</style>

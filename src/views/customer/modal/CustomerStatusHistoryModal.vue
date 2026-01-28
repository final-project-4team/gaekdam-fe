<!-- src/views/customer/modal/CustomerStatusHistoryModal.vue -->
<template>
  <BaseModal v-if="open" title="고객 상태 변경 이력" @close="$emit('close')">
    <div class="modal-body">
      <!-- 상단 필터바 -->
      <div class="filter-bar">
        <div class="left">
          <div class="quick">
            <button class="pill" :class="{ active: range.months === 1 }" @click="setMonths(1)">1개월</button>
            <button class="pill" :class="{ active: range.months === 3 }" @click="setMonths(3)">3개월</button>
            <button class="pill" :class="{ active: range.months === 6 }" @click="setMonths(6)">6개월</button>
            <button class="pill" :class="{ active: range.months === 12 }" @click="setMonths(12)">12개월</button>
          </div>
        </div>

        <div class="right">
          <input class="date" type="date" v-model="range.from" />
          <span class="sep">~</span>
          <input class="date" type="date" v-model="range.to" />
          <BaseButton type="ghost" size="sm" @click="resetRange">초기화</BaseButton>
          <BaseButton type="primary" size="sm" @click="applyRange">적용</BaseButton>
        </div>
      </div>

      <!-- 상태 -->
      <div v-if="loading" class="state">불러오는 중...</div>
      <div v-else-if="error" class="state state--error">{{ error }}</div>
      <div v-else-if="rows.length === 0" class="state">이력이 없습니다.</div>

      <!-- 테이블 -->
      <TableWithPaging
          v-else
          :columns="columns"
          :rows="rows"
          :pageSize="20"
      />
    </div>

    <template #footer>
      <BaseButton type="ghost" size="sm" @click="$emit('close')">닫기</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";

import BaseModal from "@/components/common/modal/BaseModal.vue";
import BaseButton from "@/components/common/button/BaseButton.vue";
import TableWithPaging from "@/components/common/table/TableWithPaging.vue";

import { getCustomerStatusHistoriesApi } from "@/api/customer/customerApi.js";

/**
 * ✅ 사용처(Detail)에서 이렇게 호출하면 끝
 * <CustomerStatusHistoryModal :open="show" :customerCode="customerCode" @close="show=false" />
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  customerCode: { type: [Number, String], required: true },
});

const emit = defineEmits(["close"]);

const loading = ref(false);
const error = ref("");
const raw = ref([]);     // API 원본
const rows = ref([]);    // TableWithPaging용

/* =========================
   columns
   ========================= */
const columns = [
  { key: "changedAt", label: "변경일시", sortable: true, align: "center" },
  { key: "fromStatus", label: "변경 전", sortable: true, align: "center" },
  { key: "toStatus", label: "변경 후", sortable: true, align: "center" },
  { key: "reason", label: "변경 사유", sortable: false },
  { key: "changedBy", label: "변경자", sortable: false, align: "center" },
];

/* =========================
   date helpers
   ========================= */
const todayYmd = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addMonthsFromTodayYmd = (monthsAgo) => {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const parseYmdDate = (ymd) => {
  if (!ymd) return null;
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const inRange = (dateValue, fromYmd, toYmd) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;

  const from = parseYmdDate(fromYmd);
  const to = parseYmdDate(toYmd);
  if (!from || !to) return true;

  const end = new Date(to);
  end.setDate(end.getDate() + 1); // to inclusive
  return d >= from && d < end;
};

const formatDate = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
};

/* =========================
   range state
   ========================= */
const range = ref({
  months: 3,
  from: addMonthsFromTodayYmd(3),
  to: todayYmd(),
});

const setMonths = (m) => {
  range.value.months = m;
  range.value.from = addMonthsFromTodayYmd(m);
  range.value.to = todayYmd();
};

const resetRange = () => setMonths(3);

/* =========================
   mapping (API -> UI)
   =========================
   ✅ 백엔드 필드명이 다를 수 있으니 여기만 맞추면 됨
   - changedAt / changed_at
   - fromStatus / beforeStatus / prevStatus
   - toStatus / afterStatus / nextStatus
   - reason / changeReason
   - changedBy / changer / employeeName ...
*/
const normalizeItem = (x) => {
  const changedAt =
      x?.changedAt ?? x?.changed_at ?? x?.createdAt ?? x?.created_at ?? null;

  const fromStatus =
      x?.fromStatus ?? x?.beforeStatus ?? x?.prevStatus ?? x?.oldStatus ?? "-";

  const toStatus =
      x?.toStatus ?? x?.afterStatus ?? x?.nextStatus ?? x?.newStatus ?? "-";

  const reason =
      x?.reason ?? x?.changeReason ?? x?.memo ?? x?.description ?? "-";

  const changedBy =
      x?.changedBy ?? x?.changer ?? x?.employeeName ?? x?.employeeCode ?? "-";

  return { changedAt, fromStatus, toStatus, reason, changedBy, _raw: x };
};

const buildRows = () => {
  const filtered = (raw.value ?? []).filter((x) => {
    const changedAt =
        x?.changedAt ?? x?.changed_at ?? x?.createdAt ?? x?.created_at;
    if (!changedAt) return true;
    return inRange(changedAt, range.value.from, range.value.to);
  });

  rows.value = filtered.map((x, idx) => {
    const n = normalizeItem(x);
    return {
      id: idx + 1,
      changedAt: formatDate(n.changedAt),
      fromStatus: n.fromStatus,
      toStatus: n.toStatus,
      reason: n.reason,
      changedBy: n.changedBy,
      _raw: n._raw,
    };
  });
};

/* =========================
   API load
   ========================= */
const load = async () => {
  if (!props.customerCode) return;

  loading.value = true;
  error.value = "";
  try {
    // ✅ A안: customerApi에 이미 만들어둔 함수 그대로 사용
    // getCustomerStatusHistoriesApi({ customerCode, size, offset, sortBy, direction })
    const data = await getCustomerStatusHistoriesApi({
      customerCode: Number(props.customerCode),
      size: 200,
      offset: 0,
      sortBy: "changed_at",
      direction: "DESC",
    });

    const items = data?.items ?? data?.content ?? data?.list ?? data ?? [];
    raw.value = Array.isArray(items) ? items : [];
    buildRows();
  } catch (e) {
    raw.value = [];
    rows.value = [];
    error.value = "상태 변경 이력을 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
};

const applyRange = () => buildRows();

/* =========================
   lifecycle
   ========================= */
watch(
    () => props.open,
    async (v) => {
      if (!v) return;
      // 모달 열릴 때 기본 3개월로 세팅 + 로드
      setMonths(range.value.months || 3);
      await load();
    }
);

onMounted(() => {
  // open 상태로 시작하는 케이스 대응
  if (props.open) load();
});
</script>

<style scoped>
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 상단 필터바 */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.quick {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill {
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  cursor: pointer;
}

.pill.active {
  background: #eef6ff;
  border-color: #bfdbfe;
  color: #2563eb;
}

.right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.date {
  height: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 600;
  color: #111827;
}

.sep {
  color: #6b7280;
  font-weight: 700;
}

.state {
  padding: 10px;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  color: #6b7280;
  font-size: 13px;
}

.state--error {
  border-color: #fecaca;
  color: #b91c1c;
  background: #fff5f5;
}
</style>

<template>
  <!-- 우측 메모 카드 -->
  <section class="card">
    <div class="card-head">
      <div class="card-title">고객 메모</div>

      <div class="right-actions">
        <BaseButton type="primary" size="sm" @click="openCreate">메모 작성</BaseButton>

        <div class="outline-wrap">
          <BaseButton type="ghost" size="sm" @click="openList">전체 보기</BaseButton>
        </div>
      </div>
    </div>

    <div class="memo-list">
      <div
          v-for="m in recent"
          :key="m.customerMemoCode"
          class="memo"
          @click="openDetail(m.customerMemoCode)"
      >
        <div class="memo-head">
          <div class="memo-at">{{ fmt(m.createdAt) }}</div>
          <div class="memo-actions" @click.stop>
            <BaseButton type="warning" size="sm" @click="openEdit(m)">수정</BaseButton>
            <BaseButton type="danger" size="sm" @click="openDelete(m)">삭제</BaseButton>
          </div>
        </div>
        <div class="memo-text">{{ m.customerMemoContent }}</div>
      </div>

      <div v-if="recent.length === 0" class="empty">메모가 없습니다.</div>
    </div>
  </section>

  <!-- 작성 -->
  <BaseModal v-if="showCreate" title="메모 작성" @close="showCreate = false">
    <div class="modal-body">
      <textarea v-model="createText" class="textarea" placeholder="메모 내용을 입력하세요" />
    </div>
    <template #footer>
      <BaseButton type="ghost" size="sm" @click="showCreate = false">취소</BaseButton>
      <BaseButton type="primary" size="sm" :disabled="saving" @click="create">저장</BaseButton>
    </template>
  </BaseModal>

  <!-- 전체 보기 -->
  <BaseModal v-if="showList" title="고객 메모 전체 보기" @close="closeList">
    <div class="modal-body">
      <!-- ✅ 기간 필터 -->
      <div class="filter-bar">
        <div class="preset">
          <BaseButton
              v-for="m in presetMonths"
              :key="m"
              type="ghost"
              size="sm"
              :class="{ active: selectedPreset === m }"
              @click="applyPreset(m)"
          >
            {{ m }}개월
          </BaseButton>
        </div>

        <div class="range">
          <input type="date" v-model="fromDate" />
          <span class="dash">-</span>
          <input type="date" v-model="toDate" />
          <BaseButton type="primary" size="sm" :disabled="loading" @click="applyRange">
            조회
          </BaseButton>
          <BaseButton type="ghost" size="sm" :disabled="loading" @click="resetRange">
            초기화
          </BaseButton>
        </div>
      </div>

      <div v-if="loading" class="loading">불러오는 중...</div>

      <div v-else class="list-wrap">
        <div
            v-for="m in list.content"
            :key="m.customerMemoCode"
            class="list-item"
            @click="openDetail(m.customerMemoCode)"
        >
          <div class="list-head">
            <div class="list-at">{{ fmt(m.createdAt) }}</div>
            <div class="list-actions" @click.stop>
              <BaseButton type="warning" size="sm" @click="openEdit(m)">수정</BaseButton>
              <BaseButton type="danger" size="sm" @click="openDelete(m)">삭제</BaseButton>
            </div>
          </div>
          <div class="list-text">{{ m.customerMemoContent }}</div>
        </div>

        <div v-if="list.content.length === 0" class="empty">조회 결과가 없습니다.</div>

        <div class="paging">
          <BaseButton type="ghost" size="sm" :disabled="list.page <= 1" @click="goPage(list.page - 1)">
            이전
          </BaseButton>
          <div class="page-info">{{ list.page }} / {{ list.totalPages }}</div>
          <BaseButton
              type="ghost"
              size="sm"
              :disabled="list.page >= list.totalPages"
              @click="goPage(list.page + 1)"
          >
            다음
          </BaseButton>
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton type="ghost" size="sm" @click="closeList">닫기</BaseButton>
    </template>
  </BaseModal>

  <!-- 상세 -->
  <BaseModal v-if="showDetail" title="메모 상세" @close="closeDetail">
    <div class="modal-body">
      <div v-if="detailLoading" class="loading">불러오는 중...</div>
      <div v-else-if="!detail" class="empty">데이터가 없습니다.</div>
      <div v-else>
        <div class="detail-at">{{ fmt(detail.createdAt) }}</div>
        <div class="detail-text">{{ detail.customerMemoContent }}</div>
      </div>
    </div>
    <template #footer>
      <BaseButton type="ghost" size="sm" @click="closeDetail">닫기</BaseButton>
    </template>
  </BaseModal>

  <!-- 수정 -->
  <BaseModal v-if="showEdit" title="메모 수정" @close="closeEdit">
    <div class="modal-body">
      <textarea v-model="editText" class="textarea" placeholder="메모 내용을 입력하세요" />
    </div>
    <template #footer>
      <BaseButton type="danger" size="sm" @click="openDelete(editTarget)">삭제</BaseButton>
      <BaseButton type="ghost" size="sm" @click="closeEdit">취소</BaseButton>
      <BaseButton type="warning" size="sm" :disabled="saving" @click="update">저장</BaseButton>
    </template>
  </BaseModal>

  <!-- 삭제 확인 -->
  <BaseModal v-if="showDelete" title="메모 삭제" @close="showDelete = false">
    <div class="modal-body">삭제하시겠습니까? (복구 불가)</div>
    <template #footer>
      <BaseButton type="ghost" size="sm" @click="showDelete = false">취소</BaseButton>
      <BaseButton type="danger" size="sm" :disabled="saving" @click="remove">삭제</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { onMounted, ref } from "vue";
import BaseButton from "@/components/common/button/BaseButton.vue";
import BaseModal from "@/components/common/modal/BaseModal.vue";

import {
  getCustomerMemosApi,
  getCustomerMemoDetailApi,
  createCustomerMemoApi,
  updateCustomerMemoApi,
  deleteCustomerMemoApi,
} from "@/api/customer/customerMemoApi";

const props = defineProps({
  customerCode: { type: [Number, String], required: true },
});

// ✅ CustomerDetailView에게 “메모 변경됨” 알리기
const emit = defineEmits(["changed"]);

/* state */
const recent = ref([]);

const showCreate = ref(false);
const createText = ref("");

const showList = ref(false);
const loading = ref(false);
const list = ref({ content: [], page: 1, size: 20, totalElements: 0, totalPages: 1 });

const showDetail = ref(false);
const detailLoading = ref(false);
const detail = ref(null);

const showEdit = ref(false);
const editTarget = ref(null);
const editText = ref("");

const showDelete = ref(false);
const deleteTarget = ref(null);

const saving = ref(false);

/* ✅ 기간 필터 state */
const presetMonths = [1, 3, 6, 12];
const selectedPreset = ref(null);
const fromDate = ref(""); // yyyy-MM-dd
const toDate = ref("");   // yyyy-MM-dd

const toIsoStart = (yyyyMMdd) => (yyyyMMdd ? `${yyyyMMdd}T00:00:00` : undefined);
const toIsoEnd = (yyyyMMdd) => (yyyyMMdd ? `${yyyyMMdd}T23:59:59` : undefined);

/* loaders */
const loadRecent = async () => {
  const res = await getCustomerMemosApi({ customerCode: props.customerCode, page: 1, size: 3 });
  recent.value = res.data?.data?.content ?? [];
};

const loadList = async (page = list.value.page) => {
  loading.value = true;
  try {
    const res = await getCustomerMemosApi({
      customerCode: props.customerCode,
      page,
      size: list.value.size,
      fromDate: toIsoStart(fromDate.value),
      toDate: toIsoEnd(toDate.value),
    });
    list.value = res.data?.data ?? list.value;
  } finally {
    loading.value = false;
  }
};

/* create */
const openCreate = () => {
  createText.value = "";
  showCreate.value = true;
};

const create = async () => {
  if (saving.value) return;

  const content = createText.value.trim();
  if (!content) return;

  saving.value = true;
  try {
    await createCustomerMemoApi({
      customerCode: props.customerCode,
      body: { customerMemoContent: content },
    });

    showCreate.value = false;

    await Promise.all([loadRecent(), showList.value ? loadList(1) : Promise.resolve()]);
    emit("changed"); // ✅ 타임라인 즉시 반영
  } finally {
    saving.value = false;
  }
};

/* list modal */
const openList = async () => {
  showList.value = true;
  await loadList(1);
};

const closeList = () => {
  showList.value = false;
};

const goPage = async (p) => {
  await loadList(p);
};

/* ✅ 기간 필터 액션 */
const applyPreset = async (m) => {
  selectedPreset.value = m;

  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  start.setMonth(start.getMonth() - m);

  const toYmd = (d) => {
    const y = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  fromDate.value = toYmd(start);
  toDate.value = toYmd(end);

  await loadList(1);
};

const applyRange = async () => {
  selectedPreset.value = null;
  await loadList(1);
};

const resetRange = async () => {
  selectedPreset.value = null;
  fromDate.value = "";
  toDate.value = "";
  await loadList(1);
};

/* detail */
const openDetail = async (memoCode) => {
  showDetail.value = true;
  detailLoading.value = true;
  detail.value = null;

  try {
    const res = await getCustomerMemoDetailApi({ customerCode: props.customerCode, memoCode });
    detail.value = res.data?.data ?? null;
  } finally {
    detailLoading.value = false;
  }
};

const closeDetail = () => {
  showDetail.value = false;
  detail.value = null;
};

/* edit */
const openEdit = (m) => {
  editTarget.value = m;
  editText.value = m?.customerMemoContent ?? "";
  showEdit.value = true;
};

const closeEdit = () => {
  showEdit.value = false;
  editTarget.value = null;
  editText.value = "";
};

const update = async () => {
  if (saving.value) return;
  if (!editTarget.value) return;

  const content = editText.value.trim();
  if (!content) return;

  saving.value = true;
  try {
    await updateCustomerMemoApi({
      customerCode: props.customerCode,
      memoCode: editTarget.value.customerMemoCode,
      body: { customerMemoContent: content },
    });

    closeEdit();

    await Promise.all([loadRecent(), showList.value ? loadList(list.value.page) : Promise.resolve()]);
    emit("changed"); // ✅ 타임라인 즉시 반영
  } finally {
    saving.value = false;
  }
};

/* delete */
const openDelete = (m) => {
  if (!m) return;
  deleteTarget.value = m;
  showDelete.value = true;
};

const remove = async () => {
  if (saving.value) return;
  if (!deleteTarget.value) return;

  saving.value = true;
  try {
    await deleteCustomerMemoApi({
      customerCode: props.customerCode,
      memoCode: deleteTarget.value.customerMemoCode,
    });

    showDelete.value = false;
    deleteTarget.value = null;

    if (showEdit.value) closeEdit();

    await Promise.all([loadRecent(), showList.value ? loadList(1) : Promise.resolve()]);
    emit("changed"); // ✅ 타임라인 즉시 반영
  } finally {
    saving.value = false;
  }
};

onMounted(loadRecent);

/* utils */
const fmt = (v) => {
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
</script>

<style scoped>
.card {
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 12px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.card-title {
  font-size: 13px;
  font-weight: 900;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.outline-wrap :deep(button) {
  height: 30px !important;
  padding: 0 12px !important;
  border-radius: 999px !important;
  background: #fff !important;
  border: 1px solid #e5e7eb !important;
  color: #2563eb !important;
  font-weight: 900 !important;
}

.outline-wrap :deep(button:hover) {
  background: #f3f4f6 !important;
}

.memo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.memo {
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
}

.memo:hover {
  border-color: #c7d2fe;
}

.memo-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.memo-actions {
  display: flex;
  gap: 8px;
}

.memo-at {
  font-size: 12px;
  color: #6b7280;
  font-weight: 800;
}

.memo-text {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 700;
  white-space: pre-wrap;
}

.empty {
  padding: 10px;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  color: #6b7280;
  font-size: 13px;
}

.textarea {
  width: 100%;
  min-height: 140px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  font-size: 14px;
  outline: none;
}

.loading {
  padding: 10px;
  font-weight: 800;
  color: #6b7280;
}

.list-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.list-item {
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
}

.list-item:hover {
  border-color: #c7d2fe;
}

.list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-at {
  font-size: 12px;
  color: #6b7280;
  font-weight: 900;
}

.list-actions {
  display: flex;
  gap: 8px;
}

.list-text {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 700;
  white-space: pre-wrap;
}

.paging {
  margin-top: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.page-info {
  font-weight: 900;
  color: #374151;
}

.detail-at {
  font-size: 12px;
  color: #6b7280;
  font-weight: 900;
}

.detail-text {
  margin-top: 10px;
  white-space: pre-wrap;
  font-size: 14px;
  font-weight: 700;
}

/* ✅ 기간 필터 UI */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.preset {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preset :deep(button.active) {
  border: 2px solid #2563eb !important;
}

.range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range input[type="date"] {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 6px 8px;
  font-weight: 700;
}

.dash {
  color: #6b7280;
  font-weight: 900;
}
</style>

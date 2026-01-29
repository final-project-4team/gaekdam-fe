<template>
  <BaseModal title="사건/사고 상세" @close="$emit('close')">
    <!-- BaseModal footer를 override: 조치완료(왼쪽) + 닫기(오른쪽) -->
    <template #footer>
      <BaseButton
          v-if="isClosable"
          type="primary"
          size="sm"
          :disabled="closing"
          @click="closeIncident"
      >
        {{ closing ? "처리중..." : "조치 완료" }}
      </BaseButton>

      <BaseButton type="ghost" size="sm" @click="$emit('close')">
        닫기
      </BaseButton>
    </template>

    <div class="modal">
      <div v-if="loading" class="state">불러오는 중...</div>
      <div v-else-if="error" class="state state--error">{{ error }}</div>

      <div v-else class="body">
        <section class="card">
          <header class="card-head">
            <div class="card-title">기본정보</div>
          </header>

          <div class="grid">
            <div class="row span2">
              <span class="k">제목</span>
              <span class="v">{{ d.incidentTitle ?? "-" }}</span>
            </div>

            <div class="row">
              <span class="k">사건번호</span>
              <span class="v mono">C-{{ d.incidentCode ?? "-" }}</span>
            </div>

            <div class="row">
              <span class="k">등록일시</span>
              <span class="v mono">{{ fmt(d.createdAt) }}</span>
            </div>

            <div class="row">
              <span class="k">지점</span>
              <span class="v mono">{{ d.propertyCode ?? "-" }}</span>
            </div>

            <div class="row">
              <span class="k">담당자</span>
              <span class="v">{{ employeeLabel }}</span>
            </div>

            <div class="row">
              <span class="k">상태</span>
              <span class="v">
                <span class="badge" :class="statusBadgeClass(d.incidentStatus)">
                  {{ statusLabel(d.incidentStatus) }}
                </span>
              </span>
            </div>

            <div class="row">
              <span class="k">심각도</span>
              <span class="v">
                <span class="badge" :class="severityBadgeClass(d.severity)">
                  {{ severityLabel(d.severity) }}
                </span>
              </span>
            </div>

            <div class="row span2">
              <span class="k">요약</span>
              <span class="v">{{ d.incidentSummary ?? "-" }}</span>
            </div>

            <div class="row span2">
              <span class="k">내용</span>
              <div class="panel">
                <pre class="content">{{ d.incidentContent ?? "-" }}</pre>
              </div>
            </div>

            <div class="row span2">
              <span class="k">연결 문의</span>
              <span class="v mono">{{ d.inquiryCode ? `Q-${d.inquiryCode}` : "-" }}</span>
            </div>
          </div>
        </section>

        <section class="card">
          <header class="card-head">
            <div class="card-title">조치 이력</div>
          </header>

          <!-- CLOSED면 입력 폼 숨김 -->
          <div v-if="isActionWritable" class="action-form">
            <textarea
                v-model="actionContent"
                rows="3"
                placeholder="조치내용을 입력하세요 (필수)"
                :disabled="savingAction"
            />
            <div class="action-buttons">
              <BaseButton
                  type="primary"
                  size="sm"
                  :disabled="savingAction"
                  @click="submitAction"
              >
                {{ savingAction ? "저장중..." : "조치 이력 추가" }}
              </BaseButton>
            </div>
          </div>

          <div v-if="actionLoading" class="mini-state">조치 이력 불러오는 중...</div>
          <div v-else-if="actionError" class="mini-state mini-state--error">{{ actionError }}</div>

          <div v-else class="action-list">
            <div v-if="actions.length === 0" class="empty">조치 이력이 없습니다.</div>

            <div v-for="a in actions" :key="a.incidentActionHistoryCode" class="action-item">
              <div class="meta">
                <span class="dt mono">{{ fmt(a.createdAt) }}</span>
                <span class="writer">
                  {{
                    a.writerEmployeeName
                        ? a.writerEmployeeName
                        : (a.writerLoginId || a.writerEmployeeCode || "-")
                  }}
                </span>
              </div>
              <pre class="action-content">{{ a.actionContent }}</pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import BaseModal from "@/components/common/modal/BaseModal.vue";
import BaseButton from "@/components/common/button/BaseButton.vue";
import {
  getIncidentDetailApi,
  getIncidentActionsApi,
  createIncidentActionApi,
  closeIncidentApi,
} from "@/api/voc/incidentApi.js";

const props = defineProps({
  incidentCode: { type: [Number, String], required: true },
});

const emit = defineEmits(["close", "updated"]);

const d = ref({});
const loading = ref(false);
const error = ref("");

const actions = ref([]);
const actionLoading = ref(false);
const actionError = ref("");
const actionContent = ref("");
const savingAction = ref(false);

const closing = ref(false);

const employeeLabel = computed(() => {
  const name = (d.value.employeeName ?? "").trim();
  const id = (d.value.employeeLoginId ?? "").trim();
  if (name && id) return `${name} (${id})`;
  if (name) return name;
  if (id) return id;
  return d.value.employeeCode ?? "-";
});

const incidentStatusUpper = computed(() => String(d.value?.incidentStatus ?? "").toUpperCase());
const isClosable = computed(() => incidentStatusUpper.value === "IN_PROGRESS");
const isActionWritable = computed(() => incidentStatusUpper.value !== "CLOSED");

const fmt = (iso) => {
  if (!iso) return "-";
  return String(iso).replace("T", " ").slice(0, 16);
};

const statusLabel = (v) => {
  const s = String(v ?? "").toUpperCase();
  if (s === "IN_PROGRESS") return "조치중";
  if (s === "CLOSED") return "종결";
  return v ?? "-";
};

const severityLabel = (v) => (v ? v : "-");

const statusBadgeClass = (v) => {
  const s = String(v ?? "").toUpperCase();
  if (s === "IN_PROGRESS") return "badge--in";
  if (s === "CLOSED") return "badge--done";
  return "badge--neutral";
};

const severityBadgeClass = (v) => {
  const s = String(v ?? "").toUpperCase();
  if (s === "LOW") return "badge--low";
  if (s === "MEDIUM") return "badge--mid";
  if (s === "HIGH") return "badge--high";
  if (s === "CRITICAL") return "badge--crit";
  return "badge--neutral";
};

const loadDetail = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await getIncidentDetailApi(props.incidentCode);
    d.value = res.data?.data ?? {};
  } catch (e) {
    error.value = e?.message || "상세 조회 실패";
  } finally {
    loading.value = false;
  }
};

const loadActions = async () => {
  actionLoading.value = true;
  actionError.value = "";
  try {
    const res = await getIncidentActionsApi(props.incidentCode);
    actions.value = res.data?.data ?? [];
  } catch (e) {
    actionError.value = e?.message || "조치 이력 조회 실패";
    actions.value = [];
  } finally {
    actionLoading.value = false;
  }
};

const submitAction = async () => {
  const content = (actionContent.value ?? "").trim();
  if (!content) return alert("조치내용을 입력하세요.");
  if (!isActionWritable.value) return;

  savingAction.value = true;
  try {
    await createIncidentActionApi(props.incidentCode, { actionContent: content });
    actionContent.value = "";
    await loadActions();
    emit("updated");
  } catch (e) {
    console.error(e);
    alert("조치 추가에 실패했습니다.");
  } finally {
    savingAction.value = false;
  }
};

const closeIncident = async () => {
  if (!isClosable.value) return;
  if (!confirm("조치를 완료(종결) 처리할까요?")) return;

  closing.value = true;
  try {
    await closeIncidentApi(props.incidentCode);
    await loadDetail();
    await loadActions();
    emit("updated");
  } catch (e) {
    console.error(e);
    alert("종결 처리에 실패했습니다.");
  } finally {
    closing.value = false;
  }
};

const loadAll = async () => {
  await loadDetail();
  await loadActions();
};

watch(() => props.incidentCode, loadAll, { immediate: true });
</script>

<style scoped>
.modal {
  --bg: #ffffff;
  --line: #e7edf4;
  --text: #111827;
  --muted: #6b7280;
  --r: 14px;
  --pad: 16px;

  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--text);
}

.body {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 6px;
}

.state {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--r);
  background: var(--bg);
  text-align: center;
  color: #374151;
  font-size: 14px;
}

.state--error {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fff5f5;
}

.card {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--r);
  padding: var(--pad);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.card-title {
  font-weight: 800;
  font-size: 15px;
  letter-spacing: -0.2px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 22px;
}

@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr; }
  .span2 { grid-column: auto; }
}

.row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 14px;
  line-height: 1.45;
}

.span2 { grid-column: 1 / -1; }

.k {
  width: 90px;
  font-weight: 800;
  color: #374151;
  flex: 0 0 auto;
}

.v {
  color: var(--text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mono {
  font-variant-numeric: tabular-nums;
}

.panel {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px 14px;
  background: #fafbfc;
}

.content {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.6;
  font-size: 14px;
  color: #111827;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #374151;
}

.badge--in {
  border-color: #dbeafe;
  background: #eff6ff;
  color: #1d4ed8;
}

.badge--done {
  border-color: #dcfce7;
  background: #f0fdf4;
  color: #15803d;
}

.badge--neutral {
  border-color: #e5e7eb;
  background: #f9fafb;
  color: #374151;
}

.badge--low {
  border-color: #dcfce7;
  background: #f0fdf4;
  color: #15803d;
}

.badge--mid {
  border-color: #dbeafe;
  background: #eff6ff;
  color: #1d4ed8;
}

.badge--high {
  border-color: #ffe4c7;
  background: #fff7ed;
  color: #c2410c;
}

.badge--crit {
  border-color: #fecaca;
  background: #fff5f5;
  color: #b91c1c;
}

.action-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-form textarea {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  font-size: 14px;
  resize: vertical;
  outline: none;
}

.action-form textarea:focus {
  border-color: #cfe3ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
}

.mini-state {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  text-align: center;
  color: #374151;
  background: var(--bg);
  font-size: 13px;
}

.mini-state--error {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fff5f5;
}

.action-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty {
  padding: 12px;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  text-align: center;
  color: var(--muted);
  background: #fafbfc;
}

.action-item {
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 12px;
  background: #fafbfc;
}

.meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 8px;
}

.action-content {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.6;
  color: #111827;
  font-size: 14px;
}
</style>

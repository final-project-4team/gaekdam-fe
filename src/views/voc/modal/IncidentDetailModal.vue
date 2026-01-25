<template>
  <BaseModal title="사건/사고 상세" @close="$emit('close')">
    <div class="wrap">
      <div v-if="loading" class="state">불러오는 중...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>

      <div v-else class="scroll">
        <!-- 기본 정보 -->
        <div class="card">
          <div class="grid">
            <div class="row"><span class="k">사건번호</span><span class="v">C-{{ d.incidentCode }}</span></div>
            <div class="row"><span class="k">등록일시</span><span class="v">{{ fmt(d.createdAt) }}</span></div>

            <div class="row"><span class="k">지점</span><span class="v">{{ d.propertyCode ?? "-" }}</span></div>
            <div class="row"><span class="k">담당자</span><span class="v">{{ employeeLabel }}</span></div>

            <div class="row"><span class="k">상태</span><span class="v">{{ d.incidentStatus ?? "-" }}</span></div>
            <div class="row"><span class="k">심각도</span><span class="v">{{ d.severity ?? "-" }}</span></div>

            <div class="row full"><span class="k">제목</span><span class="v">{{ d.incidentTitle ?? "-" }}</span></div>
            <div class="row full"><span class="k">요약</span><span class="v">{{ d.incidentSummary ?? "-" }}</span></div>
            <div class="row full"><span class="k">내용</span><pre class="pre">{{ d.incidentContent ?? "-" }}</pre></div>

            <div class="row full">
              <span class="k">연결 문의</span>
              <span class="v">{{ d.inquiryCode ? `Q-${d.inquiryCode}` : "-" }}</span>
            </div>
          </div>
        </div>

        <!--  조치 이력 -->
        <div class="card">
          <div class="card-head">
            <div class="card-title">조치 이력</div>
          </div>

          <!-- 조치 추가 -->
          <div class="action-form">
            <textarea
                v-model="actionContent"
                rows="3"
                placeholder="조치내용을 입력하세요 (필수)"
            />
            <div class="action-buttons">
              <BaseButton type="primary" size="sm" :disabled="savingAction" @click="submitAction">
                {{ savingAction ? "저장중..." : "조치 이력 추가" }}
              </BaseButton>
            </div>
          </div>

          <!-- 리스트 -->
          <div v-if="actionLoading" class="mini-state">조치 이력 불러오는 중...</div>
          <div v-else-if="actionError" class="mini-state error">{{ actionError }}</div>

          <div v-else class="action-list">
            <div v-if="actions.length === 0" class="empty">조치 이력이 없습니다.</div>

            <div v-for="a in actions" :key="a.incidentActionHistoryCode" class="action-item">
              <div class="meta">
                <span class="dt">{{ fmt(a.createdAt) }}</span>
                <span class="writer">
                  {{ a.writerEmployeeName ? a.writerEmployeeName : (a.writerLoginId || a.writerEmployeeCode || "-") }}
                </span>
              </div>
              <pre class="content">{{ a.actionContent }}</pre>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <BaseButton type="ghost" size="md" @click="$emit('close')">확인</BaseButton>
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
} from "@/api/voc/incidentApi";

const props = defineProps({
  incidentCode: { type: [Number, String], required: true },
});

defineEmits(["close", "updated"]);

const d = ref({});
const loading = ref(false);
const error = ref("");

/* actions */
const actions = ref([]);
const actionLoading = ref(false);
const actionError = ref("");
const actionContent = ref("");
const savingAction = ref(false);

const employeeLabel = computed(() => {
  const name = (d.value.employeeName ?? "").trim();
  const id = (d.value.employeeLoginId ?? "").trim();
  if (name && id) return `${name} (${id})`;
  if (name) return name;
  if (id) return id;
  return d.value.employeeCode ?? "-";
});

const fmt = (iso) => {
  if (!iso) return "-";
  return String(iso).replace("T", " ").slice(0, 16);
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
    // ApiResponse 형태 가정: res.data.data = list
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

  savingAction.value = true;
  try {
    await createIncidentActionApi(props.incidentCode, { actionContent: content });
    actionContent.value = "";
    await loadActions(); // 저장 후 리스트 리로드
  } catch (e) {
    console.error(e);
    alert("조치 추가에 실패했습니다.");
  } finally {
    savingAction.value = false;
  }
};

const loadAll = async () => {
  await loadDetail();
  await loadActions();
};

watch(() => props.incidentCode, loadAll, { immediate: true });
</script>

<style scoped>
.wrap { display: flex; flex-direction: column; gap: 12px; }
.scroll { max-height: 70vh; overflow-y: auto; padding-right: 6px; }

.state { padding: 14px; border: 1px solid #e7edf4; border-radius: 12px; text-align: center; }
.state.error { color: #b91c1c; border-color: #fecaca; background: #fff5f5; }

.card { background: #fff; border: 1px solid #e7edf4; border-radius: 14px; padding: 16px; box-shadow: 0 1px 6px rgba(0,0,0,0.05); margin-bottom: 12px; }
.card-head { display:flex; justify-content: center; margin-bottom: 10px; }
.card-title { text-align: center; font-weight: 800; }

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 22px; }
.row { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; }
.row.full { grid-column: 1 / -1; }
.k { width: 90px; font-weight: 800; color: #374151; }
.v { color: #111827; }
.pre { margin: 0; white-space: pre-wrap; line-height: 1.55; padding: 10px 12px; border: 1px solid #e7edf4; border-radius: 12px; background: #fafbfc; flex: 1; }

.action-form { display:flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.action-form textarea { padding: 10px 12px; border-radius: 10px; border: 1px solid #e5e7eb; font-size: 14px; resize: vertical; }
.action-buttons { display:flex; justify-content: flex-end; }

.mini-state { padding: 10px 12px; border: 1px solid #e7edf4; border-radius: 12px; text-align: center; margin-top: 10px; }
.mini-state.error { color: #b91c1c; border-color: #fecaca; background: #fff5f5; }

.action-list { margin-top: 12px; display:flex; flex-direction: column; gap: 10px; }
.empty { padding: 12px; border: 1px dashed #e5e7eb; border-radius: 12px; text-align:center; color:#6b7280; background:#fafbfc; }
.action-item { border: 1px solid #e7edf4; border-radius: 12px; padding: 12px; background: #fafbfc; }
.meta { display:flex; justify-content: space-between; font-size: 12px; color:#6b7280; margin-bottom: 8px; }
.content { margin:0; white-space: pre-wrap; line-height: 1.55; color:#111827; }

.footer { display: flex; justify-content: center; padding-top: 4px; }
</style>

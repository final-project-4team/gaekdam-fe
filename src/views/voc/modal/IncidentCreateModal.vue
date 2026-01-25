<template>
  <BaseModal title="사건/사고 등록" @close="$emit('close')">
    <div class="body">
      <div class="grid">
        <!-- ✅ 지점: 자동 세팅(권장) -->
        <div class="row">
          <label>지점</label>
          <input :value="propertyLabel" readonly />
        </div>

        <!-- ✅ 담당자: 직원 검색(이름/아이디)로 선택 -->
        <div class="row">
          <label>담당자</label>
          <div class="inline">
            <input :value="employeeLabel" readonly placeholder="직원을 선택하세요" />
            <BaseButton type="ghost" size="sm" @click="showEmployeeModal=true">직원 선택</BaseButton>
            <BaseButton v-if="form.employeeCode" type="danger" size="sm" @click="clearEmployee">해제</BaseButton>
          </div>
        </div>

        <div class="row full">
          <label>제목</label>
          <input v-model="form.incidentTitle" placeholder="사건/사고 제목" />
        </div>

        <div class="row full">
          <label>요약</label>
          <input v-model="form.incidentSummary" placeholder="(선택) 한 줄 요약" />
        </div>

        <div class="row">
          <label>유형</label>
          <select v-model="form.incidentType">
            <option value="FACILITY">시설</option>
            <option value="PAYMENT">결제</option>
            <option value="CUSTOMER">고객</option>
            <option value="EMPLOYEE">직원</option>
            <option value="ETC">기타</option>
          </select>
        </div>

        <div class="row">
          <label>심각도</label>
          <select v-model="form.severity">
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        <div class="row">
          <label>발생일시</label>
          <input type="datetime-local" v-model="form.occurredAt" />
        </div>

        <div class="row full">
          <label>내용</label>
          <textarea v-model="form.incidentContent" rows="8" placeholder="상세 내용을 입력하세요." />
        </div>

        <!-- ✅ 문의 연결(선택) -->
        <div class="row full">
          <label>문의 연결(선택)</label>

          <div class="inline">
            <input :value="linkedInquiryText" readonly placeholder="연결된 문의 없음" />
            <BaseButton type="ghost" size="sm" @click="showInquiryModal=true">문의 선택</BaseButton>
            <BaseButton v-if="form.inquiryCode" type="danger" size="sm" @click="clearInquiry">해제</BaseButton>
          </div>
        </div>
      </div>

      <div class="actions">
        <BaseButton type="ghost" size="sm" @click="$emit('close')">취소</BaseButton>
        <BaseButton type="primary" size="sm" :disabled="saving" @click="submit">
          {{ saving ? "등록중..." : "등록" }}
        </BaseButton>
      </div>
    </div>

    <EmployeeSelectModal
        v-if="showEmployeeModal"
        @close="showEmployeeModal=false"
        @select="onSelectEmployee"
    />

    <InquirySelectModal
        v-if="showInquiryModal"
        @close="showInquiryModal=false"
        @select="onSelectInquiry"
    />
  </BaseModal>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";

import BaseModal from "@/components/common/modal/BaseModal.vue";
import BaseButton from "@/components/common/button/BaseButton.vue";

import EmployeeSelectModal from "./EmployeeSelectModal.vue";
import InquirySelectModal from "./InquirySelectModal.vue";

import { createIncidentApi } from "@/api/voc/incidentApi";

const emit = defineEmits(["close", "created"]);
const authStore = useAuthStore();

const showEmployeeModal = ref(false);
const showInquiryModal = ref(false);
const saving = ref(false);

const form = reactive({
  propertyCode: null,
  employeeCode: null,
  employeeName: "",
  employeeLoginId: "",

  incidentTitle: "",
  incidentSummary: "",
  incidentContent: "",
  incidentType: "FACILITY",
  severity: "MEDIUM",
  occurredAt: "",
  inquiryCode: null,
});

const resolvePropertyCode = () => {
  return (
      authStore.propertyCode ??
      authStore.hotel?.propertyCode ??
      authStore.user?.propertyCode ??
      null
  );
};

onMounted(() => {
  form.propertyCode = resolvePropertyCode();
});

const propertyLabel = computed(() => {
  return form.propertyCode ? String(form.propertyCode) : "-";
});

const employeeLabel = computed(() => {
  if (!form.employeeCode) return "";
  const n = (form.employeeName || "").trim();
  const id = (form.employeeLoginId || "").trim();
  if (n && id) return `${n} (${id})`;
  if (n) return n;
  if (id) return id;
  return `#${form.employeeCode}`;
});

const linkedInquiryText = computed(() =>
    form.inquiryCode ? `Q-${form.inquiryCode}` : ""
);

const onSelectEmployee = (e) => {
  form.employeeCode = e?.employeeCode ?? null;
  form.employeeName = e?.employeeName ?? "";
  form.employeeLoginId = e?.loginId ?? "";
  showEmployeeModal.value = false;
};

const clearEmployee = () => {
  form.employeeCode = null;
  form.employeeName = "";
  form.employeeLoginId = "";
};

const onSelectInquiry = (q) => {
  form.inquiryCode = q?.inquiryCode ?? null;
  showInquiryModal.value = false;
};

const clearInquiry = () => {
  form.inquiryCode = null;
};

const submit = async () => {
  if (!form.propertyCode) return alert("지점 정보가 없습니다. 로그인 정보를 확인하세요.");
  if (!form.employeeCode) return alert("담당자를 선택하세요.");
  if (!form.incidentTitle.trim()) return alert("제목을 입력하세요.");
  if (!form.incidentContent.trim()) return alert("내용을 입력하세요.");

  saving.value = true;
  try {
    const payload = {
      propertyCode: form.propertyCode,
      employeeCode: form.employeeCode,
      incidentTitle: form.incidentTitle.trim(),
      incidentSummary: form.incidentSummary?.trim() || null,
      incidentContent: form.incidentContent.trim(),
      incidentType: form.incidentType,
      severity: form.severity,
      occurredAt: form.occurredAt ? new Date(form.occurredAt).toISOString() : null,
      inquiryCode: form.inquiryCode ?? null,
    };

    const res = await createIncidentApi(payload);
    const incidentCode = res.data?.data?.incidentCode;

    emit("created", incidentCode);
  } catch (e) {
    console.error(e);
    alert("등록에 실패했습니다.");
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.body { display: flex; flex-direction: column; gap: 14px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.row { display: flex; flex-direction: column; gap: 6px; }
.row.full { grid-column: 1 / -1; }
label { font-size: 13px; font-weight: 800; color: #374151; }

input, select, textarea {
  padding: 9px 10px; border-radius: 10px; border: 1px solid #e5e7eb; font-size: 14px;
}
input[readonly] { background: #f9fafb; }

.inline { display: flex; gap: 8px; align-items: center; }
.inline input { flex: 1; }

.actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
</style>

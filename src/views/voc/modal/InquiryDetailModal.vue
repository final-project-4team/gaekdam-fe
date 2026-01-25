<template>
  <BaseModal title="문의 상세" @close="$emit('close')">
    <div class="inquiry-modal">
      <div v-if="loading" class="state">불러오는 중...</div>
      <div v-else-if="error" class="state error">{{ error }}</div>

      <div v-else class="scroll">
        <!-- 기본정보 -->
        <div class="card">
          <div class="card-title">기본정보</div>

          <div class="grid">
            <div class="row"><span class="k">문의번호</span><span class="v">{{ detail?.inquiryCode ?? "-" }}</span></div>
            <div class="row"><span class="k">고객명</span><span class="v">{{ detail?.customerName ?? "-" }}</span></div>

            <div class="row"><span class="k">접수일시</span><span class="v">{{ fmt(detail?.createdAt) }}</span></div>
            <div class="row"><span class="k">연락처</span><span class="v">-</span></div>

            <div class="row"><span class="k">문의유형</span><span class="v">{{ detail?.inquiryCategoryName ?? "-" }}</span></div>
            <div class="row"><span class="k">처리상태</span>
              <span class="v">
                <span class="badge" :class="badgeClass(detail?.inquiryStatus)">
                  {{ statusLabel(detail?.inquiryStatus) }}
                </span>
              </span>
            </div>

            <!-- 담당자 표시: 담당자명 / 담당자ID -->
            <div class="row"><span class="k">담당자명</span><span class="v">{{ employeeNameLabel }}</span></div>
            <div class="row"><span class="k">담당자ID</span><span class="v">{{ employeeLoginIdLabel }}</span></div>

            <!-- 상세에서만 있을 때 표시 -->
            <div v-if="detail?.linkedIncidentCode" class="row">
              <span class="k">연결된 사건</span>
              <span class="v link">{{ detail.linkedIncidentCode }}</span>
            </div>
          </div>
        </div>

        <!-- 문의내용 -->
        <div class="card">
          <div class="card-title">문의내용</div>
          <div class="box">
            <div class="headline">{{ detail?.inquiryTitle ?? "-" }}</div>
            <pre class="content">{{ detail?.inquiryContent ?? "-" }}</pre>
          </div>
        </div>

        <!-- 답변(처리)내용 -->
        <div class="card">
          <div class="card-title">답변(처리)내용</div>
          <div class="box">
            <pre class="content">{{ detail?.answerContent ?? "답변이 없습니다." }}</pre>
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
import { ref, watch, computed } from "vue";
import BaseModal from "@/components/common/modal/BaseModal.vue";
import BaseButton from "@/components/common/button/BaseButton.vue";
import { getInquiryDetailApi } from "@/api/voc/inquiryApi";

const props = defineProps({
  inquiryCode: { type: [Number, String], required: true },
});

defineEmits(["close"]);

const detail = ref(null);
const loading = ref(false);
const error = ref("");

const statusLabel = (v) => {
  if (v === "IN_PROGRESS") return "접수";
  if (v === "ANSWERED") return "답변완료";
  return v ?? "-";
};

const badgeClass = (v) => {
  if (v === "IN_PROGRESS") return "badge--in";
  if (v === "ANSWERED") return "badge--done";
  return "";
};

const fmt = (iso) => {
  if (!iso) return "-";
  return String(iso).replace("T", " ").slice(0, 16);
};

const employeeNameLabel = computed(() => {
  const name = (detail.value?.employeeName ?? "").trim();
  return name ? name : "미지정";
});

const employeeLoginIdLabel = computed(() => {
  const id = (detail.value?.employeeLoginId ?? "").trim();
  return id ? id : "-";
});

const fetchDetail = async () => {
  loading.value = true;
  error.value = "";
  detail.value = null;

  try {
    const res = await getInquiryDetailApi(props.inquiryCode);
    detail.value = res?.data?.data ?? null;
  } catch (e) {
    error.value = e?.message || "상세 조회에 실패했습니다.";
  } finally {
    loading.value = false;
  }
};

watch(
    () => props.inquiryCode,
    () => fetchDetail(),
    { immediate: true }
);
</script>

<style scoped>
.inquiry-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scroll {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 6px;
}

.state {
  padding: 14px;
  border: 1px solid #e7edf4;
  border-radius: 12px;
  background: #fff;
  text-align: center;
  color: #374151;
}

.state.error {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fff5f5;
}

.card {
  background: #fff;
  border: 1px solid #e7edf4;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  margin-bottom: 12px;
}

.card-title {
  text-align: center;
  font-weight: 800;
  margin-bottom: 10px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 22px;
}

.row {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 14px;
}

.k {
  width: 90px;
  font-weight: 800;
  color: #374151;
}

.v {
  color: #111827;
}

.badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
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

.link {
  color: #1d4ed8;
  font-weight: 800;
}

.box {
  border: 1px solid #e7edf4;
  border-radius: 12px;
  padding: 12px 14px;
  background: #fafbfc;
}

.headline {
  text-align: center;
  font-weight: 800;
  margin-bottom: 10px;
}

.content {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.55;
}

.footer {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}
</style>

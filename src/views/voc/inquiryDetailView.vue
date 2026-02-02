<template>
  <section class="page">
    <div class="top">
      <button class="back" @click="router.back()">←</button>
      <div class="title-pill">문의 상세</div>
      <div class="spacer" />
    </div>

    <!-- 로딩/에러 -->
    <div v-if="loading" class="state">불러오는 중...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>

    <template v-else>
      <!-- 기본정보 -->
      <div class="card">
        <div class="card-title">기본정보</div>

        <div class="grid">
          <div class="row"><span class="k">문의번호</span><span class="v">{{ detail?.inquiryCode }}</span></div>
          <div class="row"><span class="k">고객명</span><span class="v">{{ detail?.customerName }}</span></div>

          <div class="row"><span class="k">접수일시</span><span class="v">{{ formatDateTime(detail?.createdAt) }}</span></div>
          <div class="row"><span class="k">연락처</span><span class="v">-</span></div>

          <div class="row"><span class="k">문의유형</span><span class="v">{{ detail?.inquiryCategoryName }}</span></div>
          <div class="row"><span class="k">담당자</span><span class="v">{{ detail?.employeeCode ?? "미지정" }}</span></div>

          <div class="row"><span class="k">처리상태</span><span class="v">{{ statusLabel(detail?.inquiryStatus) }}</span></div>
          <div class="row"><span class="k">참조사건</span><span class="v">{{ detail?.linkedIncidentCode ?? "-" }}</span></div>
        </div>
      </div>

      <!-- 문의내용 -->
      <div class="card">
        <div class="card-title">문의내용</div>
        <div class="content-box">
          <div class="content-title">{{ detail?.inquiryTitle }}</div>
          <pre class="content">{{ detail?.inquiryContent }}</pre>
        </div>
      </div>

      <!-- 답변(처리)내용 -->
      <div class="card">
        <div class="card-title">답변(처리)내용</div>
        <div class="content-box">
          <pre class="content">{{ detail?.answerContent ?? "답변이 없습니다." }}</pre>
        </div>
      </div>

      <div class="footer">
        <BaseButton type="ghost" size="md" @click="router.back()">확인</BaseButton>
      </div>
    </template>
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import BaseButton from "@/components/common/button/BaseButton.vue";
import { getInquiryDetailApi } from "@/api/voc/inquiryApi"; // ✅ 이걸로 호출해야 함

const route = useRoute();
const router = useRouter();

const detail = ref(null);
const loading = ref(false);
const error = ref("");

const statusLabel = (v) => {
  if (v === "IN_PROGRESS") return "처리중";
  if (v === "ANSWERED") return "답변완료";
  return v ?? "-";
};

const formatDateTime = (iso) => {
  if (!iso) return "-";
  return String(iso).replace("T", " ").slice(0, 16);
};

onMounted(async () => {
  loading.value = true;
  error.value = "";

  try {
    const inquiryCode = route.params.inquiryCode;
    const res = await getInquiryDetailApi(inquiryCode); // ✅ 함수 호출
    detail.value = res?.data?.data; // ✅ ApiResponse.success(data)의 data
  } catch (e) {
    error.value = e?.message || "상세 조회에 실패했습니다.";
    detail.value = null;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.top {
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
}

.back {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

.title-pill {
  justify-self: center;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 10px 18px;
  border-radius: 12px;
  font-weight: 700;
}

.spacer {
  width: 40px;
}

.state {
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 16px;
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
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.card-title {
  font-weight: 800;
  margin-bottom: 12px;
  text-align: center;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 24px;
}

.row {
  display: flex;
  gap: 10px;
  font-size: 14px;
}

.k {
  width: 90px;
  font-weight: 700;
  color: #374151;
}

.v {
  color: #111827;
}

.content-box {
  border: 1px solid #eef2f7;
  border-radius: 12px;
  padding: 14px;
  background: #fafafa;
}

.content-title {
  font-weight: 800;
  margin-bottom: 10px;
}

.content {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.5;
}

.footer {
  display: flex;
  justify-content: center;
}
</style>

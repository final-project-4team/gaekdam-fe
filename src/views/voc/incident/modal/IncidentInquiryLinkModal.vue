<!-- src/views/incident/modal/IncidentInquiryLinkModal.vue -->
<template>
  <BaseModal title="문의 선택" @close="$emit('close')">
    <div class="picker">
      <div class="search">
        <!-- 현재 미연동이므로 disabled 처리 (API 붙이면 disabled/remove 하면 됨) -->
        <input
            v-model="keyword"
            placeholder="문의번호/제목 검색 (준비중)"
            disabled
        />
        <div class="icon">🔎</div>
      </div>

      <!-- ✅ 지금은 문의 API 미연동: 입력값으로 선택 가능하게 -->
      <div class="empty">
        <div class="box">
          <div class="title">문의번호로 바로 연결</div>

          <div class="inline">
            <input
                v-model.number="manualInquiryCode"
                type="number"
                min="1"
                placeholder="문의번호 입력"
                @keyup.enter="pickManual"
            />
            <BaseButton
                type="primary"
                size="sm"
                @click="pickManual"
                :disabled="!isValidManualCode"
            >
              선택
            </BaseButton>
          </div>

          <p class="hint">※ 문의 조회 API 연결되면, 여기 결과 리스트로 선택하게 바뀝니다.</p>
        </div>
      </div>

      <div class="actions">
        <BaseButton type="ghost" size="md" @click="$emit('close')">닫기</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed, ref } from "vue";
import BaseModal from "@/components/common/modal/BaseModal.vue";
import BaseButton from "@/components/common/button/BaseButton.vue";

const emit = defineEmits(["close", "pick"]);

const keyword = ref(""); // API 붙일 때 사용
const manualInquiryCode = ref(null);

const isValidManualCode = computed(() => {
  const n = Number(manualInquiryCode.value);
  return Number.isInteger(n) && n > 0;
});

const pickManual = () => {
  if (!isValidManualCode.value) return;

  emit("pick", Number(manualInquiryCode.value));
  emit("close"); // 선택 후 닫기
};
</script>

<style scoped>
.picker {
  width: 520px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.search {
  position: relative;
}

.search input {
  width: 100%;
  padding: 12px 42px 12px 12px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

.search .icon {
  position: absolute;
  right: 12px;
  top: 10px;
  opacity: 0.6;
}

.empty {
  min-height: 320px;
  border-radius: 14px;
  border: 1px dashed #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}

.box {
  width: 100%;
  max-width: 420px;
  background: #f9fafb;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 16px;
}

.box .title {
  font-weight: 800;
  margin-bottom: 10px;
}

.inline {
  display: flex;
  gap: 10px;
}

.inline input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.actions {
  display: flex;
  justify-content: center;
}
</style>

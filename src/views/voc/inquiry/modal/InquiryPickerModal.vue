<!-- src/views/incident/modal/InquiryPickerModal.vue -->
<template>
  <BaseModal title="문의 선택" @close="$emit('close')">
    <div class="picker">
      <div class="search">
        <input v-model="keyword" placeholder="문의번호/제목으로 검색" />
        <div class="icon">🔎</div>
      </div>

      <!-- ✅ 지금은 문의 API 미연동: 입력값으로 선택 가능하게 -->
      <div class="empty">
        <div class="box">
          <div class="title">문의번호로 바로 연결</div>
          <div class="inline">
            <input v-model.number="manualInquiryCode" type="number" placeholder="문의번호 입력" />
            <BaseButton type="primary" size="sm" @click="pickManual" :disabled="!manualInquiryCode">
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
import { ref } from 'vue'
import BaseModal from '@/components/common/modal/BaseModal.vue'
import BaseButton from '@/components/common/button/BaseButton.vue'

const emit = defineEmits(['close', 'pick'])

const keyword = ref('')
const manualInquiryCode = ref(null)

const pickManual = () => {
  emit('pick', manualInquiryCode.value)
}
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
}

.search .icon {
  position: absolute;
  right: 12px;
  top: 10px;
  opacity: .6;
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

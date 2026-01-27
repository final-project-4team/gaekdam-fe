<template>
  <BaseModal title="메시지 템플릿" @close="$emit('close')">

    <!-- 컨텍스트 -->
    <div class="context">
      <strong>{{ stage.stageNameKor }}</strong>
      <span> · </span>
      <span>{{ visitorType === 'FIRST' ? '첫방문자' : '재방문자' }}</span>
    </div>

    <!-- 설정 -->
    <div class="setting-box">
      <label class="setting-item">
        <input type="checkbox" v-model="form.isActive" />
        <span>사용</span>
      </label>

      <div class="setting-item">
        <label>언어</label>
        <select v-model="form.languageCode">
          <option value="KOR">한국어</option>
          <option value="ENG">영어</option>
        </select>
      </div>
    </div>

    <!-- 제목 -->
    <div class="field">
      <label class="label">제목</label>
      <input
          type="text"
          v-model="form.title"
          class="input"
          placeholder="메시지 제목을 입력하세요"
      />
    </div>

    <!-- 내용 -->
    <div class="field">
      <label class="label">메시지 내용</label>
      <textarea
          v-model="form.content"
          class="textarea"
          rows="8"
          placeholder="실제로 고객에게 발송될 메시지 내용을 입력하세요"
      />
    </div>

    <!-- FOOTER -->
    <template #footer>
      <button class="btn ghost" @click="$emit('close')">
        취소
      </button>
      <button class="btn primary" @click="save">
        저장
      </button>
    </template>

  </BaseModal>
</template>


<script setup>
import { reactive, watch } from 'vue'
import {
  createMessageTemplateApi,
  updateMessageTemplateApi
} from '@/api/message/messageTemplateApi'

import BaseModal from '@/components/common/modal/BaseModal.vue'

const props = defineProps({
  mode: String,
  stage: Object,
  visitorType: String,
  template: Object,
})

const emit = defineEmits(['saved', 'close'])

const form = reactive({
  title: '',
  content: '',
  languageCode: 'KOR',
  isActive: true,
})

watch(
    () => props.template,
    (tpl) => {
      if (props.mode === 'edit' && tpl) {
        form.title = tpl.title ?? ''
        form.content = tpl.content ?? ''
        form.languageCode = tpl.languageCode ?? 'KOR'
        form.isActive = tpl.isActive
      } else {
        form.title = ''
        form.content = ''
        form.languageCode = 'KOR'
        form.isActive = true
      }
    },
    { immediate: true }
)

const save = async () => {
  if (props.mode === 'create') {
    await createMessageTemplateApi({
      stageCode: props.stage.stageCode,
      visitorType: props.visitorType,
      languageCode: form.languageCode,
      title: form.title,
      content: form.content,
      isActive: form.isActive,
    })
  } else {
    await updateMessageTemplateApi(props.template.templateCode, {
      title: form.title,
      content: form.content,
      languageCode: form.languageCode,
      isActive: form.isActive,
    })
  }

  emit('saved')
}
</script>


<style scoped>
.context {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.setting-box {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  align-items: center;
}

.setting-item {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.label {
  font-size: 13px;
  font-weight: 500;
}

.input,
.textarea {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 14px;
}

.textarea {
  resize: vertical;
}

.btn {
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.btn.primary {
  background: #3b82f6;
  color: white;
  border: none;
}

.btn.ghost {
  background: transparent;
  border: 1px solid #d1d5db;
}
</style>

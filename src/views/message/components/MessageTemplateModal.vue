<template>
  <BaseModal title="메세지 템플릿" @close="$emit('close')">

    <!-- BODY (default slot) -->
    <div class="context">
      <strong>{{ stage.stageNameKor }}</strong>
      <span> · </span>
      <span>{{ visitorType === 'FIRST' ? '첫방문자' : '재방문자' }}</span>
    </div>

    <div class="form">
      <BaseInput v-model="form.title" label="제목" />
      <BaseTextarea v-model="form.content" label="내용" />
    </div>

    <!-- FOOTER -->
    <template #footer>
      <BaseButton type="ghost" @click="$emit('close')">취소</BaseButton>
      <BaseButton type="primary" @click="save">저장</BaseButton>
    </template>

  </BaseModal>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { createMessageTemplateApi, updateMessageTemplateApi } from '@/api/message/messageTemplateApi'
import BaseModal from "@/components/common/modal/BaseModal.vue"
import BaseButton from "@/components/common/button/BaseButton.vue"

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
})

watch(
    () => props.template,
    (tpl) => {
      if (props.mode === 'edit' && tpl) {
        form.title = tpl.title
        form.content = tpl.content ?? ''
      } else {
        form.title = ''
        form.content = ''
      }
    },
    { immediate: true }
)

const save = async () => {
  if (props.mode === 'create') {
    await createMessageTemplateApi({
      stageCode: props.stage.stageCode,
      visitorType: props.visitorType,
      title: form.title,
      content: form.content,
      isActive: true,
    })
  } else {
    await updateMessageTemplateApi(props.template.templateCode, {
      title: form.title,
      content: form.content,
    })
  }

  emit('saved')
}
</script>

<style scoped>
.context {
  margin-bottom: 12px;
  font-size: 14px;
  color: #374151;
}
</style>

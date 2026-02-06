<template>
  <BaseModal :title="title" v-if="visible" @close="$emit('close')">
    <div class="create-layout-form">
      <div class="form-row">
        <label class="form-label">레이아웃 이름</label>
        <input v-model="name" placeholder="ex. 2026년 1월 레이아웃" />
      </div>

      <!-- 조회 권한 선택 제거: 생성되는 레이아웃은 기본적으로 본인만 볼 수 있도록 변경 -->

      <div class="form-row">
        <label class="form-label">내용</label>
        <textarea v-model="description" rows="5" placeholder="레이아웃에 대한 설명을 입력하세요"></textarea>
      </div>
    </div>

    <template #footer>
      <BaseButton @press="handleClose">취소</BaseButton>
      <BaseButton type="primary" @press="handleCreate" style="margin-left:8px">생성</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
/**
 * CreateLayoutModal.vue
 * - 목적: 새로운 레이아웃을 생성하기 위한 모달 컴포넌트 (presentation)
 * - props:
 *    - visible: Boolean - 모달 표시 여부
 *    - title: String - 모달 제목 (기본값: '레이아웃 추가')
 *    - initial: Object - 초기값(편집 시 사용 가능)
 * - emits:
 *    - create(payload): 생성 버튼 클릭 시 입력된 내용을 payload로 부모에게 전달
 *    - close(): 모달 닫기 요청 시 발생
 * - 비고:
 *    - 조회 권한 선택은 제거되어, 부모(ReportLayoutView)에서 생성 시 기본 조회 권한을 'PRIVATE'으로 강제합니다.
 */
import BaseButton from '@/components/common/button/BaseButton.vue'
import BaseModal from '@/components/common/modal/BaseModal.vue'
import { defineProps, ref, watch, defineEmits } from 'vue'

const props = defineProps({ visible: Boolean, title: { type: String, default: '레이아웃 추가' }, initial: Object })
const emit = defineEmits(['create', 'close'])

const name = ref(props.initial?.name || '')
const description = ref(props.initial?.description || '')

watch(() => props.initial, (v) => {
  name.value = v?.name || ''
  description.value = v?.description || ''
})

// When modal becomes visible, reset fields to show placeholders unless initial values provided
watch(() => props.visible, (visible) => {
  if (visible) {
    name.value = props.initial?.name || ''
    description.value = props.initial?.description || ''
  }
})

function handleClose(){
  emit('close')
  // clear inputs so next open shows placeholders
  name.value = ''
  description.value = ''
}

function handleCreate(){
  // visibilityScope는 부모에서 강제로 'PRIVATE'으로 설정하여
  // 생성된 레이아웃이 기본적으로 만든 사람만 볼 수 있도록 처리합니다.
  const payload = { name: name.value, description: description.value }
  emit('create', payload)
  // clear after emit so inputs don't persist
  name.value = ''
  description.value = ''
}
</script>

<style scoped>
.create-layout-form { display:flex; flex-direction:column; gap:12px; min-width:520px }
.form-row { display:flex; gap:12px; align-items:flex-start }
.form-label { width:110px; color:#374151; font-weight:600 }
.radio-group { display:flex; gap:12px; align-items:center }
.radio-group label { display:flex; gap:6px; align-items:center }
.create-layout-form input[type="text"], .create-layout-form textarea { flex:1; min-width:520px; padding:10px 12px; border:1px solid #e5e7eb; border-radius:6px; font-size:14px }
</style>

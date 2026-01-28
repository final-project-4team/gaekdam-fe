<template>
  <div
      class="template-card"
      :class="{ empty: !template }"
      @click="onClick"
  >
    <div class="visitor-label">
      {{ label }}
    </div>

    <div v-if="template" class="content">
      <div class="title">{{ template.title }}</div>
      <div class="status" :class="{ active: template.active }">
        {{ template.active ? '사용중' : '비활성' }}
      </div>
    </div>

    <div v-else class="empty-content">
      <span class="plus">+</span>
      <span class="text">템플릿 추가</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  stage: Object,
  visitorType: String,
  template: Object,
})

const emit = defineEmits(['create', 'edit'])

const label =
    props.visitorType === 'FIRST'
        ? '첫방문자'
        : '재방문자'

const onClick = () => {
  if (props.template) {
    emit('edit', {
      stage: props.stage,
      template: props.template,
      visitorType: props.visitorType,
    })
  } else {
    emit('create', {
      stage: props.stage,
      visitorType: props.visitorType,
    })
  }
}
</script>

<style scoped>
.template-card {
  width: 220px;
  height: 120px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.template-card:hover {
  border-color: #4f46e5;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.visitor-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.content .title {
  font-size: 14px;
  font-weight: 500;
  margin-top: 6px;
}

.status {
  font-size: 12px;
  margin-top: 6px;
  color: #9ca3af;
}

.status.active {
  color: #16a34a;
}

.empty {
  border: 1px dashed #c7cdd9;
  background: #fafafa;
}

.empty-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #9ca3af;
}

.plus {
  font-size: 28px;
  font-weight: 300;
}

.text {
  font-size: 12px;
}
</style>

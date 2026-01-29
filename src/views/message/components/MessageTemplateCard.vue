<!-- /src/views/message/components/MessageTemplateCard.vue -->
<template>
  <div
      class="card"
      :class="{ inactive: template && !template.active, disabled: !template }"
      @click="onClick"
      role="button"
  >
    <div class="top">
      <div class="badge" :class="visitorType === 'FIRST' ? 'first' : 'repeat'">
        {{ visitorType === 'FIRST' ? '첫방문자' : '재방문자' }}
      </div>

      <div v-if="template" class="chip" :class="{ on: template.active }">
        <span class="dot"></span>
        {{ template.active ? '사용중' : '비활성' }}
      </div>
      <div v-else class="chip off">
        <span class="dot"></span>
        없음
      </div>
    </div>

    <div class="body">
      <div class="title">
        {{ template?.title ?? '템플릿이 없습니다' }}
      </div>
      <div class="sub">
        {{ template?.languageCode ?? '-' }} · {{ template?.templateCode ? `#${template.templateCode}` : '' }}
      </div>
    </div>

    <div class="footer">
      <span class="hint">{{ template ? '클릭하여 수정' : '템플릿이 없어 수정할 수 없습니다' }}</span>
      <span class="arrow">→</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  stage: Object,
  visitorType: String,
  template: Object,
})

const emit = defineEmits(['edit'])

const onClick = () => {
  if (!props.template) return
  emit('edit', {
    stage: props.stage,
    template: props.template,
    visitorType: props.visitorType,
  })
}
</script>

<style scoped>
.card {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 12px 12px 10px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card:hover {
  transform: translateY(-1px);
  border-color: #c7d2fe;
  box-shadow: 0 10px 26px rgba(17, 24, 39, 0.08);
}

.card.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.card.disabled:hover {
  transform: none;
  box-shadow: none;
  border-color: #e5e7eb;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.badge {
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
}

.badge.first {
  background: rgba(79, 70, 229, 0.10);
  color: #4f46e5;
  border: 1px solid rgba(79, 70, 229, 0.20);
}

.badge.repeat {
  background: rgba(16, 185, 129, 0.10);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.20);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  background: #f9fafb;
}

.chip .dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #9ca3af;
}

.chip.on {
  color: #16a34a;
  background: rgba(22, 163, 74, 0.08);
  border-color: rgba(22, 163, 74, 0.20);
}

.chip.on .dot {
  background: #16a34a;
}

.chip.off {
  color: #9ca3af;
}

.body {
  margin-top: 12px;
}

.title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  line-height: 1.35;
  min-height: 38px;
}

.sub {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

.footer {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #6b7280;
}

.hint {
  font-size: 12px;
}

.arrow {
  font-size: 14px;
  color: #4f46e5;
}

.card.inactive .arrow {
  color: #9ca3af;
}
</style>

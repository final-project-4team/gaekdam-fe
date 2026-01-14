<template>
  <Teleport to="body">
    <div class="overlay" @click.self="close">
      <div class="modal">
        <!-- header -->
        <div class="modal-header">
          <span class="title">{{ title }}</span>
          <button class="close" @click="close" aria-label="close">✕</button>
        </div>

        <!-- body -->
        <div class="modal-body">
          <slot />
        </div>

        <!-- footer -->
        <div class="modal-footer">
          <slot name="footer">
            <BaseButton type="secondary" @click="close">
              닫기
            </BaseButton>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import BaseButton from '@/components/common/button/BaseButton.vue'

defineProps({
  title: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])
const close = () => emit('close')
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 480px;
  background: white;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eef2f7;
}

.title {
  font-weight: 600;
  font-size: 15px;
}

.close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 16px;
}

.modal-footer {
  padding: 12px 16px;
  border-top: 1px solid #eef2f7;
  text-align: right;
}
</style>

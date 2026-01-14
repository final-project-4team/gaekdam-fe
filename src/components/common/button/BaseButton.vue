<template>
  <button
      class="btn"
      :class="type"
      @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'default', // primary | danger
  },
})
</script>

<style scoped>
.btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid #d1d5db;
  background: #fff;
}

.btn:hover {
  background: #f4f7fb;
}

.btn.primary {
  background: #1d4ed8;
  border-color: #1d4ed8;
  color: white;
}

.btn.primary:hover {
  background: #1742b4;
}

.btn.danger {
  background: #dc2626;
  border-color: #dc2626;
  color: white;
}
</style>

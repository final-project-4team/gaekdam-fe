<template>
  <div v-if="visible" class="loading-backdrop">
    <div class="donut" />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useLoadingStore } from '@/stores/loading'

const { visible } = storeToRefs(useLoadingStore())
</script>

<style scoped>
.loading-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;

  background: rgba(240, 242, 245, 0.32);
  backdrop-filter: blur(4px);

  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===============================
   Seamless Hollow Donut
   =============================== */
.donut {
  width: 36px;
  height: 36px;
  border-radius: 50%;

  /* base ring */
  border: 2.5px solid rgba(120,130,150,0.22);

  /* gradient illusion */
  border-top-color: rgba(113, 125, 186, 0.75);


  background: transparent;
  box-shadow: none;

  animation: spin 1.25s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (prefers-color-scheme: dark) {
  .loading-backdrop {
    background: rgba(20, 22, 26, 0.45);
  }
  .donut {
    border-color: rgba(255,255,255,0.25);
    border-top-color: #aab2ff;
  }
}
</style>

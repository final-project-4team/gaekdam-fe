<template>
  <div class="paging">
    <span @click="$emit('prev')">이전</span>

    <span
        v-for="p in pages"
        :key="p"
        :class="{ active: p === current }"
        @click="$emit('change', p)"
    >
      {{ p }}
    </span>

    <span @click="$emit('next')">다음</span>
  </div>
</template>

<script setup>
defineProps({
  current: Number,
  pages: Array,
})
</script>

<style scoped>
.paging {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
}

span {
  cursor: pointer;
  font-size: 13px;
}

.active {
  color: #1d4ed8;
  font-weight: 600;
}
</style>

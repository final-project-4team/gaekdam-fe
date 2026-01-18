<template>
  <div class="summary-row">
    <div
        v-for="card in cards"
        :key="card.type"
        class="summary-card"
        :class="{ active: active === card.type }"
        @click="$emit('select', card.type)"
    >
      <div class="label">{{ card.label }}</div>
      <div class="value">{{ card.value }}</div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue'
import {getTodayReservationSummaryApi} from "@/api/reservation/index.js";

const props = defineProps({
  summary: { type: Object, required: true },
  active: { type: String, default: '' },
})

const summary = ref({
  totalCount: 0,
  todayCheckInCount: 0,
  todayCheckOutCount: 0,
  stayingRoomCount: 0,
})

const loadSummary = async () => {
  const res = await getTodayReservationSummaryApi()
  const data = res.data.data

  summary.value = {
    totalCount: data.totalCount,
    todayCheckInCount: data.todayCheckInCount,
    todayCheckOutCount: data.todayCheckOutCount,
    stayingRoomCount: data.stayingRoomCount,
  }
}

defineEmits(['select'])

const cards = computed(() => [
  { type: 'ALL_TODAY', label: '전체', value: props.summary.totalCount },
  { type: 'TODAY_CHECKIN', label: '체크인 예정', value: props.summary.todayCheckInCount },
  { type: 'TODAY_CHECKOUT', label: '체크아웃 예정', value: props.summary.todayCheckOutCount },
  { type: 'STAYING', label: '현재 투숙', value: props.summary.stayingRoomCount },
])
</script>

<style scoped>
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.summary-card {
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  cursor: pointer;
  transition: all .2s ease;
}

.summary-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,.08);
}

.summary-card.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.label {
  font-size: 13px;
  color: #6b7280;
}

.value {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}
</style>

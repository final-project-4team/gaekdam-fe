<template>
  <div>
    <!-- KPI 카드 1행 -->
    <div class="template-grid kpi-row">
      <KpiCard v-for="w in kpiWidgets" :key="w.templateWidgetId" :widget="w" />
    </div>

    <!-- 차트 영역 -->
    <div class="template-grid chart-grid">
      <TimeSeriesChart v-for="w in chartWidgets" :key="w.templateWidgetId" :widget="w" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import KpiCard from './KpiCard.vue'
import TimeSeriesChart from './TimeSeriesChart.vue'

// 방어적으로 props 정의: widgets가 없으면 빈 배열을 사용
const props = defineProps({ widgets: { type: Array, default: () => [] } })

// 정렬된 위젯 배열 (sortOrder 기반)
const sorted = computed(() => (props.widgets || []).slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)))

// widgetType이 명시되어 있으면 그에 따라 분리, 없으면 앞 4개를 KPI로 판단
const kpiWidgets = computed(() => {
  const list = sorted.value
  if (!list || list.length === 0) return []
  const hasTypes = list.some(w => w.widgetType)
  if (hasTypes) return list.filter(w => (w.widgetType || '').toString().toUpperCase() === 'KPI_CARD')
  return list.slice(0, 4)
})

const chartWidgets = computed(() => {
  const list = sorted.value
  if (!list || list.length === 0) return []
  const hasTypes = list.some(w => w.widgetType)
  if (hasTypes) return list.filter(w => (w.widgetType || '').toString().toUpperCase() === 'TIME_SERIES')
  return list.slice(4)
})
</script>
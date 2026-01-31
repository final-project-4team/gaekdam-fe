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
  if (hasTypes) {
    // 변경: 서버에서 widgetType을 명확히 보내지 않는 경우도 있어, series가 있는(시계열 데이터) 위젯은 KPI에서 제외
    return list.filter(w => {
      const t = (w.widgetType || '').toString().toUpperCase()
      const hasSeries = Array.isArray(w.series) && w.series.length > 0
      // KPI로 간주하려면 명시적으로 KPI_CARD여야 하고 시계열 데이터가 없어야 함
      return t === 'KPI_CARD' && !hasSeries
    })
  }
  // widgetType이 전혀 없을 때: 기본적으로 앞 4개를 KPI로 보되, series가 있는 위젯은 건너뜀
  return list.filter((w, idx) => idx < 4 && !(Array.isArray(w.series) && w.series.length > 0))
})

const chartWidgets = computed(() => {
  const list = sorted.value
  if (!list || list.length === 0) return []
  const hasTypes = list.some(w => w.widgetType)
  if (hasTypes) {
    // 변경: 'TIME_SERIES' 또는 'LINE' 외에도 서버가 series 필드를 포함해 보내는 경우 이를 차트로 처리
    return list.filter(w => {
      const t = (w.widgetType || '').toString().toUpperCase()
      const hasSeries = Array.isArray(w.series) && w.series.length > 0
      return t === 'TIME_SERIES' || t === 'LINE' || hasSeries
    })
  }
  // widgetType이 없을 때: 기본적으로 5번째 이후를 차트로 보되, series가 있는 위젯은 포함
  return list.slice(4).concat(list.filter(w => Array.isArray(w.series) && w.series.length > 0))
})
</script>
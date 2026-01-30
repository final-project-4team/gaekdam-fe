<template>
  <div class="card">
    <div class="card-title">{{ widget.title }} <span v-if="pickUnitText(widget)">({{ pickUnitText(widget) }})</span></div>
    <!-- Chart.js는 canvas에 렌더링됩니다 -->
    <canvas ref="chartEl" style="height:220px; width:100%"></canvas>
  </div>
</template>

<script setup>
/*
  TimeSeriesChart.vue (Chart.js 버전 개선)
  - 목적: 템플릿 내 시계열 차트를 Chart.js로 렌더링합니다.
  - 이번 변경사항 요약:
    1) 툴팁과 Y축 눈금에 대해 KPI 유형에 맞춘 포맷터(통화, 퍼센트, 건수)를 적용합니다.
    2) widget.widgetKey 또는 title을 기반으로 적절한 포맷터를 선택하여 툴팁/축/레이블에 반영합니다.
    3) 데이터 정규화(normalize) 과정에서 숫자 변환(safeNumber)을 수행하여 차트에 숫자 배열이 들어가도록 보장합니다.
    4) 차트 색상 기본 맵을 제공하여 KPI별 시각적 구분을 쉽게 합니다.
    5) 컴포넌트 내에 상세 한국어 주석을 추가하여 유지보수성을 높였습니다.

  - 설치 필요: 프로젝트에 chart.js 설치 필요 (`npm i chart.js`).
*/

import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Chart, registerables } from 'chart.js'
import { formatCurrency, formatPercent, formatCount, safeNumber } from '@/utils/formatters'
Chart.register(...registerables)

const props = defineProps({ widget: { type: Object, required: true }, period: { type: String, default: null }})
const chartEl = ref(null)
let chartInstance = null

/*
  normalizeWidget:
  - widget에서 labels와 series를 안전하게 추출
  - series가 객체 배열인 경우 첫번째 시리즈의 data를 사용
  - rawData(원시값)과 numericData(차트에 사용할 숫자) 둘 다 반환
*/
function normalizeWidget(widget){
  // 우선 백엔드에서 labels가 제공되면 사용
  let labels = Array.isArray(widget?.labels) ? widget.labels : []
  const seriesArr = Array.isArray(widget?.series) ? widget.series : []
  const rawData = (seriesArr.length > 0 && Array.isArray(seriesArr[0].data)) ? seriesArr[0].data : []
  // 숫자 변환: API에서 문자열('1,234.00') 등으로 올 수 있으므로 safeNumber로 정규화
  const numericData = rawData.map(d => safeNumber(d))

  // 레이블이 없고 period가 연도(YYYY) 형태면 월 레이블(1월..12월)을 자동 생성
  if ((!labels || labels.length === 0) && props.period && /^\d{4}$/.test(props.period)){
    labels = Array.from({ length: 12 }, (_, i) => `${i+1}월`)
    // 데이터가 없으면 월별 값이 아직 없음을 명확히 하기 위해 null 배열(Chart.js는 null을 gap으로 렌더링)
    if (!numericData || numericData.length === 0) {
      // 월 12개에 대응하는 null 값 생성
      const nulls = Array.from({ length: 12 }, () => null)
      return { labels, rawData: nulls, numericData: nulls }
    }
  }

  return { labels, rawData, numericData }
}

/*
  selectFormatter:
  - widgetKey 또는 title을 분석해 적절한 포맷터 반환
  - ADR/PRICE 계열은 통화, RATE/OCCUPANCY 계열은 퍼센트, 그 외는 건수 포맷
*/
function selectFormatter(widget){
  const k = (widget?.widgetKey || '').toString().toUpperCase()
  const t = (widget?.title || '').toString()
  if (k.includes('ADR') || k.includes('PRICE')) return formatCurrency
  if (k.includes('RATE') || k.includes('OCCUPANCY') || t.includes('%')) return formatPercent
  return formatCount
}

/*
  colorMap: KPI별 기본 선 색상 매핑
  - 필요시 프로젝트 디자인 가이드에 따라 색상을 조정하세요.
*/
const colorMap = {
  CHECKIN: '#06b6d4', // cyan
  CHECKOUT: '#3b82f6', // blue
  ADR: '#f97316', // orange
  OCCUPANCY: '#ef4444', // red
}

function pickColor(widget){
  const k = (widget?.widgetKey || '').toString().toUpperCase()
  if (k.includes('CHECKIN')) return colorMap.CHECKIN
  if (k.includes('CHECKOUT')) return colorMap.CHECKOUT
  if (k.includes('ADR') || k.includes('PRICE')) return colorMap.ADR
  if (k.includes('OCCUPANCY') || k.includes('RATE')) return colorMap.OCCUPANCY
  return '#3b82f6' // 기본 파랑
}

// 단위 텍스트 결정: 툴팁/타이틀 옆에 표시할 단위(예: '회', '원', '%')
function pickUnitText(widget){
  const k = (widget?.widgetKey || '').toString().toUpperCase()
  if (k.includes('ADR') || k.includes('PRICE')) return '원'
  if (k.includes('RATE') || k.includes('OCCUPANCY') || (widget?.title || '').includes('%')) return '%'
  return '회'
}

function buildConfig(widget){
  const { labels, rawData, numericData } = normalizeWidget(widget)
  const formatter = selectFormatter(widget)
  const color = pickColor(widget)
  const unitText = pickUnitText(widget)

  return {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: widget?.title || '',
          data: numericData, // Chart.js는 숫자 배열을 기대
          fill: false,
          borderColor: color,
          backgroundColor: color,
          tension: 0.35,
          pointRadius: 0,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            // 툴팁 라벨: raw 값이 있으면 원시값을 포맷하고, 없으면 numeric value를 포맷
            label: function(context){
              const idx = context.dataIndex
              const raw = (Array.isArray(rawData) && rawData.length > idx) ? rawData[idx] : context.raw
              try{ return formatter(raw) }catch(e){ return String(raw) }
            }
          }
        }
      },
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { display: true },
        y: {
          display: true,
          ticks: {
            // Y축 눈금 포맷: formatter를 사용
            callback: function(value){
              try{ return selectFormatter(widget)(value) }catch(e){ return String(value) }
            }
          }
        }
      }
    }
  }
}

/*
  renderChart:
  - 기존 인스턴스가 있으면 데이터/옵션을 교체하고 update(), 없으면 새로 생성
  - numericData에 NaN이 포함되어 있을 경우 Chart.js가 처리할 수 있도록 그대로 전달(툴팁에서 포맷 시도)
*/
function renderChart(){
  if (!chartEl.value) return
  const ctx = chartEl.value.getContext('2d')
  const cfg = buildConfig(props.widget)
  if (chartInstance) {
    chartInstance.data.labels = cfg.data.labels
    chartInstance.data.datasets = cfg.data.datasets
    chartInstance.options = cfg.options
    chartInstance.update()
  } else {
    chartInstance = new Chart(ctx, cfg)
  }
}

onMounted(()=>{
  try{ renderChart() }catch(e){ console.warn('TimeSeriesChart mount render failed', e) }
})

onBeforeUnmount(()=>{
  try{
    if (chartInstance) { chartInstance.destroy(); chartInstance = null }
  }catch(e){ console.warn('TimeSeriesChart destroy failed', e) }
})

// widget 객체 내부가 바뀔 때 재렌더링 (deep watch)
watch(() => props.widget, () => {
  try{ renderChart() }catch(e){ console.warn('TimeSeriesChart render failed', e) }
}, { deep: true })
</script>

<style scoped>
/* 차트 카드 관련 스타일이 필요하면 여기에 */
.card { padding: 12px }
.card-title { font-weight:700; margin-bottom:8px }
canvas { display:block }
</style>
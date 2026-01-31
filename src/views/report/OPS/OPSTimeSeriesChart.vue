<template>
  <div class="card" ref="cardEl">
    <!-- 오른쪽 상단: 더보기 메뉴 -->
    <div class="more-menu">
      <button class="more-btn" @click.stop="menuOpen = !menuOpen">⋯</button>
      <div v-if="menuOpen" class="more-dropdown" @click.stop>
        <button class="dropdown-item" @click="onDownloadCSV">CSV 다운로드</button>
        <button class="dropdown-item" @click="onDownloadImage">이미지 다운로드</button>
      </div>
    </div>
    <div class="card-title">{{ widget.title }} <span v-if="pickUnitText(widget)">({{ pickUnitText(widget) }})</span></div>
    <!-- Chart.js는 canvas에 렌더링됩니다 -->
    <div v-if="hasData">
      <canvas ref="chartEl" style="height:220px; width:100%"></canvas>
    </div>
    <div v-else class="empty-state">데이터 없음</div>

    <!-- 오른쪽 하단: 작고 둥근 리셋 버튼 -->
    <button class="reset-zoom" title="원래 보기로" @click="resetZoom">↺</button>
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

import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
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

// computed: 데이터 유무 판단 (모든 값이 null 또는 비어있으면 false)
const hasData = computed(() => {
  const { numericData } = normalizeWidget(props.widget)
  if (!numericData || numericData.length === 0) return false
  // numericData가 모두 null 또는 NaN이면 데이터 없음
  return numericData.some(v => v !== null && !Number.isNaN(v))
})

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
      // zoom/pan 설정: 휠(마우스)/핀치(터치)로 확대/축소, 드래그로 pan
      plugins: {
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x'
          },
          pan: { enabled: true, mode: 'x' }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
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
  if (!hasData.value) {
    // 데이터 없음: 기존 차트가 있으면 제거
    if (chartInstance) { chartInstance.destroy(); chartInstance = null }
    return
  }
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

import zoomPlugin from 'chartjs-plugin-zoom'
Chart.register(zoomPlugin)

import { onMounted as onMount } from 'vue'

const menuOpen = ref(false)

// 안전한 CSV 다운로드: header 컬럼과 행 길이 정렬
function downloadCSV(){
  try{
    const { labels, rawData, numericData } = normalizeWidget(props.widget)
    // 헤더: label, raw, value
    const header = ['label','raw','value']
    const rows = []
    const n = Math.max((labels||[]).length, (numericData||[]).length, (rawData||[]).length)
    for (let i=0;i<n;i++){
      const lab = (labels && labels[i] !== undefined) ? labels[i] : ''
      const raw = (rawData && rawData[i] !== undefined) ? rawData[i] : ''
      const num = (numericData && numericData[i] !== undefined) ? numericData[i] : ''
      // 이스케이프 따옴표
      rows.push([`"${String(lab).replace(/"/g,'""') }"`, raw === null ? '' : String(raw), num === null ? '' : String(num)])
    }
    const csvContent = [header.join(','), ...rows.map(r=>r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const name = (props.widget && (props.widget.widgetKey || props.widget.title)) ? `${(props.widget.widgetKey||props.widget.title).toString().replace(/\s+/g,'_')}.csv` : 'chart.csv'
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }catch(e){ console.warn('downloadCSV failed', e) }
}

function downloadImage(){
  if (!chartInstance) return
  try{
    const url = chartInstance.toBase64Image()
    const a = document.createElement('a')
    a.href = url
    const name = (props.widget && (props.widget.widgetKey || props.widget.title)) ? `${(props.widget.widgetKey||props.widget.title).toString().replace(/\s+/g,'_')}.png` : 'chart.png'
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
  }catch(e){ console.warn('downloadImage failed', e) }
}

function onDownloadCSV(){ menuOpen = false; downloadCSV() }
function onDownloadImage(){ menuOpen = false; downloadImage() }

function resetZoom(){
  try{
    if (chartInstance && typeof chartInstance.resetZoom === 'function') { chartInstance.resetZoom() }
    else if (chartInstance) { setCategoryRange(0, (chartInstance.data.labels||[]).length - 1) }
  }catch(e){ console.warn('resetZoom failed', e) }
}
</script>

<style scoped>
/* 차트 카드 관련 스타일이 필요하면 여기에 */
.card { padding: 12px; position: relative }
.card-title { font-weight:700; margin-bottom:8px }
canvas { display:block }
.empty-state { height:220px; display:flex; align-items:center; justify-content:center; color:#9ca3af; font-size:14px }
.more-menu { position: absolute; right: 10px; top: 10px }
.more-btn { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 8px; cursor: pointer }
.more-dropdown { position: absolute; right: 0; top: 36px; background: #fff; border: 1px solid #e5e7eb; box-shadow: 0 6px 12px rgba(0,0,0,0.06); border-radius: 6px; overflow: hidden }
.dropdown-item { display: block; padding: 8px 12px; background: transparent; border: none; width: 160px; text-align: left; cursor: pointer }
.dropdown-item:hover { background: #f8fafc }
.reset-zoom { position: absolute; right: 12px; bottom: 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 999px; width: 36px; height: 36px; display:flex; align-items:center; justify-content:center; cursor:pointer }
</style>
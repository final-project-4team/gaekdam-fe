<template>
  <div class="card" role="group" :aria-label="title">
    <div class="card-title">{{ title }}</div>
    <div class="kpi-value" aria-live="polite">{{ formattedValue }}</div>
    <div class="kpi-target" v-if="widget.targetValue">목표: {{ formattedTarget }}</div>
    <div class="kpi-delta" :class="deltaClass">{{ deltaText }}</div>
  </div>
</template>

<script setup>
/*
  KpiCard.vue
  - 목적: 리포트 템플릿 내 개별 KPI 카드를 렌더링하는 프레젠테이셔널 컴포넌트입니다.
  - 주된 역할:
    1) 상위에서 전달된 `widget` 객체를 받아 화면에 표시되는 텍스트(제목/값/목표/증감)를 포맷하여 렌더링합니다.
    2) 값 형식(통화, 퍼센트, 건수 등)은 formatters 유틸을 사용해 일관되게 변환합니다.
    3) 접근성: 주요 수치에 `aria-live="polite"`를 적용하여 동적 변경을 보조 기술에 알립니다.
    4) 델타(증감) 값에 따라 시각(색상)을 구분하는 CSS 클래스를 적용합니다.
  - 기대되는 `widget` 객체 구조(예시):
    {
      templateWidgetId: number,
      templateId: number,
      widgetKey: 'CHECKIN_COUNT' | 'ADR' | 'OCCUPANCY_RATE' | ..., // 식별자
      title: '체크인',
      value: '123회' | '123' | '123.45원' | '12.3%',
      targetValue: '125회',
      changePct: -12.5,
      trend: 'up' | 'down' | 'neutral',
      sortOrder: number
    }
  - 구현 노트:
    * 값이 이미 포맷된 문자열로 들어올 수 있으므로 formatters에서 안전하게 파싱/복원 후 포맷합니다.
    * widgetKey를 통해 값의 의미를 유추하여 적절한 포맷 함수를 호출합니다.
    * 프레젠테이셔널 컴포넌트이므로 비즈니스 로직(데이터 호출 등)은 상위 컴포넌트에서 처리해야 합니다.
*/

import { computed } from 'vue'
import { formatCurrency, formatPercent, formatCount } from '@/utils/formatters'

const props = defineProps({
  widget: { type: Object, required: true }
})

// 표시 제목
const title = computed(() => props.widget.title || '')
// 원시 값
const rawValue = computed(() => props.widget.value)
// widgetKey는 대문자로 통일하여 비교에 사용
const key = computed(() => (props.widget.widgetKey || '').toString().toUpperCase())

// 값 포맷팅: ADR 등 통화, 퍼센트, 그 외는 건수로 표시
const formattedValue = computed(() => {
  if (key.value.includes('ADR') || key.value.includes('PRICE')) return formatCurrency(rawValue.value)
  if (key.value.includes('RATE') || key.value.includes('OCCUPANCY') || String(rawValue.value).includes('%')) return formatPercent(rawValue.value)
  return formatCount(rawValue.value)
})

// 목표값 포맷 (타입에 따라 동일한 포맷 함수 사용)
const formattedTarget = computed(() => {
  const t = props.widget.targetValue
  if (!t) return ''
  if (key.value.includes('ADR')) return formatCurrency(t)
  if (key.value.includes('RATE') || String(t).includes('%')) return formatPercent(t)
  return formatCount(t)
})

// 델타 숫자(증감률) 처리: null/undefined 방어
const delta = computed(() => {
  const v = props.widget.changePct
  return (v === null || v === undefined) ? null : Number(v)
})

const deltaText = computed(() => delta.value === null ? '' : `${delta.value}%`)
const deltaClass = computed(() => delta.value === null ? 'delta-neutral' : (delta.value >= 0 ? 'delta-up' : 'delta-down'))
</script>

<style scoped>
/* 기존 스타일 유지 (필요 시 디자인 팀 규칙에 맞춰 수정) */
</style>
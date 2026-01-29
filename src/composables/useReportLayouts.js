// useReportLayouts: 리포트 레이아웃 관련 상태와 비동기 작업을 캡슐화한 composable
// - 레이아웃 목록 불러오기, 템플릿 목록 불러오기, 템플릿 위젯 불러오기
// - 레이아웃/템플릿 생성/삭제, 기간 적용 등 뷰에서 사용하는 모든 로직 제공

import { ref, computed } from 'vue'
import { createReportLayout, deleteReportLayout, listReportLayouts, updateReportLayout } from '@/api/report/layoutApi'
import { addLayoutTemplate, deleteLayoutTemplate, listLayoutTemplates, getTemplateWidgets as apiGetTemplateWidgets } from '@/api/report/layoutTemplateApi'
import { useAuthStore } from '@/stores/authStore'

export function useReportLayouts() {
  // 인증(현재 직원 코드 등)이 필요한 경우 사용
  const auth = useAuthStore?.()

  // UI/상태
  const layouts = ref([]) // 레이아웃 목록
  const selectedIndex = ref(0) // 선택된 레이아웃 인덱스
  const selectedTemplateIndex = ref(0) // 선택된 템플릿 인덱스

  // 기간 관련 상태 (뷰에서 바인딩 가능)
  const periodType = ref('연간')
  const currentYear = new Date().getFullYear()
  const years = ref(Array.from({ length: 6 }, (_, i) => String(currentYear - i)))
  const months = ref(Array.from({ length: 12 }, (_, i) => String(i + 1)))
  const selectedYear = ref(String(currentYear))
  const selectedMonth = ref(String(new Date().getMonth() + 1))

  // 계산된 값들
  const currentLayout = computed(() => layouts.value[selectedIndex.value] || { name: '', templates: [] })
  const selectedTemplate = computed(() => {
    const templates = currentLayout.value?.templates || []
    const idx = selectedTemplateIndex.value
    if (typeof idx === 'number' && idx >= 0 && idx < templates.length) return [templates[idx]]
    return []
  })

  function pad(n){ return String(n).padStart(2,'0') }
  function getPeriod(){
    const preset = periodType.value === '월간' ? 'MONTH' : 'YEAR'
    return preset === 'MONTH' ? `${selectedYear.value}-${pad(selectedMonth.value)}` : `${selectedYear.value}`
  }

  // --- 주요 함수들 ---
  // 1) 레이아웃 목록 조회: 서버에서 레이아웃을 가져와 내부 상태에 설정
  const loadLayouts = async () => {
    const employeeCode = auth?.employeeCode ?? 1
    try {
      const res = await listReportLayouts(employeeCode)
      const data = res?.data?.data || []
      // backend shape에 따라 id/name/templates 추출
      layouts.value = data.map(r => ({ id: r.layoutId ?? r.id, name: r.name, templates: r.templates || [] }))
      const initial = layouts.value[selectedIndex.value]
      if (initial && initial.id) loadTemplatesForLayout(initial.id, selectedIndex.value)
    } catch (err) {
      console.error('[useReportLayouts] loadLayouts failed', err)
      // 뷰에서 알림을 표시하려면 호출자에서 잡아서 처리
    }
  }

  // 2) 특정 레이아웃의 템플릿 목록 로드
  // - layoutId: 서버에 요청할 id
  // - index: 로컬 layouts 배열의 인덱스 (있으면 해당 인덱스에 결과를 넣음)
  const loadTemplatesForLayout = async (layoutId, index) => {
    try {
      const res = await listLayoutTemplates(layoutId)
      const payload = res?.data?.data
      let items = []
      if (Array.isArray(payload)) items = payload
      else if (payload?.templates && Array.isArray(payload.templates)) items = payload.templates
      else if (payload?.items && Array.isArray(payload.items)) items = payload.items
      else if (payload?.list && Array.isArray(payload.list)) items = payload.list
      else if (payload && typeof payload === 'object') items = [payload]

      // UI에서 사용할 형태로 매핑
      const mapped = items.map(r => ({ id: r.layoutTemplateId ?? r.id ?? (r.templateId ? `${r.templateId}-${Date.now()}` : `${Math.random()}`), templateId: r.templateId, isActive: r.isActive, name: r.templateName }))
      const idx = typeof index === 'number' ? index : layouts.value.findIndex(l => l.id === layoutId)
      if (idx !== -1) {
        layouts.value[idx].templates = mapped
        if (selectedIndex.value === idx) selectedTemplateIndex.value = 0
      }
      if (selectedIndex.value === idx) {
        const tpl = layouts.value[idx].templates[0]
        if (tpl) loadWidgetsForTemplate(tpl)
      }
    } catch (err) {
      console.error('[useReportLayouts] loadTemplatesForLayout failed', err)
    }
  }

  // 3) 템플릿에 포함된 위젯(카드)들 로드
  const loadWidgetsForTemplate = async (template) => {
    if (!template) return
    const templateId = template.templateId ?? template.id
    if (!templateId) return
    const period = getPeriod()
    try {
      const res = await apiGetTemplateWidgets(templateId, period)
      const items = res?.data?.data || []
      // sortOrder로 정렬 후 템플릿 객체에 위젯 배열을 붙임
      template.widgets = Array.isArray(items) ? items.sort((a,b)=> (a.sortOrder||0)-(b.sortOrder||0)) : []
    } catch (err) {
      console.error('[useReportLayouts] loadWidgetsForTemplate failed', err)
      template.widgets = []
    }
  }

  // 4) 레이아웃 생성: payload는 뷰에서 준비된 DTO
  const createLayout = async (payload) => {
    try {
      const res = await createReportLayout(payload)
      const newId = res?.data?.data
      layouts.value.push({ id: newId ?? `layout-${Date.now()}`, name: payload.name, templates: [] })
      selectedIndex.value = layouts.value.length - 1
      return layouts.value[selectedIndex.value]
    } catch (err) {
      console.error('[useReportLayouts] createLayout failed', err)
      throw err
    }
  }

  // 5) 레이아웃 삭제
  const deleteLayout = async (id) => {
    if (!id) return
    try {
      const parsed = Number(id)
      const sendId = Number.isFinite(parsed) ? parsed : id
      await deleteReportLayout(sendId)
      const idx = layouts.value.findIndex(l => l.id === id)
      if (idx !== -1) {
        layouts.value.splice(idx, 1)
        selectedIndex.value = Math.max(0, idx - 1)
      }
    } catch (err) {
      console.error('[useReportLayouts] deleteLayout failed', err)
      throw err
    }
  }

  // 6) 레이아웃의 기본 기간(defaultFilterJson) 적용 (PATCH)
  const applyPeriodToLayout = async (layout) => {
    if (!layout || !layout.id) return
    const preset = periodType.value === '월간' ? 'MONTH' : 'YEAR'
    const period = preset === 'MONTH' ? `${selectedYear.value}-${String(selectedMonth.value).padStart(2,'0')}` : `${selectedYear.value}`
    const payload = { layoutId: layout.id, defaultFilterJson: { periodType: preset, period } }
    try {
      await updateReportLayout(layout.id, payload)
      const idx = layouts.value.findIndex(l => l.id === layout.id)
      if (idx !== -1) layouts.value[idx].defaultFilterJson = payload.defaultFilterJson
      const tpl = currentLayout.value?.templates?.[selectedTemplateIndex.value]
      if (tpl) await loadWidgetsForTemplate(tpl)
    } catch (err) {
      console.error('[useReportLayouts] applyPeriodToLayout failed', err)
      throw err
    }
  }

  // 7) 템플릿 추가 (로컬 또는 서버 호출)
  const addTemplate = async (layoutIndex, tplDto, employeeCode) => {
    try {
      const layout = layouts.value[layoutIndex]
      if (!layout || !layout.id) {
        // 서버 저장 대상이 아니면 로컬에 임시 추가
        const copy = { ...tplDto, id: `${tplDto.templateId}-${Date.now()}`, name: tplDto.displayName }
        layouts.value[layoutIndex].templates.push(copy)
        selectedTemplateIndex.value = layouts.value[layoutIndex].templates.length - 1
        return copy
      }
      const sendLayoutId = Number.isFinite(Number(layout.id)) ? Number(layout.id) : layout.id
      const res = await addLayoutTemplate(sendLayoutId, tplDto, employeeCode ?? (auth?.employeeCode ?? 1))
      const newId = res?.data?.data
      const added = { id: newId ?? `${tplDto.templateId}-${Date.now()}`, templateId: tplDto.templateId, displayName: tplDto.displayName, sortOrder: tplDto.sortOrder, isActive: tplDto.isActive, name: tplDto.displayName }
      layouts.value[layoutIndex].templates.push(added)
      selectedTemplateIndex.value = layouts.value[layoutIndex].templates.length - 1
      return added
    } catch (err) {
      console.error('[useReportLayouts] addTemplate failed', err)
      throw err
    }
  }

  // 8) 템플릿 삭제 (서버 호출 후 로컬 제거)
  const deleteTemplate = async (layoutIndex, templateIndex) => {
    const templates = layouts.value[layoutIndex]?.templates || []
    if (templateIndex < 0 || templateIndex >= templates.length) return
    const tpl = templates[templateIndex]
    const layout = layouts.value[layoutIndex]
    try {
      if (layout && layout.id && tpl) {
        const sendLayoutId = Number.isFinite(Number(layout.id)) ? Number(layout.id) : layout.id
        const sendTemplateId = tpl.templateId !== undefined ? tpl.templateId : (Number.isFinite(Number(tpl.id)) ? Number(tpl.id) : tpl.id)
        await deleteLayoutTemplate(sendLayoutId, sendTemplateId)
      }
      templates.splice(templateIndex, 1)
      if (templates.length === 0) selectedTemplateIndex.value = 0
      else selectedTemplateIndex.value = Math.max(0, templateIndex - 1)
    } catch (err) {
      console.error('[useReportLayouts] deleteTemplate failed', err)
      throw err
    }
  }

  return {
    layouts,
    selectedIndex,
    selectedTemplateIndex,
    currentLayout,
    selectedTemplate,
    periodType,
    years,
    months,
    selectedYear,
    selectedMonth,
    loadLayouts,
    loadTemplatesForLayout,
    loadWidgetsForTemplate,
    createLayout,
    deleteLayout,
    applyPeriodToLayout,
    addTemplate,
    deleteTemplate,
  }
}

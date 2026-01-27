<template>
  <div class="layout-page">
    <!-- Top: layout tabs with + 버튼 -->
    <div class="top-tabs">
      <div
        v-for="(l, i) in layouts"
        :key="l.id"
        class="top-tab"
        :class="{ active: selectedIndex === i }"
        @click="selectLayout(i)"
      >
        <span>{{ l.name }}</span>
        <span class="top-delete">
          <span @click.stop>
            <BaseButton size="sm" @click="openDeleteModal(l)">✕</BaseButton>
          </span>
        </span>
      </div>

      <BaseButton size="sm" @click="openCreateLayout" class="add-tab">+</BaseButton>
    </div>

    <div class="content-area">
      <!-- Left: 레이아웃 내 템플릿 리스트 -->
      <aside class="left-pane">
        <div class="template-list-vertical">
          <div
            v-for="(tpl, idx) in currentLayout.templates"
            :key="tpl.id"
            class="tpl-row"
          >
            <button
              class="tpl-btn"
              :class="{ active: selectedTemplateIndex === idx }"
              @click="selectedTemplateIndex = idx"
            >
              {{ tpl.name }}
            </button>

            <span class="tpl-delete" @click.stop>
              <BaseButton size="sm" @click="confirmDeleteTemplate(idx)">✕</BaseButton>
            </span>
          </div>
        </div>

        <div class="left-controls">
          <BaseButton size="sm" @click="openCreateTemplate">+</BaseButton>
        </div>
      </aside>

      <!-- Main: 템플릿 카드 그리드 -->
      <section class="main-pane">
        <div class="layout-header">
          <h3>{{ currentLayout.name }}</h3>
          <div class="header-controls">
            <select v-model="periodType" @change="onPeriodTypeChange">
              <option value="연간">연간</option>
              <option value="월간">월간</option>
            </select>

            <select v-model="selectedYear" @change="applyPeriodToLayout">
              <option v-for="y in years" :key="y" :value="y">{{ y }}년</option>
            </select>

            <select v-if="periodType === '월간'" v-model="selectedMonth" @change="applyPeriodToLayout">
              <option v-for="m in months" :key="m" :value="m">{{ m }}월</option>
            </select>

            <BaseButton type="primary" size="sm" @click="shareReport">공유</BaseButton>
          </div>
        </div>

        <div class="template-grid">
          <div class="card" v-for="(t, idx) in selectedTemplate" :key="t.id">
            <div class="card-title">{{ t.name }}</div>
            <div class="card-body">템플릿 콘텐츠 예시</div>
          </div>
        </div>
      </section>
    </div>

    <!-- 레이아웃 추가 모달 -->
    <BaseModal v-if="showCreateLayout" title="레이아웃 추가" @close="showCreateLayout = false">
      <div class="create-layout-form">
        <div class="form-row">
          <label class="form-label">레이아웃 이름</label>
          <input v-model="newLayoutName" placeholder="레이아웃 이름" />
        </div>

        <div class="form-row">
          <label class="form-label">조회 권한부여</label>
          <div class="radio-group">
            <label><input type="radio" :value="VISIBILITY.PRIVATE" v-model="selectedVisibility" /> 나에게만</label>
            <label><input type="radio" :value="VISIBILITY.DEPT" v-model="selectedVisibility" /> 부서 내 공유</label>
            <label><input type="radio" :value="VISIBILITY.TENANT" v-model="selectedVisibility" /> 호텔 전체</label>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">내용</label>
          <textarea v-model="newLayoutDescription" rows="5" placeholder="레이아웃에 대한 설명을 입력하세요"></textarea>
        </div>

        <div style="margin-top:12px; text-align:right">
          <BaseButton @click="showCreateLayout = false">취소</BaseButton>
          <BaseButton @click="createLayout" type="primary" style="margin-left:8px">생성</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- 템플릿 추가 모달 -->
    <BaseModal v-if="showCreateTemplate" title="템플릿 추가" @close="showCreateTemplate = false">
      <div class="available-list">
        <div v-for="tpl in availableTemplates" :key="tpl.templateId" class="available-row">
          <span>{{ tpl.displayName }}</span>
          <BaseButton size="sm" @click="confirmAddTemplate(tpl)">추가</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- 템플릿 삭제 모달 -->
    <BaseModal v-if="showDeleteTemplateModal" title="템플릿 삭제" @close="showDeleteTemplateModal = false">
      <div>템플릿을 삭제하시겠습니까?</div>
      <div style="text-align:right; margin-top:12px">
        <BaseButton @click="showDeleteTemplateModal = false">취소</BaseButton>
        <BaseButton type="danger" @click="deleteTemplate">삭제</BaseButton>
      </div>
    </BaseModal>

    <!-- 레이아웃 삭제 모달 -->
    <BaseModal v-if="showDeleteModal" title="레이아웃 삭제" @close="showDeleteModal = false">
        <div>레이아웃을 삭제하시겠습니까?</div>
        <div style="text-align:right; margin-top:12px">
            <BaseButton @click="showDeleteModal = false">취소</BaseButton>
            <BaseButton type="danger" @click="confirmDelete">삭제</BaseButton>
        </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseButton from '@/components/common/button/BaseButton.vue'
import BaseModal from '@/components/common/modal/BaseModal.vue'
import { createReportLayout, deleteReportLayout, listReportLayouts, updateReportLayout } from '@/api/report/layoutApi'
import { addLayoutTemplate, deleteLayoutTemplate, listLayoutTemplates, getTemplateWidgets } from '@/api/report/layoutTemplateApi'
import { useAuthStore } from '@/stores/authStore'

// Visibility enum mapping to backend
const VISIBILITY = {
  PRIVATE: 'PRIVATE',
  TENANT: 'TENANT', // 호텔 전체 (backend VisibilityScope.TENANT)
  DEPT: 'DEPT'      // 부서 (backend VisibilityScope.DEPT)
}

// 사용자 인증
const auth = useAuthStore?.()

// 레이아웃 목록 (초기값 하나)
const layouts = ref([
  { id: 'layout-1', name: '기본 레이아웃', templates: [ { id: 'tpl1', name: '템플릿1' } ] },
])

const selectedIndex = ref(0)
const selectedTemplateIndex = ref(0)

const creatingLayout = ref(false)
const currentLayout = computed(() => layouts.value[selectedIndex.value] || { name: '', templates: [] })

// Compute the currently selected template (array with single item for v-for compatibility)
const selectedTemplate = computed(() => {
  const templates = currentLayout.value?.templates || []
  const idx = selectedTemplateIndex.value
  if (typeof idx === 'number' && idx >= 0 && idx < templates.length) {
    return [templates[idx]]
  }
  return []
})

const creatingTemplate = ref(false)

// 기간/공유 컨트롤 상태
const periodType = ref('연간') // '연간' | '월간'
const currentYear = new Date().getFullYear()
const years = computed(() => {
  // 최근 6년치 표시
  return Array.from({ length: 6 }, (_, i) => String(currentYear - i))
})
const months = computed(() => Array.from({ length: 12 }, (_, i) => String(i + 1)))
const selectedYear = ref(String(currentYear))
const selectedMonth = ref(String(new Date().getMonth() + 1))

const onPeriodTypeChange = () => {
  // 월간 -> 연간 변경 등에서 기본값 보정
  if (periodType.value === '연간') {
    // 월 선택은 초기화
    selectedMonth.value = String(new Date().getMonth() + 1)
  }
}

const shareReport = () => {
  // 실제 공유 로직 연결 전에 임시 동작으로 로그 출력
  console.log('공유 클릭:', { periodType: periodType.value, year: selectedYear.value, month: selectedMonth.value })
  // TODO: 공유 모달 또는 링크 생성 로직 추가
}

// 레이아웃 생성
const showCreateLayout = ref(false)
const newLayoutName = ref('')
const newLayoutDescription = ref('')
const selectedVisibility = ref(VISIBILITY.PRIVATE)
const openCreateLayout = () => { newLayoutName.value = ''; newLayoutDescription.value = ''; selectedVisibility.value = VISIBILITY.PRIVATE; showCreateLayout.value = true }

const createLayout = async () => {
  if (creatingLayout.value) return
  creatingLayout.value = true
  try {
    const employeeCode = auth?.employeeCode ?? 1
    const preset = periodType.value === '월간' ? 'MONTH' : 'YEAR'
    const period = preset === 'MONTH'
      ? `${selectedYear.value}-${String(selectedMonth.value).padStart(2,'0')}`
      : `${selectedYear.value}`

    const payload = {
      employeeCode,
      name: newLayoutName.value || `레이아웃 ${layouts.value.length + 1}`,
      description: newLayoutDescription.value,
      isDefault: false,
      visibilityScope: selectedVisibility.value,
      dateRangePreset: preset,
      defaultFilterJson: { periodType: preset, period }
    }

    const res = await createReportLayout(payload)
    const newId = res?.data?.data // ApiResponse.success(id) 구조에 따라 조정
    layouts.value.push({ id: newId ?? `layout-${Date.now()}`, name: payload.name, templates: [] })
    selectedIndex.value = layouts.value.length - 1
    showCreateLayout.value = false
  } catch (err) {
    console.error('레이아웃 생성 실패', err)
    // 사용자 알림 처리 추가
  } finally {
    creatingLayout.value = false
  }
}

const selectLayout = (i) => {
  selectedIndex.value = i
  selectedTemplateIndex.value = 0
  // load templates for the selected layout from server (if it has id)
  const layout = layouts.value[i]
  if (layout && layout.id) {
    loadTemplatesForLayout(layout.id, i)
  }
}

// Load templates for a given layoutId and write into layouts[index].templates
const loadTemplatesForLayout = async (layoutId, index) => {
   try {
    const res = await listLayoutTemplates(layoutId)
    console.debug('[ReportLayout] listLayoutTemplates response=', res)
    const payload = res?.data?.data
    // support several possible shapes: direct array, { templates: [] }, { items/list: [] }, or single object
    let items = []
    if (Array.isArray(payload)) {
      items = payload
    } else if (payload?.templates && Array.isArray(payload.templates)) {
      items = payload.templates
    } else if (payload?.items && Array.isArray(payload.items)) {
      items = payload.items
    } else if (payload?.list && Array.isArray(payload.list)) {
      items = payload.list
    } else if (payload) {
      // if payload is a single object representing one item, wrap it
      if (typeof payload === 'object') items = [payload]
    }
     // Map backend DTO to UI template shape
    const mapped = items.map(r => ({
      id: r.layoutTemplateId ?? r.id ?? (r.templateId ? `${r.templateId}-${Date.now()}` : `${Math.random()}`),
      templateId: r.templateId,
      // displayName: r.templateName,
      // templateDesc: r.templateDesc,
      isActive: r.isActive,
      name: r.templateName
    }))

     // Guard index
     const idx = typeof index === 'number' ? index : layouts.value.findIndex(l => l.id === layoutId)
     if (idx !== -1) {
       layouts.value[idx].templates = mapped
       // reset selectedTemplateIndex if needed
       if (selectedIndex.value === idx) selectedTemplateIndex.value = 0
     }
   } catch (err) {
     console.error('[ReportLayout] loadTemplatesForLayout failed', err)
   }
}

// 현재 선택된 layout에 기간 필터를 PATCH로 저장 & 통계데이터 수집
const applyPeriodToLayout = async () => {
  const layout = currentLayout.value
  if (!layout || !layout.id) return

  const preset = periodType.value === '월간' ? 'MONTH' : 'YEAR'
  const period = preset === 'MONTH'
    ? `${selectedYear.value}-${String(selectedMonth.value).padStart(2,'0')}`
    : `${selectedYear.value}`

  const payload = {
    // backend ReportLayoutUpdateDto에 맞춰 필요한 필드만 보냄
    layoutId: layout.id,
    defaultFilterJson: { periodType: preset, period }
  }

  try {
    await updateReportLayout(layout.id, payload)
    // 로컬 상태도 갱신
    const idx = layouts.value.findIndex(l => l.id === layout.id)
    if (idx !== -1) {
      layouts.value[idx].defaultFilterJson = payload.defaultFilterJson
    }

    const tpl = currentLayout.value?.templates?.[selectedTemplateIndex.value]
    if (tpl) await loadWidgetsForTemplate(tpl)

    console.log('[ReportLayout] applied period to layout', layout.id, payload)
  } catch (err) {
    console.error('기간 적용 실패', err)
  }
}


// 템플릿 추가: 백엔드 DTO 형식에 맞춘 샘플 목록
const availableTemplates = [
  { templateId: 1, displayName: '전체 요약 템플릿', sortOrder: 1, isActive: true },
  { templateId: 2, displayName: '객실운영 요약 템플릿', sortOrder: 2, isActive: true },
  { templateId: 3, displayName: '고객현황 요약 템플릿', sortOrder: 3, isActive: true },
  { templateId: 4, displayName: '고객경험 요약 템플릿', sortOrder: 4, isActive: true },
  { templateId: 5, displayName: '예약및매출 요약 템플릿', sortOrder: 5, isActive: true },
]

const showCreateTemplate = ref(false)
const openCreateTemplate = () => { showCreateTemplate.value = true }

// 간단한 추가 로직: tpl 객체를 그대로 DTO로 사용하고, 레이아웃 id가 없으면 로컬에만 추가
const confirmAddTemplate = async (tpl) => {
  if (creatingTemplate.value) return
  creatingTemplate.value = true
  try {
    const layout = layouts.value[selectedIndex.value]
    if (!layout || !layout.id) {
      // 로컬만 추가
      const copy = { ...tpl, id: `${tpl.templateId}-${Date.now()}`, name: tpl.displayName }
      layouts.value[selectedIndex.value].templates.push(copy)
      selectedTemplateIndex.value = layouts.value[selectedIndex.value].templates.length - 1
      showCreateTemplate.value = false
      return
    }

    const dto = {
      templateId: tpl.templateId,
      displayName: tpl.displayName,
      sortOrder: tpl.sortOrder ?? (layouts.value[selectedIndex.value].templates.length + 1),
      isActive: tpl.isActive ?? true
    }

    const employeeCode = auth?.employeeCode ?? 1
    const sendLayoutId = Number.isFinite(Number(layout.id)) ? Number(layout.id) : layout.id
    const res = await addLayoutTemplate(sendLayoutId, dto, employeeCode)
    const newId = res?.data?.data

    const added = { id: newId ?? `${dto.templateId}-${Date.now()}`, templateId: dto.templateId, displayName: dto.displayName, sortOrder: dto.sortOrder, isActive: dto.isActive, name: dto.displayName }
    layouts.value[selectedIndex.value].templates.push(added)
    selectedTemplateIndex.value = layouts.value[selectedIndex.value].templates.length - 1
    showCreateTemplate.value = false
  } catch (err) {
    console.error('템플릿 추가 실패', err)
  } finally {
    creatingTemplate.value = false
  }
}

// 템플릿 삭제
const showDeleteTemplateModal = ref(false)
const deleteTemplateIndex = ref(-1)
const deletingTemplate = ref(false)

const confirmDeleteTemplate = (idx) => {
  deleteTemplateIndex.value = idx
  showDeleteTemplateModal.value = true
}

const deleteTemplate = async () => {
  if (deletingTemplate.value) return
  deletingTemplate.value = true

  const i = deleteTemplateIndex.value
  const templates = layouts.value[selectedIndex.value]?.templates || []
  if (i < 0 || i >= templates.length) {
    showDeleteTemplateModal.value = false
    deletingTemplate.value = false
    return
  }

  const tpl = templates[i]
  const layout = layouts.value[selectedIndex.value]

  try {
    // If both layout and template have server ids, call backend delete
    if (layout && layout.id && tpl) {
      const sendLayoutId = Number.isFinite(Number(layout.id)) ? Number(layout.id) : layout.id
      // Controller expects templateId (library id). Use tpl.templateId when available, otherwise fallback to tpl.id
      const sendTemplateId = tpl.templateId !== undefined ? tpl.templateId : (Number.isFinite(Number(tpl.id)) ? Number(tpl.id) : tpl.id)
      await deleteLayoutTemplate(sendLayoutId, sendTemplateId)
    }

    // Remove locally regardless of server call
    templates.splice(i, 1)
    if (templates.length === 0) {
      selectedTemplateIndex.value = 0
    } else {
      selectedTemplateIndex.value = Math.max(0, i - 1)
    }

    console.log('[ReportLayout] template deleted', tpl)
  } catch (err) {
    console.error('템플릿 삭제 실패', err)
    try { alert('템플릿 삭제에 실패했습니다: ' + (err?.message || err)) } catch(_){ }
  } finally {
    showDeleteTemplateModal.value = false
    deleteTemplateIndex.value = -1
    deletingTemplate.value = false
  }
}

// 레이아웃 삭제 상태 (id 기반)
const showDeleteModal = ref(false)
const selectedLayoutId = ref(null)
// 삭제 진행 플래그 (중복 클릭 방지 / 로딩 UI용)
const deletingLayout = ref(false)

// 열기: 레이아웃 객체를 받아 id를 저장하고 모달 표시
const openDeleteModal = (layout) => {
  console.log('[ReportLayout] openDeleteModal layout=', layout)
  selectedLayoutId.value = layout?.id ?? null
  showDeleteModal.value = true
}

// 확인: 저장된 id로 API 호출 후 로컬 상태에서 제거
// 1. 웹브라우저 상에서 삭제한 레이아웃이 사라져야함
// 2. api 로직을 타서 db 상에 해당 레이아웃 데이터가 사라져야함
const confirmDelete = async () => {

  const id = selectedLayoutId.value
  console.log('[ReportLayout] confirmDelete called, selectedLayoutId=', id)

  if (!id) {
    showDeleteModal.value = false
    selectedLayoutId.value = null
    return
  }

  // 중복 클릭 방지
  if (deletingLayout.value) return
  deletingLayout.value = true

  // 로그 남기기 (디버깅용)
  console.log('[ReportLayout] delete requested id=', id)

  // 숫자 id로 변환 가능한 경우 서버가 숫자를 기대하면 숫자로 보낸다
  const parsed = Number(id)
  const sendId = Number.isFinite(parsed) ? parsed : id

  try {
    await deleteReportLayout(sendId)
    const idx = layouts.value.findIndex(l => l.id === id)
    if (idx !== -1) {
      layouts.value.splice(idx, 1)
      selectedIndex.value = Math.max(0, idx - 1)
    }
    console.log('[ReportLayout] delete success id=', id)
  } catch (err) {
    console.error('삭제 실패', err)
    // 사용자에게 알림 (간단한 폴백)
    try { alert('레이아웃 삭제에 실패했습니다: ' + (err?.message || err)) } catch(_){}
  } finally {
    showDeleteModal.value = false
    selectedLayoutId.value = null
    deletingLayout.value = false
  }
}

// 레이아웃 목록 조회
const loadLayouts = async () => {
  const employeeCode = auth?.employeeCode ?? 1
  const res = await listReportLayouts(employeeCode)
  console.log('[ReportLayout] list response=', res?.data?.data)
  // backend returns items with `layoutId` field — map it to `id` used in the UI
  layouts.value = (res?.data?.data || []).map(r => ({
    id: r.layoutId ?? r.id,
    name: r.name,
    templates: r.templates || []
  }))
  // load templates for initial selected layout if available
  const initial = layouts.value[selectedIndex.value]
  if (initial && initial.id) {
    loadTemplatesForLayout(initial.id, selectedIndex.value)
  }
}

/* 기간필터 적용하여 통계자료 업데이트 */
// 2) 유틸: pad
function pad(n) {
  return String(n).padStart(2, '0')
}

// 3) getPeriod (ref 값 사용)
function getPeriod() {
  const preset = periodType.value === '월간' ? 'MONTH' : 'YEAR'
  return preset === 'MONTH' ? `${selectedYear.value}-${pad(selectedMonth.value)}` : `${selectedYear.value}`
}

// 4) loadWidgetsForTemplate 구현
async function loadWidgetsForTemplate(template) {
  if (!template) return
  const templateId = template.templateId ?? template.id
  if (!templateId) return

  const period = getPeriod()
  try {
    const res = await getTemplateWidgets(templateId, period)
    const payload = res?.data?.data
    // 응답 shape에 맞춰서 mapping (서비스에서 이미 MetricResult 배열을 반환한다고 가정)
    // 예: [{ widgetKey:'CHECKIN_COUNT', value:123, targetValue:200, formattedActual:'123' }, ...]
    template.widgets = Array.isArray(payload) ? payload : (payload?.items || payload?.list || [])
  } catch (err) {
    console.error('[ReportLayout] loadWidgetsForTemplate failed', err)
    template.widgets = []
  }
}

// 5) 트리거: 템플릿 클릭 시 로드
// (템플릿 리스트 버튼을 아래처럼 바꿔야 함)
// 기존: @click="selectedTemplateIndex = idx"
// 변경: @click="onSelectTemplate(idx)"
const onSelectTemplate = (idx) => {
  selectedTemplateIndex.value = idx
  const tpl = currentLayout.value?.templates?.[idx]
  if (tpl) loadWidgetsForTemplate(tpl)
}

// 화면 렌더링 시 레이아웃 실행
onMounted(loadLayouts)

</script>

<style scoped>
.layout-page { display:flex; flex-direction:column; gap:12px; }
.top-tabs { display:flex; gap:8px; align-items:center; padding:6px 10px; }
.top-tab { padding:8px 14px; border-radius:8px; background:#f5f7fb; color:#4b5563; cursor:pointer; }
.top-tab.active { background: linear-gradient(135deg,#e6f0ff,#dfeaff); color:#1e3a8a; font-weight:600 }
.add-tab { margin-left:6px }

.content-area { display:flex; gap:12px; }
.left-pane { width:120px; display:flex; flex-direction:column; align-items:flex-start; }
.left-controls { margin-bottom:8px; }
.template-list-vertical { display:flex; flex-direction:column; gap:8px; width:100%; }
.tpl-row { position: relative; display:flex; align-items:center; gap:8px; }
.tpl-btn { flex:1; padding:8px; border-radius:8px; background:#f6f8fb; border:1px solid #e6eef8; cursor:pointer; text-align:left }
.tpl-btn.active { background: linear-gradient(135deg,#e6f0ff,#dfeaff); color:#12336a }
/* position delete icon in top tab */
.top-tab { position: relative }
.top-delete { position: relative; display:inline-flex }

/* template list: position delete icon */
.tpl-delete { position: relative; right:6px; display:inline-flex }

.main-pane { flex:1 }
.layout-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px }
/* Header controls on the right */
.header-controls { display:flex; gap:8px; align-items:center }
.header-controls select { padding:6px 8px; border-radius:6px; border:1px solid #dfe6f3; background:#fff }

.template-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px }
.card { padding:18px; border:1px solid #eee; border-radius:8px; background:#fff; text-align:center }
.card-title { font-weight:700; margin-bottom:6px }
.available-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f3f4f6 }

.create-layout-form { display:flex; flex-direction:column; gap:12px; min-width:520px }
.form-row { display:flex; gap:12px; align-items:flex-start }
.form-label { width:110px; color:#374151; font-weight:600 }
.radio-group { display:flex; gap:12px; align-items:center }
.radio-group label { display:flex; gap:6px; align-items:center }
.create-layout-form input[type="text"], .create-layout-form textarea { flex:1; padding:8px; border:1px solid #e5e7eb; border-radius:6px }
</style>
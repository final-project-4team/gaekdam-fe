<template>
  <div class="layout-page">
    <!-- Top tabs removed: left sidebar now contains layout & template controls -->

    <div class="content-area">
      <!-- Left: 레이아웃 및 템플릿 트리 (왼쪽에 몰아 깔끔하게 표시) -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-title">레이아웃 & 템플릿</div>
          <div class="sidebar-actions">
            <button class="add-layout-btn" @click="openCreateLayout">＋ 레이아웃</button>
          </div>
        </div>

        <ul class="layouts-list">
          <li v-for="(layout, li) in layouts" :key="layout.id" :class="['layout-item', { 'is-active': li === selectedIndex }]">
            <div class="layout-row">
              <button
                class="layout-select"
                @click="selectLayout(li)"
                :aria-expanded="li === selectedIndex ? 'true' : 'false'"
                :title="layout.description || layout.name"
              >
                <span class="chev">{{ li === selectedIndex ? '▾' : '▸' }}</span>
                <div class="layout-text">
                  <div class="layout-name">{{ layout.name }}</div>
                  <div v-if="layout.description" class="layout-desc">{{ layout.description }}</div>
                </div>
              </button>
              <div class="layout-controls">
                <button class="icon-btn danger" title="레이아웃 삭제" @click.stop="openDeleteModal(layout)">🗑</button>
              </div>
            </div>

            <ul class="templates-sublist" v-show="li === selectedIndex">
              <li v-for="(tpl, ti) in layout.templates || []" :key="tpl.templateId ?? tpl.id" :class="['template-item', { 'is-active': ti === selectedTemplateIndex }]">
                <button class="template-select" @click="onSelectTemplateLocal(li, ti)">
                  <span class="tpl-dot">●</span>
                  <span class="tpl-text">{{ tpl.displayName || tpl.name || '템플릿' }}</span>
                </button>
                <button class="template-del" title="템플릿 삭제" @click.stop="confirmDeleteTemplateLocal(li, ti)">삭제</button>
              </li>
              <li class="template-add-row"><button class="add-template-btn" @click.stop="openCreateTemplateForLayout(li)">＋ 템플릿 추가</button></li>
            </ul>
          </li>
        </ul>
      </aside>

      <!-- Main: 템플릿 카드 그리드 -->
      <section class="main-pane">
        <div class="layout-header">
          <h3>{{ currentLayout.name }}</h3>
          <div class="header-controls">
            <select v-model="currentPeriodType" @change="onPeriodTypeChange">
              <option value="연간">연간</option>
              <option value="월간">월간</option>
            </select>

            <select v-model="currentSelectedYear" @change="applyPeriodAndReload">
              <option v-for="y in years" :key="y" :value="y">{{ y }}년</option>
            </select>

            <select v-if="currentPeriodType === '월간'" v-model="currentSelectedMonth" @change="applyPeriodAndReload">
              <option v-for="m in months" :key="m" :value="m.padStart(2,'0')">{{ m.padStart(2,'0') }}월</option>
            </select>

            <BaseButton type="primary" size="sm" @click="shareReport">PDF</BaseButton>
          </div>
        </div>

        <!-- 섹션 제목: templateId에 따라 동적으로 렌더링 (전체요약 제외) -->
        <h4 v-if="sectionTitle" class="section-title">{{ sectionTitle }}</h4>

        <!-- 템플릿 ID에 따라 적절한 그리드 컴포넌트를 동적으로 렌더링합니다. -->
        <component :is="gridComponent" :widgets="_currentSelectedTemplate?.widgets || []" />
      </section>
    </div>

    <!-- 레이아웃 추가 모달 -->
    <CreateLayoutModal
      :visible="showCreateLayout"
      @close="showCreateLayout = false"
      @create="async (payload) => {
         try {
           const desiredName = String(payload?.name ?? '').trim()
           if (!desiredName) {
             toast?.showToast('레이아웃 이름을 입력해주세요.', 'error')
             return
           }
           if (layouts.some(l => (l.name || '').trim() === desiredName)) {
             toast?.showToast('이미 존재하는 레이아웃 이름입니다.', 'error')
             return
           }
           const createPayload = {
             ...payload,
             name: desiredName,
             visibilityScope: 'PRIVATE',
             employeeCode: auth?.employeeCode ?? 1,
             isDefault: false,
           }
           await createLayout(createPayload)
           showCreateLayout = false
         } catch (e) {
           console.error(e)
         }
       }"
    />

    <!-- 템플릿 추가 모달 -->
    <CreateTemplateModal :visible="showCreateTemplate" :templates="availableTemplates" @close="showCreateTemplate = false" @add="confirmAddTemplate" />

    <!-- 템플릿 삭제 확인 모달 -->
    <!-- Listen to both 'confirm' and 'confirmed' to be resilient to modal emit name differences -->
    <ConfirmModal
      :visible="showDeleteTemplateModal"
      title="템플릿 삭제"
      message="템플릿을 삭제하시겠습니까?"
      @close="showDeleteTemplateModal = false"
      @confirm="handleDeleteTemplate"
      @confirmed="handleDeleteTemplate"
    />

    <!-- 레이아웃 삭제 모달 -->
    <ConfirmModal
      :visible="showDeleteModal"
      title="레이아웃 삭제"
      @close="showDeleteModal = false"
      @confirm="confirmDelete"
    >
        <div>레이아웃을 삭제하시겠습니까?</div>
    </ConfirmModal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import BaseButton from '@/components/common/button/BaseButton.vue'
import TemplateGrid from '@/components/report/TemplateGrid.vue'
import OPSTemplateGrid from '@/views/report/OPS/OPSTemplateGrid.vue' // 객실운영 템플릿
import CUSTTemplateGrid from '@/views/report/CUST/CUSTTemplateGrid.vue' // 고객현황 템플릿
import CXTemplateGrid from '@/views/report/CX/CXTemplateGrid.vue' // 고객경험 템플릿
import REVTemplateGrid from '@/views/report/REV/REVTemplateGrid.vue' // 예약및매출 템플릿
import CreateLayoutModal from '@/components/report/modals/CreateLayoutModal.vue'
import CreateTemplateModal from '@/components/report/modals/CreateTemplateModal.vue'
import ConfirmModal from '@/components/report/modals/ConfirmModal.vue'
import SummaryTemplateGrid from '@/components/report/SummaryTemplateGrid.vue'
import { useReportLayouts } from '@/composables/useReportLayouts'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

 // composable state & actions
const {
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
  // per-layout bindings (computed refs)
  currentPeriodType,
  currentSelectedYear,
  currentSelectedMonth,
  loadLayouts,
  loadTemplatesForLayout,
  loadWidgetsForTemplate,
  createLayout,
  deleteLayout,
  applyPeriodToLayout,
  addTemplate,
  deleteTemplate,
} = useReportLayouts()

const auth = useAuthStore?.()
const toast = useToastStore?.()

// NOTE: Do not set per-layout period defaults here — that would overwrite each layout's saved defaultFilterJson.
// Per-layout period values are loaded from each layout's `defaultFilterJson` when `currentLayout` is selected.

// local UI state (modals / loading)
const creatingLayout = ref(false)
const creatingTemplate = ref(false)
const showCreateLayout = ref(false)
const newLayoutName = ref('')
const newLayoutDescription = ref('')
const selectedVisibility = ref('PRIVATE')

const showCreateTemplate = ref(false)

// 사용 가능한 템플릿 목록 (임시 샘플). CreateTemplateModal에 전달됩니다.
const availableTemplates = [
  { templateId: 1, displayName: '전체 요약 템플릿', sortOrder: 1, isActive: true },
  { templateId: 2, displayName: '객실운영 요약 템플릿', sortOrder: 2, isActive: true },
  { templateId: 3, displayName: '고객현황 요약 템플릿', sortOrder: 3, isActive: true },
  { templateId: 4, displayName: '고객경험 요약 템플릿', sortOrder: 4, isActive: true },
  { templateId: 5, displayName: '예약및매출 요약 템플릿', sortOrder: 5, isActive: true },
]

// 왼쪽 리스트의 + 버튼 클릭 시 모달 오픈
function openCreateTemplate(){ showCreateTemplate.value = true }

const showDeleteTemplateModal = ref(false)
const deleteTemplateIndex = ref(-1)
const deletingTemplate = ref(false)

const showDeleteModal = ref(false)
const selectedLayoutId = ref(null)
const deletingLayout = ref(false)

function openCreateLayout(){ newLayoutName.value=''; newLayoutDescription.value=''; selectedVisibility.value='PRIVATE'; showCreateLayout.value = true }

// Open Create Template modal for a specific layout index (used by sidebar + buttons)
function openCreateTemplateForLayout(li){
  try{
    if (typeof li === 'number' && li >= 0 && li < layouts.value.length) {
      selectedIndex.value = li
      // default template selection when opening
      selectedTemplateIndex.value = 0
      const layout = layouts.value[li]
      if (layout && layout.id && (!Array.isArray(layout.templates) || layout.templates.length === 0)) {
        // load templates in background so modal opens immediately
        loadTemplatesForLayout(layout.id, li).catch(e => console.warn('loadTemplatesForLayout failed', e))
      }
    }
  }catch(e){ console.warn('openCreateTemplateForLayout error', e) }
  showCreateTemplate.value = true
}

async function handleCreateLayout(){
   if (creatingLayout.value) return
   creatingLayout.value = true
   try{
     const employeeCode = auth?.employeeCode ?? 1
     // use per-layout selectors when creating layout
     const presetToUse = (currentPeriodType && currentPeriodType.value === '월간') ? 'MONTH' : 'YEAR'
     const period = presetToUse === 'MONTH'
       ? `${(currentSelectedYear && currentSelectedYear.value) || selectedYear.value}-${String((currentSelectedMonth && currentSelectedMonth.value) || selectedMonth.value).padStart(2,'0')}`
       : `${(currentSelectedYear && currentSelectedYear.value) || selectedYear.value}`
     // 입력값 검증
     const desiredName = (newLayoutName.value || '').trim()
     if (!desiredName) {
       toast?.showToast('레이아웃 이름을 입력해주세요.', 'error')
       creatingLayout.value = false
       return
     }
     if (layouts.value.some(l => (l.name || '').trim() === desiredName)) {
       toast?.showToast('이미 존재하는 레이아웃 이름입니다.', 'error')
       creatingLayout.value = false
       return
     }

     const payload = {
       employeeCode,
       name: desiredName,
       description: newLayoutDescription.value,
       isDefault: false,
       visibilityScope: selectedVisibility.value,
       dateRangePreset: presetToUse,
       defaultFilterJson: { periodType: presetToUse, period }
     }
     await createLayout(payload)
     showCreateLayout.value = false
   } catch(e){ console.error(e) }
   finally{ creatingLayout.value = false }
 }

function selectLayout(i){
   selectedIndex.value = i
   selectedTemplateIndex.value = 0
   const layout = layouts.value[i]
   if (layout && layout.id) loadTemplatesForLayout(layout.id, i)
 }

const onSelectTemplateLocal = async (li, ti) => {
  // Update selection indexes immediately for responsive UI
  selectedIndex.value = li
  selectedTemplateIndex.value = ti

  const layout = layouts.value[li]
  const existingTemplates = layout?.templates

  // If templates already present and requested index exists, avoid reloading the templates list
  if (Array.isArray(existingTemplates) && existingTemplates.length > 0 && existingTemplates[ti]) {
    const tpl = existingTemplates[ti]
    try {
      await loadWidgetsForTemplate(tpl)
    } catch (e) {
      console.warn('loadWidgetsForTemplate failed', e)
    }
    return
  }

  // Otherwise request templates from server and request widgets for the desired index when loaded
  if (layout && layout.id) {
    try {
      await loadTemplatesForLayout(layout.id, li, ti)
    } catch (e) {
      console.warn('loadTemplatesForLayout failed', e)
    }
    const tpl = layouts.value[li]?.templates?.[ti]
    if (tpl) {
      try { await loadWidgetsForTemplate(tpl) } catch (e) { console.warn('loadWidgetsForTemplate failed', e) }
    }
  }
}

function onSelectTemplate(idx){
   selectedTemplateIndex.value = idx
   const tpl = currentLayout.value?.templates?.[idx]
   if (tpl) loadWidgetsForTemplate(tpl)
 }

function onPeriodTypeChange(){
  if (currentPeriodType.value === '연간') currentSelectedMonth.value = String(new Date().getMonth() + 1)
  // 기간 타입 변경 시 현재 레이아웃의 기본기간을 업데이트하고 선택된 템플릿의 위젯을 다시 로드
  applyPeriodAndReload()
}

 // Non-blocking PDF generator: run in background, do not change UI selection or render DOM
const pdfGenerating = ref(false)
function shareReport(){
  if (pdfGenerating.value) { toast?.showToast('이미 PDF 생성 작업이 진행중입니다.', 'info'); return }
  pdfGenerating.value = true
  toast?.showToast('PDF 생성 작업을 백그라운드에서 시작했습니다. 완료되면 다운로드됩니다.', 'info')

  // background async task (do not await) — keeps UI responsive
  ;(async () => {
    try {
      const exportLayouts = Array.isArray(layouts.value) ? JSON.parse(JSON.stringify(layouts.value)) : []

      // For each layout, ensure templates/widgets are available by fetching data via composable functions
      for (let li = 0; li < exportLayouts.length; li++) {
        const layout = exportLayouts[li]
        if (!layout) continue
        try {
          // fetch templates if missing
          if (!Array.isArray(layout.templates) || layout.templates.length === 0) {
            const resIdx = layouts.value.findIndex(l=>l.id===layout.id)
            await loadTemplatesForLayout(layout.id, resIdx !== -1 ? resIdx : undefined)
            // read back into our local copy
            const fresh = layouts.value.find(l=>l.id===layout.id)
            layout.templates = fresh ? JSON.parse(JSON.stringify(fresh.templates || [])) : []
          }
          // fetch widgets for each template (without touching UI selection)
          for (let ti = 0; ti < (layout.templates || []).length; ti++){
            const tpl = layout.templates[ti]
            try { await loadWidgetsForTemplate(tpl) } catch(e){ console.warn('loadWidgetsForTemplate failed', e) }
            // small yield to keep event loop free
            await new Promise(r=>setTimeout(r,50))
          }
        } catch(e){ console.warn('fetching layout/templates/widgets failed', e) }
        await new Promise(r=>setTimeout(r,50))
      }

      // Build a simple PDF from data (titles + widget summaries) — avoids DOM rendering and html2canvas
      const pdf = new jsPDF('p','mm','a4')
      const margin = 12
      const pageWidth = pdf.internal.pageSize.getWidth()
      const usable = pageWidth - margin * 2
      let y = 14
      pdf.setFontSize(14)
      pdf.text('Report Export', margin, y)
      y += 8
      pdf.setFontSize(10)

      for (const layout of exportLayouts) {
        if (y > 280) { pdf.addPage(); y = 14 }
        pdf.setDrawColor(220)
        pdf.setFillColor(245)
        pdf.rect(margin-2, y-6, usable+4, 8, 'F')
        pdf.setTextColor(20)
        pdf.setFontSize(12)
        pdf.text(`Layout: ${layout.name || ''}`, margin, y)
        y += 6
        pdf.setFontSize(10)
        const templates = layout.templates || []
        if (!templates.length) {
          pdf.text('  (템플릿 없음)', margin, y); y += 6; continue
        }
        for (const tpl of templates) {
          if (y > 280) { pdf.addPage(); y = 14 }
          pdf.setFontSize(11)
          pdf.text(`- Template: ${tpl.displayName || tpl.name || tpl.templateId || tpl.id}`, margin+4, y)
          y += 5
          // list widget keys/titles as bullets
          const widgets = tpl.widgets || []
          if (!widgets.length) {
            pdf.setFontSize(9); pdf.text('    (위젯 없음)', margin+8, y); y += 5; continue
          }
          for (const w of widgets) {
            if (y > 280) { pdf.addPage(); y = 14 }
            const title = (w.title || w.widgetName || w.widgetKey || JSON.stringify(w).slice(0,40))
            pdf.setFontSize(9)
            pdf.text(`    • ${String(title)}`, margin+8, y)
            y += 4
          }
          y += 4
        }
        y += 6
      }

      const now = new Date(); const pad = n=>String(n).padStart(2,'0')
      const fileName = `report_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.pdf`
      try { pdf.save(fileName); toast?.showToast('PDF 생성이 완료되었습니다.', 'success') } catch(e){ console.warn('pdf save failed', e); toast?.showToast('PDF 저장 중 오류가 발생했습니다.', 'error') }
    } catch (e) {
      console.error('Background PDF generation failed', e)
      toast?.showToast('PDF 생성 중 오류가 발생했습니다.', 'error')
    } finally {
      pdfGenerating.value = false
    }
  })()
}

// Template add/delete wrappers
 async function confirmAddTemplate(tpl){
   if (creatingTemplate.value) return
   creatingTemplate.value = true
   try{
     const layoutIndex = selectedIndex.value
     const layout = layouts.value[layoutIndex]
     // 중복 확인: templateId 기준 우선, 없으면 displayName 기준
     const exists = !!(layout?.templates?.some(t => {
       if (t.templateId !== undefined && t.templateId !== null) return t.templateId === tpl.templateId
       const tName = (t.name || t.displayName || '').trim()
       return tName && tName === (tpl.displayName || '').trim()
     }))
     if (exists) {
       toast?.showToast('이미 존재하는 템플릿입니다.', 'error')
       creatingTemplate.value = false
       return
     }

     const dto = { templateId: tpl.templateId, displayName: tpl.displayName, sortOrder: tpl.sortOrder, isActive: tpl.isActive }
     await addTemplate(layoutIndex, dto, auth?.employeeCode ?? 1)
     showCreateTemplate.value = false
   } catch(e){ console.error(e) }
   finally{ creatingTemplate.value = false }
 }

function confirmDeleteTemplate(idx){ deleteTemplateIndex.value = idx; showDeleteTemplateModal.value = true }

// Local delete helper used by sidebar per-layout delete buttons. Ensures layout selection and template index are set before opening modal.
function confirmDeleteTemplateLocal(li, ti){
  selectedIndex.value = li
  deleteTemplateIndex.value = ti
  showDeleteTemplateModal.value = true
}

// 실제 템플릿 삭제 처리: ConfirmModal에서 @confirm으로 호출됩니다.
async function handleDeleteTemplate(){
  if (deletingTemplate.value) return
  deletingTemplate.value = true
  try{
    const li = selectedIndex.value
    const ti = deleteTemplateIndex.value
    console.log('handleDeleteTemplate called', { li, ti })
    // deleteTemplate(layoutIndex, templateIndex)
    await deleteTemplate(li, ti)
    // reload templates for current layout to ensure UI sync and set selection to previous index
    const layout = layouts.value[li]
    if (layout && layout.id) {
      try { await loadTemplatesForLayout(layout.id, li, Math.max(0, ti - 1)) } catch(e) { console.warn('reload templates after delete failed', e) }
    }
  } catch(e){
    console.error('handleDeleteTemplate error', e)
  } finally {
    showDeleteTemplateModal.value = false
    deleteTemplateIndex.value = -1
    deletingTemplate.value = false
  }
}

// Layout delete
function openDeleteModal(layout){
  console.log('openDeleteModal', layout)
  selectedLayoutId.value = layout?.id ?? null; showDeleteModal.value = true
}

async function confirmDelete(){
  const id = selectedLayoutId.value
  console.log('Delete layout id' + id)
  if (id === null || id === undefined) {
    showDeleteModal.value = false
    selectedLayoutId.value = null
    return
  }
  if (deletingLayout.value) return
  deletingLayout.value = true
  try{
    await deleteLayout(id)
  } catch(e){ console.error(e) }
  finally{ showDeleteModal.value = false; selectedLayoutId.value = null; deletingLayout.value = false }
}

// 기본 레이아웃 이름 생성: 기존 레이아웃 이름에서 숫자 suffix를 찾아 다음 번호로 생성
function generateNextLayoutName(){
  const prefix = '레이아웃'
  const nums = layouts.value
    .map(l => (l.name || '').trim())
    .map(n => {
      const m = n.match(new RegExp(`^${prefix}\\s*(\\d+)$`))
      return m ? Number(m[1]) : null
    })
    .filter(x => x !== null)
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `${prefix} ${next}`
}

// Robust selection: derive currently selected template from currentLayout + selectedTemplateIndex
const _currentSelectedTemplate = computed(() => {
  // prefer currentLayout + selectedTemplateIndex (composable maintains these per-layout)
  const layout = (currentLayout && currentLayout.value) ? currentLayout.value : currentLayout
  const idx = (selectedTemplateIndex && typeof selectedTemplateIndex.value !== 'undefined') ? selectedTemplateIndex.value : selectedTemplateIndex
  let tpl = layout?.templates?.[idx]
  // fallback to composable's selectedTemplate ref if present
  if (!tpl && selectedTemplate) {
    tpl = (selectedTemplate.value && selectedTemplate.value[0]) ? selectedTemplate.value[0] : selectedTemplate[0]
  }
  return tpl || null
})

const gridComponent = computed(() => {
  const tpl = _currentSelectedTemplate.value
  const tplId = tpl?.templateId ?? tpl?.id
  if (tplId === 1) return SummaryTemplateGrid
  if (tplId === 2) return OPSTemplateGrid
  if (tplId === 3) return CUSTTemplateGrid
  if (tplId === 4) return CXTemplateGrid
  if (tplId === 5) return REVTemplateGrid
  return TemplateGrid
})

// 섹션 제목 매핑: templateId -> 한글 소제목 (uses same reliable source)
const sectionTitle = computed(() => {
  const tpl = _currentSelectedTemplate.value
  const tplId = tpl?.templateId ?? tpl?.id
  const map = {
    1: '전체요약',
    2: '객실운영',
    3: '고객현황',
    4: '고객경험',
    5: '예약및매출'
  }
  return map[tplId] || ''
})

onMounted(() => { loadLayouts() })

 // 기간 적용 후 현재 선택된 템플릿의 위젯을 재로딩
 async function applyPeriodAndReload(){
   try{
     // composable에 기간 적용
     applyPeriodToLayout()
     // 현재 선택된 템플릿 가져와서 위젯 로드
     const tpl = currentLayout.value?.templates?.[selectedTemplateIndex.value]
     if (tpl) await loadWidgetsForTemplate(tpl)
   } catch(e){
     console.error('applyPeriodAndReload error', e)
   }
 }

</script>

<style scoped>
.layout-page { display:flex; flex-direction:column; height:100vh; }
.content-area { flex:1; display:flex; overflow:hidden; }

/* Sidebar (refreshed styles) */
.sidebar {
  width:300px;
  min-width:260px;
  background: linear-gradient(180deg,#ffffff 0%, #fbfdff 100%);
  border-right: 1px solid #eef3fb;
  padding: 12px;
  overflow-y: auto;
  box-shadow: 0 1px 0 rgba(20,40,80,0.02) inset;
}
.sidebar-header {
  display:flex; align-items:center; justify-content:space-between; gap:8px;
  padding:12px; margin-bottom:8px; border-radius:8px;
  background: linear-gradient(180deg, rgba(240,248,255,0.6), rgba(245,250,255,0.4));
}
.sidebar-title { font-weight:700; font-size:15px; color:#0f1724 }
.sidebar-actions { display:flex; gap:8px }
.add-layout-btn {
  padding:8px 12px; font-size:13px; color:#0757d1; background:#eaf3ff; border:1px solid #cfe6ff;
  border-radius:8px; cursor:pointer; box-shadow:0 1px 2px rgba(10,30,80,0.04);
}
.add-layout-btn:hover { transform:translateY(-1px); }
.layouts-list { list-style:none; padding:6px; margin:0; }
.layout-item { padding:8px; margin-bottom:8px; border-radius:10px; transition:all .12s ease; }
.layout-item.is-active { background:#f0f7ff; border:1px solid #d8ecff; box-shadow: 0 4px 10px rgba(14,56,114,0.04); }
.layout-row { display:flex; align-items:center; justify-content:space-between; gap:8px }
.layout-select { display:flex; align-items:center; gap:10px; border:none; background:transparent; padding:6px; text-align:left; width:100%; cursor:pointer }
.chev { font-size:12px; color:#0b61ff; width:20px; text-align:center }
.layout-text { display:flex; flex-direction:column }
.layout-name { font-weight:600; color:#08203a }
.layout-desc { font-size:12px; color:#6b7280; margin-top:4px }
.layout-controls { display:flex; gap:6px }
.icon-btn { border:none; background:#fff; padding:6px; border-radius:8px; cursor:pointer; font-size:14px }
.icon-btn:hover { background:#f4f8ff }
.icon-btn.danger { color:#c43b3b }
.templates-sublist { list-style:none; padding:6px 6px 6px 16px; margin-top:8px; background:transparent }
.template-item { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px; border-radius:8px }
.template-select { display:flex; align-items:center; gap:8px; border:none; background:transparent; padding:6px; cursor:pointer; width:100%; text-align:left }
.template-item.is-active .template-select { background:#eef7ff; border-radius:8px }
.tpl-dot { color:#3b82f6; font-size:10px }
.tpl-text { color:#0f1724 }
.template-del { border:none; background:transparent; color:#64748b; cursor:pointer; padding:6px }
/* make the delete button a bit wider for easier clicking */
.template-del { min-width:64px; padding:6px 10px; text-align:center; border-radius:6px }
.template-del:active { transform: translateY(1px) }
.template-del:hover { color:#0b61ff }
.add-template-btn { width:100%; border:1px dashed #dbeeff; background:transparent; padding:8px; border-radius:8px; cursor:pointer }

.header-controls { display:flex; gap:8px; align-items:center; margin-top:8px }
.header-controls select { padding:8px; font-size:14px; border:1px solid #e6eef8; border-radius:6px; background:#fff }
.main-pane { flex:1; padding:20px; overflow-y:auto; }
.layout-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px }
.layout-header h3 { font-size:20px; font-weight:600; margin:0 }
.section-title { font-size:20px; font-weight:600; margin:20px 0; text-align:center; color:#0b2440 }
</style>
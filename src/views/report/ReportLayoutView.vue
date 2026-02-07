<template>
  <div class="layout-page">
    <!-- Top: layout tabs with + 버튼 -->
    <ReportTopTabs
      :layouts="layouts"
      :selectedIndex="selectedIndex"
      @select="selectLayout"
      @create="openCreateLayout"
      @delete="openDeleteModal"
    />

    <div class="content-area">
      <!-- Left: 레이아웃 내 템플릿 리스트 -->
      <TemplateList :templates="currentLayout.templates" :selectedIndex="selectedTemplateIndex" @select="onSelectTemplate" @add="openCreateTemplate" @delete="confirmDeleteTemplate" />

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
        <component :is="gridComponent" :widgets="selectedTemplate[0]?.widgets || []" />
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
    <ConfirmModal :visible="showDeleteTemplateModal" title="템플릿 삭제" message="템플릿을 삭제하시겠습니까?" @close="showDeleteTemplateModal = false" @confirm="handleDeleteTemplate" />

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
import ReportTopTabs from '@/components/report/ReportTopTabs.vue'
import TemplateList from '@/components/report/TemplateList.vue'
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

 // 기본 기간을 월간(2026-01)으로 설정: 레이아웃별 기본 필터에 반영
try {
  if (currentPeriodType) currentPeriodType.value = '월간'
  if (currentSelectedYear) currentSelectedYear.value = '2026'
  if (currentSelectedMonth) currentSelectedMonth.value = '01'
} catch (e) {
  console.warn('기본 기간 설정 실패', e)
}

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

async function shareReport() {
   try {
     // 캡처할 영역: 전체 콘텐츠 영역 또는 메인 패널
     const el = document.querySelector('.content-area') || document.querySelector('.main-pane')
     if (!el) {
       console.error('PDF 생성 대상 엘리먼트를 찾을 수 없습니다.')
       return
     }

     // 렌더 안정화를 위해 잠깐 대기(애니메이션/폰트 로드 등)
     await new Promise(r => setTimeout(r, 250))

     // html2canvas로 캡처 (useCORS: 외부 이미지가 있을 경우 서버에서 CORS 허용 필요)
     const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
     const imgData = canvas.toDataURL('image/png')

     // PDF 생성: A4 portrait
     const pdf = new jsPDF('p', 'mm', 'a4')
     const pageWidth = pdf.internal.pageSize.getWidth()
     const pageHeight = pdf.internal.pageSize.getHeight()

     // 이미지 실제 크기(mm) 계산
     const imgProps = pdf.getImageProperties(imgData)
     const imgWidthMM = pageWidth - 20 // 좌우 여백 10mm씩
     const imgHeightMM = (imgProps.height * imgWidthMM) / imgProps.width

     // 여러 페이지로 분할하여 추가
     let heightLeft = imgHeightMM
     let position = 10 // 상단 여백 10mm
     let pageNum = 0
     while (heightLeft > 0) {
       if (pageNum > 0) pdf.addPage()
       pdf.addImage(imgData, 'PNG', 10, position, imgWidthMM, imgHeightMM)
       heightLeft -= pageHeight - 20 // 페이지당 내용 영역에서 여백 고려
       position -= pageHeight - 20
       pageNum++
     }

     const period = currentPeriodType.value === '월간' ? `${currentSelectedYear.value}-${String(currentSelectedMonth.value).padStart(2,'0')}` : `${currentSelectedYear.value}`
     const name = `report_${period}_${new Date().toISOString().replace(/[:.]/g,'-')}.pdf`
     pdf.save(name)
   } catch (e) {
     console.error('PDF 생성 실패', e)
   }
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

async function handleDeleteTemplate(){
   if (deletingTemplate.value) return
   deletingTemplate.value = true
   try{
     await deleteTemplate(selectedIndex.value, deleteTemplateIndex.value)
   } catch(e){ console.error(e) }
   finally{
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

   // 이전: if (!id) { ... } 형태는 id가 0일 때도 삭제를 막음
   // 수정: id가 null 또는 undefined 일 때만 조기 종료
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
       const m = n.match(new RegExp(`^${prefix}\s*(\\d+)$`))
       return m ? Number(m[1]) : null
     })
     .filter(x => x !== null)
   const next = nums.length ? Math.max(...nums) + 1 : 1
   return `${prefix} ${next}`
 }

// 컴포넌트 선택 로직: selectedTemplate의 첫 번째 항목(templateId)을 보고 그리드 컴포넌트를 결정
 const gridComponent = computed(() => {
   // selectedTemplate은 composable에서 제공되는 ref나 reactive 객체일 수 있으므로 안전하게 접근
   const tpl = (selectedTemplate && selectedTemplate.value) ? selectedTemplate.value[0] : selectedTemplate[0]
   const tplId = tpl?.templateId ?? tpl?.id
   // templateId에 따라 전용 그리드 컴포넌트를 선택 (1: SUMMARY, 2: OPS, 3: CUST, 4: CX)
   if (tplId === 1) return SummaryTemplateGrid
   if (tplId === 2) return OPSTemplateGrid
   if (tplId === 3) return CUSTTemplateGrid
   if (tplId === 4) return CXTemplateGrid
   if (tplId === 5) return REVTemplateGrid
   return TemplateGrid
 })

 // 섹션 제목 매핑: templateId -> 한글 소제목
 const sectionTitle = computed(() => {
   const tpl = (selectedTemplate && selectedTemplate.value) ? selectedTemplate.value[0] : selectedTemplate[0]
   const tplId = tpl?.templateId ?? tpl?.id
   const map = {
     1: '전체요약',
     2: '객실운영',
     3: '고객현황',
     4: '고객경험',
     5: '예약및매출'
   }
   // 전체요약은 SummaryTemplateGrid 내부 섹션을 가지고 있으나 상단의 총제목도 표시함
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
.layout-page {
   display: flex;
   flex-direction: column;
   height: 100vh;
 }

 .content-area {
   flex: 1;
   display: flex;
   overflow: hidden;
 }

 .main-pane {
   flex: 1;
   padding: 16px;
   overflow-y: auto;
 }

 .layout-header {
   display: flex;
   justify-content: space-between;
   align-items: center;
   margin-bottom: 16px;
 }

 .header-controls {
   display: flex;
   gap: 8px;
 }

 .layout-page select {
   padding: 8px;
   font-size: 14px;
 }

 .layout-page h3 {
   margin: 0;
   font-size: 24px;
 }

 .layout-page button {
   margin-left: 8px;
 }

 .section-title {
   margin: 16px 0 8px;
   font-size: 18px;
   font-weight: 500;
   color: #333;
   text-align: center;
   width: 100%;
 }
 </style>
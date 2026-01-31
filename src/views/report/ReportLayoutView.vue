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
            <select v-model="periodType" @change="onPeriodTypeChange">
              <option value="연간">연간</option>
              <option value="월간">월간</option>
            </select>

            <select v-model="selectedYear" @change="applyPeriodAndReload">
              <option v-for="y in years" :key="y" :value="y">{{ y }}년</option>
            </select>

            <select v-if="periodType === '월간'" v-model="selectedMonth" @change="applyPeriodAndReload">
              <option v-for="m in months" :key="m" :value="m">{{ m }}월</option>
            </select>

            <BaseButton type="primary" size="sm" @click="shareReport">공유</BaseButton>
          </div>
        </div>

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
          // 생성시 기본 조회 권한을 'PRIVATE'으로 강제하여
          // 만든 사용자만 볼 수 있도록 변경
          // 이름이 비어있거나 기존 이름과 겹치면 자동으로 다음 이름을 생성
          let desiredName = payload?.name?.trim()
          if (!desiredName || layouts.value.some(l => (l.name || '').trim() === desiredName)) {
            desiredName = generateNextLayoutName()
          }

          const createPayload = {
            ...payload,
            name: desiredName,
            visibilityScope: 'PRIVATE',
            employeeCode: auth?.employeeCode ?? 1,
            isDefault: false,
            dateRangePreset: periodType.value === '월간' ? 'MONTH' : 'YEAR',
            defaultFilterJson: {
              periodType: periodType.value === '월간' ? 'MONTH' : 'YEAR',
              period: periodType.value === '월간' ? `${selectedYear.value}-${String(selectedMonth.value).padStart(2,'0')}` : `${selectedYear.value}`
            }
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
import BaseButton from '@/components/common/button/BaseButton.vue'
import BaseModal from '@/components/common/modal/BaseModal.vue'
import TemplateGrid from '@/components/report/TemplateGrid.vue'
import OPSTemplateGrid from '@/views/report/OPS/OPSTemplateGrid.vue' // 객실운영 템플릿
import ReportTopTabs from '@/components/report/ReportTopTabs.vue'
import TemplateList from '@/components/report/TemplateList.vue'
import CreateLayoutModal from '@/components/report/modals/CreateLayoutModal.vue'
import CreateTemplateModal from '@/components/report/modals/CreateTemplateModal.vue'
import ConfirmModal from '@/components/report/modals/ConfirmModal.vue'
import { useReportLayouts } from '@/composables/useReportLayouts'
import { useAuthStore } from '@/stores/authStore'

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
    const preset = periodType.value === '월간' ? 'MONTH' : 'YEAR'
    const period = preset === 'MONTH' ? `${selectedYear.value}-${String(selectedMonth.value).padStart(2,'0')}` : `${selectedYear.value}`
    const payload = {
      employeeCode,
      name: newLayoutName.value || `레이아웃 ${layouts.value.length + 1}`,
      description: newLayoutDescription.value,
      isDefault: false,
      visibilityScope: selectedVisibility.value,
      dateRangePreset: preset,
      defaultFilterJson: { periodType: preset, period }
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
  if (periodType.value === '연간') selectedMonth.value = String(new Date().getMonth() + 1)
  // 기간 타입 변경 시 선택된 템플릿의 위젯을 다시 로드
  applyPeriodAndReload()
}

function shareReport(){ console.log('공유 클릭:', { periodType: periodType.value, year: selectedYear.value, month: selectedMonth.value }) }

// Template add/delete wrappers
async function confirmAddTemplate(tpl){
  if (creatingTemplate.value) return
  creatingTemplate.value = true
  try{
    const layoutIndex = selectedIndex.value
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
  // 현재는 templateId === 2 이면 OPS 전용 그리드 사용, 그 외는 기본 그리드 사용
  return tplId === 2 ? OPSTemplateGrid : TemplateGrid
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
.layout-page { display:flex; flex-direction:column; gap:12px; }
.top-tabs { display:flex; gap:8px; align-items:center; padding:6px 10px; }
.top-tab { padding:8px 14px; border-radius:8px; background:#f5f7fb; color:#4b5563; cursor:pointer; }
.top-tab.active { background: linear-gradient(135deg,#e6f0ff,#dfeaff); color:#1e3a8a; font-weight:600 }
.add-tab { margin-left:6px }

.content-area { display:flex; gap:12px; }
.left-pane { width:200px; display:flex; flex-direction:column; align-items:flex-start; }
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

.main-pane { flex:1; overflow:auto; padding:12px 18px; box-sizing:border-box }
.layout-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px }
/* Header controls on the right */
.header-controls { display:flex; gap:8px; align-items:center }
.header-controls select { padding:6px 8px; border-radius:6px; border:1px solid #dfe6f3; background:#fff }

/* Make the grid place cards as direct children. If .template-widgets wrapper exists, make its children participate in grid. */
.template-widgets { display: contents; }

.template-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;    /* 칸 높이 동일화 */
  width: 100%;
  /* 고정된 균일한 카드 높이(최소)와 같은 행에서 균등하게 확장 */
  grid-auto-rows: minmax(140px, 1fr);
  align-content: start;
}
.card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;            /* grid-auto-rows가 정한 높이를 채움 */
  padding: 12px 10px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
  box-sizing: border-box;
  text-align: center;
  min-width: 0;
}
.card-title { font-weight:700; margin-bottom:8px; font-size:14px }
.available-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f3f4f6 }

.create-layout-form { display:flex; flex-direction:column; gap:12px; min-width:520px }
.form-row { display:flex; gap:12px; align-items:flex-start }
.form-label { width:110px; color:#374151; font-weight:600 }
.radio-group { display:flex; gap:12px; align-items:center }
.radio-group label { display:flex; gap:6px; align-items:center }
.create-layout-form input[type="text"], .create-layout-form textarea { flex:1; padding:8px; border:1px solid #e5e7eb; border-radius:6px }

.kpi-value { font-size:20px; font-weight:800; margin-bottom:6px; word-break:keep-all }
.kpi-target { color:#6b7280; font-size:12px }
.kpi-delta { font-size:12px; margin-top:6px }
.delta-up { color:#0ea5a0 } /* green */
.delta-down { color:#ef4444 } /* red */
.delta-neutral { color:#6b7280 } /* gray */

/* 반응형: 작은 화면에서는 열 수 축소 */
@media (max-width: 1100px) {
  .template-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .template-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .left-pane { width: 140px }
}
@media (max-width: 420px) {
  .template-grid { grid-template-columns: 1fr; }
  .left-pane { display:none }
}
</style>
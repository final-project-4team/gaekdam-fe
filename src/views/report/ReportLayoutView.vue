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
        <span @click.stop>
          <BaseButton size="sm" type="danger" @click="confirmDeleteLayout(i)">✕</BaseButton>
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
              <BaseButton size="sm" type="danger" @click="confirmDeleteTemplate(idx)">✕</BaseButton>
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
        </div>

        <div class="template-grid">
          <div class="card" v-for="(t, idx) in currentLayout.templates" :key="t.id">
            <div class="card-title">{{ t.name }}</div>
            <div class="card-body">템플릿 콘텐츠 예시</div>
          </div>
        </div>
      </section>
    </div>

    <!-- 레이아웃 추가 모달 -->
    <BaseModal v-if="showCreateLayout" title="레이아웃 추가" @close="showCreateLayout = false">
      <div>
        <input v-model="newLayoutName" placeholder="레이아웃 이름" />
        <div style="margin-top:12px; text-align:right">
          <BaseButton @click="createLayout" type="primary">생성</BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- 템플릿 추가 모달 -->
    <BaseModal v-if="showCreateTemplate" title="템플릿 추가" @close="showCreateTemplate = false">
      <div class="available-list">
        <div v-for="tpl in availableTemplates" :key="tpl.id" class="available-row">
          <span>{{ tpl.name }}</span>
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
            <BaseButton type="danger" @click="deleteLayout">삭제</BaseButton>
        </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseButton from '@/components/common/button/BaseButton.vue'
import BaseModal from '@/components/common/modal/BaseModal.vue'

// 레이아웃 목록 (초기값 하나)
const layouts = ref([
  { id: 'layout-1', name: '기본 레이아웃', templates: [ { id: 'tpl1', name: '템플릿1' } ] },
])

const selectedIndex = ref(0)
const selectedTemplateIndex = ref(0)

const creatingLayout = ref(false)
const currentLayout = computed(() => layouts.value[selectedIndex.value] || { name: '', templates: [] })

const creatingTemplate = ref(false)

// 레이아웃 추가
const showCreateLayout = ref(false)
const newLayoutName = ref('')
const openCreateLayout = () => { newLayoutName.value = ''; showCreateLayout.value = true }
const createLayout = () => {
    // for log
    console.trace('createLayout called')
    console.log('createLayout called', new Date())

    // 한번만 실행하기
    if (creatingLayout.value) return
    creatingLayout.value = true

    const id = `layout-${Date.now()}`
    layouts.value.push({ id, name: newLayoutName.value || `레이아웃 ${layouts.value.length + 1}`, templates: [] })
    selectedIndex.value = layouts.value.length - 1
    showCreateLayout.value = false

    setTimeout(()=> creatingLayout.value = false, 300)
}

const selectLayout = (i) => {
  selectedIndex.value = i
  selectedTemplateIndex.value = 0
}

// 템플릿 추가
const availableTemplates = [
  { id: 'tpl1', name: '템플릿1' },
  { id: 'tpl2', name: '템플릿2' },
  { id: 'tpl3', name: '템플릿3' },
]

const showCreateTemplate = ref(false)
const openCreateTemplate = () => { showCreateTemplate.value = true }
const confirmAddTemplate = (tpl) => {
    if (creatingTemplate.value) return
    creatingTemplate.value = true

  // 현재 선택된 레이아웃에 템플릿 추가
  const copy = { ...tpl, id: `${tpl.id}-${Date.now()}` }
  layouts.value[selectedIndex.value].templates.push(copy)
  selectedTemplateIndex.value = layouts.value[selectedIndex.value].templates.length - 1
  showCreateTemplate.value = false

  setTimeout(()=> creatingTemplate.value = false, 300)
}

// 템플릿 삭제
const showDeleteTemplateModal = ref(false)
const deleteTemplateIndex = ref(-1)

const confirmDeleteTemplate = (idx) => {
  deleteTemplateIndex.value = idx
  showDeleteTemplateModal.value = true
}

const deleteTemplate = () => {
  const i = deleteTemplateIndex.value
  const templates = layouts.value[selectedIndex.value]?.templates || []
  if (i < 0 || i >= templates.length) { showDeleteTemplateModal.value = false; return }
  templates.splice(i, 1)
  // selectedTemplateIndex 보정
  if (templates.length === 0) {
    selectedTemplateIndex.value = 0
  } else {
    selectedTemplateIndex.value = Math.max(0, i - 1)
  }
  showDeleteTemplateModal.value = false
  deleteTemplateIndex.value = -1
}

// 레이아웃 삭제
const showDeleteModal = ref(false)
const deleteIndex = ref(-1)

const confirmDeleteLayout = (i) => {
  deleteIndex.value = i
  showDeleteModal.value = true
}

const deleteLayout = () => {
  const i = deleteIndex.value
  if (i < 0 || i >= layouts.value.length) { showDeleteModal.value = false; return }
  layouts.value.splice(i, 1)
  // selectedIndex 보정
  if (layouts.value.length === 0) {
    // 필요시 기본 레이아웃 자동 생성하거나 빈 상태 처리
    layouts.value.push({ id: `layout-${Date.now()}`, name: '기본 레이아웃', templates: [] })
    selectedIndex.value = 0
  } else {
    selectedIndex.value = Math.max(0, i - 1)
  }
  showDeleteModal.value = false
  deleteIndex.value = -1
}

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
.tpl-row { display:flex; align-items:center; gap:8px; }
.tpl-btn { flex:1; padding:8px; border-radius:8px; background:#f6f8fb; border:1px solid #e6eef8; cursor:pointer; text-align:left }
.tpl-btn.active { background: linear-gradient(135deg,#e6f0ff,#dfeaff); color:#12336a }
.tpl-delete { display:inline-flex }

.main-pane { flex:1 }
.layout-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px }
.template-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px }
.card { padding:18px; border:1px solid #eee; border-radius:8px; background:#fff; text-align:center }
.card-title { font-weight:700; margin-bottom:6px }
.available-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f3f4f6 }
</style>
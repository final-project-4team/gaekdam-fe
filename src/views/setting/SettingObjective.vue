<template>
  <div class="objective-page">
    <div class="page-header">
      <div class="filters">
        <select v-model="periodType" class="select-period">
          <option value="YEAR">연간</option>
          <option value="MONTH">월간</option>
        </select>

        <select v-if="periodType === 'YEAR'" v-model.number="year" class="select-year">
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>

        <div v-else class="select-month-wrap">
          <select v-model.number="year" class="select-year">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
          <select v-model.number="month" class="select-month">
            <option v-for="m in 12" :key="m" :value="m">{{ String(m).padStart(2, '0') }}</option>
          </select>
        </div>

        <BaseButton class="btn" @click="exportExcel">양식다운로드</BaseButton>
        <BaseButton class="btn" @click="showImportModal = true">엑셀입력</BaseButton>
      </div>

      <div class="actions">
        <BaseButton @click="resetForm">초기화</BaseButton>
        <BaseButton type="primary" @click="saveTargets">저장</BaseButton>
      </div>
    </div>

    <div class="kpi-grid">
      <div v-for="(kpi, idx) in kpis" :key="kpi.code" class="kpi-card">
        <div class="kpi-title">{{ kpi.name }}</div>
        <div class="kpi-input-row">
          <input
            v-model="targets[kpi.code]"
            class="kpi-input"
            type="text"
            :placeholder="kpi.placeholder || '목표값 입력'"
          />
          <div class="kpi-unit">{{ kpi.unit }}</div>
        </div>
      </div>
    </div>

    <BaseModal v-if="showImportModal" title="엑셀 입력" @close="showImportModal = false">
      <div class="import-body">
        <input type="file" accept=".xlsx,.xls" @change="onFileChange" />
        <p class="import-hint">양식에 맞는 엑셀 파일을 업로드해주세요.</p>
      </div>
      <template #footer>
        <BaseButton @click="showImportModal = false">취소</BaseButton>
        <BaseButton type="primary" @click="handleImport">업로드</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import BaseButton from '@/components/common/button/BaseButton.vue'
import BaseModal from '@/components/common/modal/BaseModal.vue'
import * as targetApi from '@/api/report/targetApi.js'

// Period state
const periodType = ref('YEAR')
const current = new Date()
const year = ref(current.getFullYear())
const month = ref(current.getMonth() + 1)
const years = computed(() => {
  const start = current.getFullYear() - 5
  return Array.from({ length: 11 }).map((_, i) => start + i)
})
const hotelGroupCode = 1 // 테스트: 실제는 authStore에서 가져오기
const existingTargets = ref({}) // kpiCode -> full response obj (targetId 등)

// make KPI definitions dynamic: fetch from backend (kpiCode, kpiName, unit, description)
import { ref as _ref } from 'vue'
const kpis = _ref([]) // will hold objects: { code, name, unit, description }

// Targets state keyed by kpi.code
const targets = reactive({})
// initialize targets when kpis are loaded
const initTargetsForKpis = () => {
  kpis.value.forEach(k => {
    if (!(k.code in targets)) targets[k.code] = ''
  })
}

const showImportModal = ref(false)
let importFile = ref(null)

// period format: use hyphen (YYYY-MM) to match backend validatePeriod
const formattedPeriod = computed(() => {
  return periodType.value === 'YEAR'
    ? String(year.value)
    : `${year.value}-${String(month.value).padStart(2, '0')}` // YYYY-MM
})

// load kpi metadata from backend
const loadKpiMeta = async () => {
  try {
    const list = await targetApi.listKpiCodes()
    // list items: { kpiCode, kpiName, unit, description }
    kpis.value = (list || []).map(i => ({ code: i.kpiCode, name: i.kpiName, unit: i.unit, description: i.description }))
    initTargetsForKpis()
  } catch (e) {
    console.warn('failed to load KPI meta', e)
  }
}

// load targets: call listByHotelGroup then client-side filter by period
const loadTargets = async () => {
  try {
    const raw = await targetApi.listByHotelGroup(hotelGroupCode)

    // unwrap ApiResponse wrapper if present
    let items = raw
    if (raw && raw.data) items = raw.data
    if (items && items.data) items = items.data
    if (!Array.isArray(items)) items = []

    // filter by selected period
    const filtered = items.filter(r => r.periodType === periodType.value && r.periodValue === formattedPeriod.value)

    // map existing targets for update/delete decisions
    existingTargets.value = {}
    filtered.forEach(r => {
      existingTargets.value[r.kpiCode] = r
    })

    // populate UI values
    kpis.value.forEach(k => {
      targets[k.code] = existingTargets.value[k.code]?.targetValue ?? ''
    })

    console.log(items.map(i => ({ kpiCode: i.kpiCode, period: i.periodValue, targetValue: i.targetValue})))

  } catch (e) {
    console.error(e)
    alert('목표값 불러오기에 실패했습니다.')
  }
}

// save targets: for each KPI, create (POST) if no existing targetId, otherwise PATCH
const saveTargets = async () => {
  try {
    const jobs = []

    for (const k of kpis.value) {
      const code = k.code
      const raw = targets[code]

      const value = (raw === '' || raw == null) ? null : Number(String(raw).replace(/,/g, ''))

      const exist = existingTargets.value[code]
      if (exist && exist.targetId) {
        // PATCH: update only targetValue
        jobs.push(targetApi.updateTarget(hotelGroupCode, exist.targetId, { targetValue: value }))
      } else {
        // POST: create new target
        const payload = {
          targetId: `${code}_${formattedPeriod.value}`,
          hotelGroupCode: hotelGroupCode,
          kpiCode: code,
          periodType: periodType.value,
          periodValue: formattedPeriod.value,
          targetValue: value
        }
        jobs.push(targetApi.createTarget(payload))
      }
    }

    await Promise.all(jobs)
    await loadTargets()
    alert('저장되었습니다.')
  } catch (e) {
    console.error(e)
    alert('저장에 실패했습니다.')
  }
}

const resetForm = () => {
  if (!confirm('입력된 목표값을 초기화하시겠습니까?')) return
  kpis.value.forEach(k => (targets[k.code] = ''))
}

const exportExcel = () => {
  // TODO: call backend template download or generate client-side
  alert('양식 다운로드를 실행합니다. (구현 필요)')
}

const onFileChange = (e) => {
  const file = e.target.files && e.target.files[0]
  importFile.value = file
}

const handleImport = async () => {
  if (!importFile.value) { alert('파일 선택 필요'); return }
  try {
    await targetApi.importTargets(importFile.value, { periodType: periodType.value, period: formattedPeriod.value })
    showImportModal.value = false
    await loadTargets()
    alert('업로드 완료')
  } catch (e) {
    console.error(e)
    alert('업로드 실패')
  }
}

watch([periodType, year, month], () => {
    loadTargets()
})

onMounted(async () => {
  await loadKpiMeta()
  await loadTargets()
})
</script>

<style scoped>
.objective-page {
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.select-period,
.select-year,
.select-month {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
}

.actions {
  display: flex;
  gap: 8px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  align-items: stretch;
}

.kpi-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100px;
  box-shadow: 0 1px 2px rgba(16,24,40,0.03);
}

.kpi-title {
  font-weight: 700;
  color: #111827;
  font-size: 15px;
}

.kpi-input {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.import-body {
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.import-hint {
  font-size: 12px;
  color: #6b7280;
}

.kpi-input-row { display:flex; gap:10px; align-items:center; }
.kpi-unit { color:#6b7280; font-size:13px; min-width:48px; text-align:left; }

@media (max-width: 900px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
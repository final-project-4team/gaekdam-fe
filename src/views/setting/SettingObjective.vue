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

        <BaseButton class="btn" @click="exportExcel">
          {{ isDownloading ? '다운로드 중...' : '양식다운로드' }}
        </BaseButton>
        <BaseButton class="btn" @click="showImportModal = true">엑셀입력</BaseButton>
      </div>

      <div class="actions">
        <BaseButton @click="resetForm">초기화</BaseButton>
        <BaseButton type="primary" @click="saveTargets">저장</BaseButton>
      </div>
    </div>

    <div class="kpi-grid">
      <section v-for="(group, idx) in groups" :key="idx" class="summary-section">
        <h4 class="section-title">{{ titles[idx] }}</h4>
        <div class="cards">
          <div class="card" v-for="kpi in group" :key="kpi.code">
            <div class="card-title">{{ kpi.name }}</div>
            <div class="card-body">
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
        </div>
      </section>
    </div>

    <BaseModal v-if="showImportModal" title="엑셀 입력" @close="showImportModal = false">
      <div class="import-body">
        <input type="file" accept=".xlsx,.xls" @change="onFileChange" />
        <p class="import-hint">양식에 맞는 엑셀 파일을 업로드해주세요.</p>
        
        <div v-if="importResult" class="import-result">
          <p>생성: {{ importResult.created }}, 업데이트: {{ importResult.updated }}, 스킵: {{ importResult.skipped }}</p>
          <ul v-if="importResult.errors && importResult.errors.length">
            <li v-for="err in importResult.errors" :key="err.row">시트/행 {{ err.row }}: {{ err.message }}</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <BaseButton @click="showImportModal = false">취소</BaseButton>
        <BaseButton type="primary" :disabled="uploadLoading" @click="handleImport">
          {{ uploadLoading ? '업로드 중...' : '업로드' }}
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import BaseButton from '@/components/common/button/BaseButton.vue'
import BaseModal from '@/components/common/modal/BaseModal.vue'
import * as targetApi from '@/api/report/targetApi.js'
import { usePermissionGuard } from '@/composables/usePermissionGuard';

const { withPermission } = usePermissionGuard();
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
// ensure targets initialized for dynamic kpis after kpis loaded
const initTargetsForKpis = () => {
  kpis.value.forEach(k => {
    if (!(k.code in targets)) targets[k.code] = ''
  })
}

const showImportModal = ref(false)
let importFile = ref(null)

const isDownloading = ref(false)
const uploadLoading = ref(false)
const importResult = ref(null)

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
      const rawVal = existingTargets.value[k.code]?.targetValue
      targets[k.code] = (rawVal === null || rawVal === undefined || rawVal === '') 
        ? '' 
        : Number(rawVal).toFixed(2)
    })

    console.log(items.map(i => ({ kpiCode: i.kpiCode, period: i.periodValue, targetValue: i.targetValue})))

  } catch (e) {
    console.error(e)
    alert('목표값 불러오기에 실패했습니다.')
  }
}

// save targets: for each KPI, create (POST) if no existing targetId, otherwise PATCH
const saveTargets =  () => {
  withPermission('SETTING_OBJECTIVE_UPDATE', async() => {
    try {
      const jobs = []

      for (const k of kpis.value) {
        const code = k.code
        const raw = targets[code]

        const value = (raw === '' || raw == null) ? null : Number(String(raw).replace(/,/g, ''))

        const exist = existingTargets.value[code]
        if (exist && exist.targetId) {
          // PATCH: update only targetValue
          jobs.push(targetApi.updateTarget(hotelGroupCode, exist.targetId, {targetValue: value}))
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
  });
}

const resetForm = () => {
  if (!confirm('입력된 목표값을 초기화하시겠습니까?')) return
  kpis.value.forEach(k => (targets[k.code] = ''))
}

const exportExcel = async () => {
  try {
    isDownloading.value = true
    const blob = await targetApi.downloadExcelTemplate({
      hotelGroupCode,
      periodType: periodType.value,
      periodValue: formattedPeriod.value // YYYY or YYYY-MM
    })
    const url = window.URL.createObjectURL(new Blob([blob]))
    const a = document.createElement('a')
    a.href = url
    a.download = `KPI_Template.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error(err)
    alert('양식 다운로드에 실패했습니다.')
  } finally {
    isDownloading.value = false
  }
}

const onFileChange = (e) => {
  const file = e.target.files && e.target.files[0]
  importFile.value = file
}

const handleImport = () => {
  withPermission('SETTING_OBJECTIVE_CREATE', async () => {
    if (!importFile.value) {
      alert('파일 선택 필요');
      return
    }
    const fd = new FormData()
    fd.append('file', importFile.value)
    fd.append('hotelGroupCode', hotelGroupCode)
    fd.append('periodType', periodType.value)
    fd.append('periodValue', formattedPeriod.value)

    uploadLoading.value = true
    importResult.value = null
    try {
      const res = await targetApi.uploadExcelTemplate(fd)
      importResult.value = res

      // 항상 백엔드 반영 결과를 반영하기 위해 최신값 재조회
      await loadTargets()

      // 오류가 있으면 모달을 열어 결과 표시(기본적으로 모달은 열려있음)
      if (res && res.errors && res.errors.length > 0) {
        alert('일부 항목에서 오류가 발생했습니다. 상세 정보를 확인하세요.')
        // 모달을 닫지 않고 importResult를 보여줍니다.
      } else {
        // 성공 시 모달 닫고 알림
        showImportModal.value = false
        alert('업로드가 완료되었습니다.')
      }
    } catch (err) {
      console.error(err)
      alert('업로드 실패')
    } finally {
      uploadLoading.value = false
    }
  });
}

watch([periodType, year, month], () => {
    loadTargets()
})

onMounted(async () => {
  await loadKpiMeta()
  await loadTargets()
})

const titles = ['객실운영', '고객현황', '고객경험', '예약및매출']

// map desired labels per section in the order you specified
const desiredLayout = [
  ['체크인', '체크아웃', '평균객실단가', '객실점유율'],
  ['투숙객', '재방문율', '멤버십 비율', '외국인 비율'],
  ['고객 문의', '고객 클레임', '미처리 문의 비율', '평균응답시간'],
  ['예약', '예약 취소율', '노쇼율', '객실 외 매출비율']
]

// If backend doesn't provide unit for some KPIs, enforce sensible defaults here
const unitOverrides = {
  '객실 외 매출비율': 'PERCENT',
  '객실점유율': 'PERCENT',
  '예약 취소율': 'PERCENT',
  '노쇼율': 'PERCENT',
  '재방문율': 'PERCENT',
  '멤버십 비율': 'PERCENT',
  '미처리 문의 비율': 'PERCENT',
  '평균응답시간': 'HOURS'
}

const groups = computed(() => {
  const items = kpis.value || []
  const out = []
  for (let i = 0; i < desiredLayout.length; i++) {
    const labels = desiredLayout[i]
    const group = labels.map(label => {
      // try to find KPI by exact name, fallback to includes, else return a placeholder
      let found = items.find(k => (k.name || '').trim() === label)
      if (!found) found = items.find(k => (k.name || '').includes(label))
      if (found) {
        // apply unit override if backend omitted unit
        if ((!found.unit || String(found.unit).trim() === '') && unitOverrides[label]) {
          found.unit = unitOverrides[label]
        }
        return found
      }
      // placeholder so layout remains consistent
      return { code: `ph_${i}_${label}`, name: label, unit: unitOverrides[label] || '' }
    })
    out.push(group)
  }
  return out
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
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.summary-section { margin-bottom: 28px; text-align: center; }
.section-title { font-size: 16px; font-weight:700; color:#374151; margin: 6px auto 12px; display: inline-block; text-align: center; }
.cards { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; }
.card { display:flex; flex-direction:column; justify-content:flex-start; align-items:flex-start; padding:18px; border:1px solid #f1f5f9; border-radius:10px; background:#fff; text-align:left; box-sizing:border-box; width:100%; }
.card-title { font-weight:700; margin-bottom:8px; font-size:14px }
.card-body { width:100%; }

.kpi-input-row { display:flex; gap:10px; align-items:center; justify-content:flex-start }
.kpi-input { padding: 10px 12px; border-radius: 8px; border: 1px solid #e5e7eb; background: #ffffff; width: 100%; box-sizing: border-box; font-size:16px }
.kpi-unit { color:#6b7280; font-size:12px; margin-left:8px }

@media (max-width: 1100px) { .cards { grid-template-columns: repeat(2, minmax(0,1fr)); } }
@media (max-width: 760px) { .cards { grid-template-columns: repeat(1, minmax(0,1fr)); } }
</style>
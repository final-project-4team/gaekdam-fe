<template>
  <BaseModal :title="isCreate ? '직원 등록' : `직원 상세 정보 (${localEmployee?.employeeName || '-'})`" @close="close">
    <div class="detail-container">
      <!-- 1행: 성명 / 아이디 -->
      <div class="row">
        <div class="col">
          <label>성명</label>
          <input 
            type="text" 
            v-model="form.employeeName" 
            :readonly="!isCreate" 
            :class="{ 'read-only': !isCreate }" 
          />
        </div>
        <div class="col">
          <label>아이디</label>
          <input 
            type="text" 
            v-model="form.loginId" 
            :readonly="!isCreate" 
            :class="{ 'read-only': !isCreate }" 
          />
        </div>
      </div>

      <!-- 2행: 사원번호 / 입사일자 -->
      <div class="row">
        <div class="col">
          <label>사원번호</label>
          <input 
            type="text" 
            v-model="form.employeeNumber" 
            :readonly="!isCreate" 
            :class="{ 'read-only': !isCreate }" 
          />
        </div>
        <div class="col">
          <label>입사일자</label>
          <!-- Create mode: Input (YYYY-MM-DD), Edit mode: Read-only formatted -->
          <input 
            v-if="isCreate"
            type="date" 
            v-model="form.hiredAt" 
          />
          <input 
            v-else
            type="text" 
            :value="formatDate(localEmployee.hiredAt)" 
            readonly 
            class="read-only" 
          />
        </div>
      </div>

      <!-- 3행: 부서 / 직급 -->
      <div class="row">
        <div class="col">
          <label>부서(Code)</label>
          <input 
            v-if="isCreate"
            type="text" 
            v-model="form.departmentId" 
            placeholder="부서 코드 입력 (예: 2)"
          />
          <select v-else v-model="form.departmentId">
             <option :value="null">선택</option>
             <option :value="localEmployee.departmentId">{{ localEmployee.departmentName }}</option>
          </select>
        </div>
        <div class="col">
          <label>직급(Code)</label>
           <input 
            v-if="isCreate"
            type="text" 
            v-model="form.hotelPositionId" 
             placeholder="직급 코드 입력 (예: 1)"
          />
           <select v-else v-model="form.hotelPositionId">
             <option :value="null">선택</option>
             <option :value="localEmployee.hotelPositionId">{{ localEmployee.hotelPositionName }}</option>
          </select>
        </div>
      </div>

      <!-- 4행: 권한 / 전화번호 -->
      <div class="row">
        <div class="col">
          <label>권한(Code)</label>
           <input 
            v-if="isCreate"
            type="text" 
            v-model="form.permissionId" 
            placeholder="권한 코드 입력 (예: 17)"
          />
           <select v-else v-model="form.permissionName">
             <option value="">선택</option>
             <option :value="localEmployee.permissionName">{{ localEmployee.permissionName }}</option>
          </select>
        </div>
        <div class="col">
          <label>전화번호</label>
          <input type="text" v-model="form.phoneNumber" />
        </div>
      </div>

      <!-- 5행: 이메일 (Full Width) -->
      <div class="row">
        <div class="col full-width">
          <label>이메일</label>
          <input type="text" v-model="form.email" />
        </div>
      </div>

      <!-- 6행: 사용자 상태 (Button) - Only in Edit Mode -->
      <div class="row" v-if="!isCreate">
        <div class="col full-width status-col">
          <label>사용자 상태</label>
          <div class="status-content">
            <span :class="statusClass(localEmployee.employeeStatus)">{{ localEmployee.employeeStatus }}</span>
            
            <BaseButton 
              v-if="localEmployee.employeeStatus === 'ACTIVE'" 
              type="danger" 
              size="small"
              @click="toggleStatus('LOCKED')"
            >
              사용자 비활성화
            </BaseButton>

            <BaseButton 
              v-else
              type="primary" 
              size="small" 
              @click="toggleStatus('ACTIVE')"
            >
              사용자 활성화
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <BaseButton type="ghost" @click="close">취소</BaseButton>
      <BaseButton type="primary" @click="save">
        {{ isCreate ? '직원 등록' : '사원 정보 수정' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import BaseModal from '@/components/common/modal/BaseModal.vue'
import BaseButton from '@/components/common/button/BaseButton.vue'
import { getEmployeeDetail, updateEmployee, updateEmployeeStatus, createEmployee, unlockEmployee } from '@/api/setting/employeeApi.js'


const props = defineProps({
  employeeCode: {
    type: [String, Number],
    required: false,
    default: null
  }
})

const emit = defineEmits(['close', 'refresh'])

const localEmployee = ref({})
// Form Data
const form = ref({
  employeeName: '',
  loginId: '',
  employeeNumber: '',
  hiredAt: '',
  departmentId: null,
  hotelPositionId: null,
  permissionId: null,
  permissionName: '',
  phoneNumber: '',
  email: '',
})

const permissionList = ref([])

const isCreate = computed(() => !props.employeeCode)

// 날짜 포맷팅
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dateStr.substring(0, 10)
}

const statusClass = (status) => {
  if (status === 'ACTIVE') return 'text-green'
  if (status === 'LOCKED') return 'text-red'
  return 'text-gray'
}

// 상세 정보 조회
const fetchDetail = async () => {
  // 생성 모드면 초기화 후 리턴
  if (isCreate.value) {
    localEmployee.value = {}
    form.value = {
        employeeName: '',
        loginId: '', 
        employeeNumber: '',
        hiredAt: new Date().toISOString().substring(0,10), // 오늘 날짜 기본
        departmentId: null,
        hotelPositionId: null,
        permissionId: null,
        permissionName: '', 
        phoneNumber: '',
        email: ''
    }
    return
  }

  try {
    const detail = await getEmployeeDetail(props.employeeCode)
    localEmployee.value = detail
    
    // Form 초기화
    form.value = {
        employeeName: detail.employeeName,
        loginId: detail.loginId,
        employeeNumber: detail.employeeNumber,
        hiredAt: detail.hiredAt,
        departmentId: detail.departmentId,
        hotelPositionId: detail.hotelPositionId,
        permissionId: detail.permissionId,
        permissionName: detail.permissionName,
        phoneNumber: detail.phoneNumber,
        email: detail.email
    }
  } catch (e) {
    console.error("상세 정보 조회 실패", e)
    alert("직원 정보를 불러오는데 실패했습니다.")
    close()
  }
}

// 저장 (생성/수정 분기)
const save = async () => {
    const modeName = isCreate.value ? "등록" : "수정"
    if(!confirm(`직원을 ${modeName}하시겠습니까?`)) return;

    try {
        if (isCreate.value) {
            // Payload Mapping
            const payload = {
                employeeNumber: Number(form.value.employeeNumber),
                loginId: form.value.loginId,
                password: "password123", // Default password
                email: form.value.email,
                phoneNumber: form.value.phoneNumber,
                name: form.value.employeeName,
                departmentCode: Number(form.value.departmentId),
                positionCode: Number(form.value.hotelPositionId),
                propertyCode: 1, // Default
                hotelGroupCode: 1, // Default
                roleCode: Number(form.value.permissionId)
            }
            await createEmployee(payload)
        } else {
            await updateEmployee(props.employeeCode, form.value)
        }
        
        alert(`${modeName}되었습니다.`)
        emit('refresh')
        close()
    } catch(e) {
        console.error(e)
        alert(`${modeName} 실패`)
    }
}

// 상태 변경
const toggleStatus = async (targetStatus) => {
    if(!confirm(targetStatus === 'LOCKED' ? "사용자를 비활성화(잠금) 하시겠습니까?" : "사용자를 활성화 하시겠습니까?")) return;
    try {
        if (targetStatus === 'ACTIVE') {
            await unlockEmployee(props.employeeCode)
        } else {
            await updateEmployeeStatus(props.employeeCode, targetStatus)
        }
        await fetchDetail() 
    } catch(e) {
        console.error(e)
        alert("상태 변경 실패")
    }
}

const close = () => emit('close')

onMounted(() => {
    fetchDetail()
})
</script>

<style scoped>
.detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 10px 0;
}

.row {
  display: flex;
  gap: 16px;
}

.col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.col.full-width {
  flex: none;
  width: 100%;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

input, select {
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

input.read-only {
  background-color: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
}

.text-green { color: #10b981; font-weight: 600; }
.text-red { color: #ef4444; font-weight: 600; }
.text-gray { color: #6b7280; font-weight: 600; }
</style>

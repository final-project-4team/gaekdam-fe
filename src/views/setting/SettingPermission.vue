<template>
  <div class="permission-page">
    <div class="toolbar">
      <div class="search-group">
        <input 
          type="text" 
          v-model="searchName" 
          placeholder="권한이름을 입력해주세요" 
          class="custom-input name-input"
        />
        <BaseButton type="ghost" class="icon-base-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </BaseButton>
      </div>

      <div class="search-group right-group">
        <div class="detail-search-wrap">
            <span class="detail-label">상세 검색</span>
            <BaseButton type="ghost" class="icon-base-btn no-border" @click="openDetailModal">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </BaseButton>
        </div>
        

      </div>
    </div>

    <div class="table-wrapper">
      <table class="permission-table">
        <colgroup>
            <col style="width: 140px" />
            <col v-for="menu in filteredMenuHeaders" :key="menu" style="width: 150px" />
            <col style="width: auto" /> <!-- Spacer -->
            <col style="width: 140px" />
        </colgroup>
        <thead>
          <tr>
            <th class="th-name">권한 이름</th>
            <th v-for="menu in filteredMenuHeaders" :key="menu">{{ menu }}</th>
            <th class="th-spacer"></th>
            <th class="th-action"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in filteredPermissionList" :key="row.permissionCode || idx" class="table-row">
            <td class="td-name">{{ row.permissionName }}</td>


            <td v-for="menu in filteredMenuHeaders" :key="menu + idx" class="td-perm">
              <div class="checkbox-group">
                <label v-for="action in ['생성', '수정', '삭제', '리스트조회', '상세조회']" :key="action" class="checkbox-label">
                  <input 
                    type="checkbox" 
                    :checked="isPermissionChecked(row, menu, action)"
                    :disabled="editingRowId !== row.permissionCode"
                    @change="togglePermission(row, menu, action)"
                  />
                  <span>{{ action }}</span>
                </label>
              </div>
            </td>


            <td class="td-spacer"></td>

            <td class="td-action">
                <div class="action-buttons" @click.stop>
                    <BaseButton 
                        v-if="editingRowId === row.permissionCode"
                        type="ghost" 
                        size="sm" 
                        class="custom-action-btn edit-btn"
                        @click.stop.prevent="savePermission(row)"
                    >
                        저장
                    </BaseButton>
                    <BaseButton 
                        v-else
                        type="ghost" 
                        size="sm" 
                        class="custom-action-btn edit-btn"
                        @click.stop.prevent="enableEdit(row)"
                    >
                        수정
                    </BaseButton>
                    <BaseButton 
                        type="danger" 
                        size="sm" 
                        class="custom-action-btn delete-btn"
                        @click="deletePermission(row)"
                    >
                        삭제
                    </BaseButton>
                </div>
            </td>
          </tr>
          <tr v-if="filteredPermissionList.length === 0">
              <td :colspan="filteredMenuHeaders.length + 3" class="empty-message">검색 결과가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>


    <div class="pagination-wrapper">
      <Pagination
        :current="page"
        :totalPages="totalPages"
        @change="onPageChange"
      />
    </div>


    <BaseModal
        v-if="showDetailModal"
        title="상세 검색"
        @close="closeDetailModal"
    >
      <div class="detail-modal-body">
        <div class="modal-row">

            <div class="modal-col">
                <label>권한 이름</label>
                <input 
                    v-model="detailForm.permissionName" 
                    placeholder="예: 김상대" 
                    class="modal-input"
                />
            </div>


            <div class="modal-col">
                <div 
                    v-for="(type, index) in detailForm.functionTypes" 
                    :key="index" 
                    class="dynamic-input-group"
                >
                    <label>기능 종류</label>
                    <input 
                        v-model="detailForm.functionTypes[index]" 
                        placeholder="예: 고객 정보" 
                        class="modal-input"
                    />
                </div>
                

                <div class="add-icon-wrapper">
                    <button class="add-icon-btn" @click="addFunctionType">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
            </div>
        </div>
      </div>

      <template #footer>
        <BaseButton type="ghost" @click="closeDetailModal">취소</BaseButton>
        <BaseButton type="primary" @click="onDetailSearch">검색</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BaseButton from '@/components/common/button/BaseButton.vue'
import Pagination from '@/components/common/pagination/Pagination.vue'
import BaseModal from '@/components/common/modal/BaseModal.vue'
import { getPermissionList, updatePermission, deletePermission as apiDeletePermission } from '@/api/setting/permissionApi.js'

const PERMISSION_ENUM_ORDER = [
    'REPORT_LIST',
    'REPORT_READ',
    'REPORT_DASHBOARD_CREATE',
    'REPORT_DASHBOARD_UPDATE',

    'MEMBER_LIST',


    'EMPLOYEE_LIST',
    'EMPLOYEE_READ',
    'EMPLOYEE_CREATE',
    'EMPLOYEE_UPDATE',
    'EMPLOYEE_DELETE',

    'CUSTOMER_READ',
    'CUSTOMER_LIST',
    'CUSTOMER_UPDATE',
    'CUSTOMER_DELETE',


    'CUSTOMER_MEMO_CREATE',
    'CUSTOMER_MEMO_LIST',
    'CUSTOMER_MEMO_READ',
    'CUSTOMER_MEMO_UPDATE',
    'CUSTOMER_MEMO_DELETE',


    'MEMBERSHIP_POLICY_LIST',
    'MEMBERSHIP_POLICY_READ',
    'MEMBERSHIP_POLICY_CREATE',
    'MEMBERSHIP_POLICY_UPDATE',
    'MEMBERSHIP_POLICY_DELETE',


    'LOYALTY_POLICY_LIST',
    'LOYALTY_POLICY_READ',
    'LOYALTY_POLICY_CREATE',
    'LOYALTY_POLICY_UPDATE',
    'LOYALTY_POLICY_DELETE',


    'CUSTOMER_TIMELINE_READ',
    'RESERVATION_LIST',
    'RESERVATION_READ',
    'RESERVATION_PACKAGE_LIST',
    'CHECK_IN_OUT_LIST',
    'STAYS_LIST',

    'FACILITY_USAGE_LIST',


    'INQUIRY_LIST',
    'INQUIRY_READ',


    'ACCIDENT_CREATE',
    'ACCIDENT_LIST',
    'ACCIDENT_READ',
    'ACCIDENT_DELETE',


    'MESSAGE_CREATE',
    'MESSAGE_LIST',
    'MESSAGE_READ',
    'MESSAGE_UPDATE',
    'MESSAGE_DELETE',

    'PERMISSION_CREATE',
    'PERMISSION_LIST',
    'PERMISSION_UPDATE',
    'PERMISSION_DELETE',
]

const searchName = ref('')
const page = ref(1)
const totalPages = ref(1)

const menuHeaders = ref([
    '보고서', '직원', '고객', '고객 메모', '멤버십 정책', '로열티 정책', 
    '예약', '입퇴실', '시설 이용', '문의', '사고', '메시지', '권한 관리'
])

const MENU_MAP = {
    '보고서': 'REPORT',
    '직원': 'EMPLOYEE',
    '고객': 'CUSTOMER',
    '고객 메모': 'CUSTOMER_MEMO',
    '멤버십 정책': 'MEMBERSHIP_POLICY',
    '로열티 정책': 'LOYALTY_POLICY',
    '예약': 'RESERVATION',
    '입퇴실': 'CHECK_IN_OUT',
    '시설 이용': 'FACILITY_USAGE',
    '문의': 'INQUIRY',
    '사고': 'ACCIDENT',
    '메시지': 'MESSAGE',
    '권한 관리': 'PERMISSION'
}

const ACTION_MAP = {
    '생성': 'CREATE',
    '수정': 'UPDATE',
    '삭제': 'DELETE',
    '리스트조회': 'LIST',
    '상세조회': 'READ'
}

const permissionList = ref([])

const editingRowId = ref(null)

const showDetailModal = ref(false)
const detailForm = ref({
    permissionName: '',
    functionTypes: ['']
})
const appliedDetailFilter = ref(null)

const onPageChange = (p) => {
  page.value = p
}

const fetchPermissions = async () => {
    try {
        const res = await getPermissionList()
        permissionList.value = res.content || []
        totalPages.value = res.totalPages || 1
    } catch (e) {
        console.error("Permissions Fetch Failed", e)
    }
}

onMounted(fetchPermissions)

const getEntityKey = (menu) => MENU_MAP[menu] || ''

const isPermissionChecked = (row, menu, actionLabel) => {
    const entity = getEntityKey(menu)
    if (!entity) return false
    
    const action = ACTION_MAP[actionLabel]
    const key = `${entity}_${action}`
    
    return row.permissionTypes.some(pt => pt.permissionTypeKey === key)
}

const togglePermission = (row, menu, actionLabel) => {
    if (editingRowId.value !== row.permissionCode) return

    const entity = getEntityKey(menu)
    const action = ACTION_MAP[actionLabel]
    const key = `${entity}_${action}`

    if (!row.permissionTypes) {
        row.permissionTypes = []
    }

    const index = row.permissionTypes.findIndex(pt => pt.permissionTypeKey === key)
    
    if (index >= 0) {
        row.permissionTypes.splice(index, 1)
    } else {
        row.permissionTypes.push({ permissionTypeKey: key })
    }
}

const enableEdit = (row) => {
    alert('권한 정보를 수정합니다.')
    editingRowId.value = row.permissionCode
}

const savePermission = async (row) => {
    if (!confirm('권한 변경사항을 저장하시겠습니까?')) return

    try {

        const permissionTypeList = (row.permissionTypes || [])
            .map(pt => PERMISSION_ENUM_ORDER.indexOf(pt.permissionTypeKey) + 1)
            .filter(code => code > 0)

        await updatePermission(row.permissionCode, { permissionTypeList })

        alert('권한이 수정되었습니다.')
        editingRowId.value = null
        fetchPermissions()
    } catch (e) {
        console.error("Update failed", e)
      //  alert('권한 수정 중 오류가 발생했습니다.')
    }
}

const deletePermission = async (row) => {
    if (!confirm('정말로 이 권한을 삭제하시겠습니까?')) return
    try {
        await apiDeletePermission(row.permissionCode)
        alert('권한이 삭제되었습니다.')
        fetchPermissions()
    } catch (e) {
        console.error("Delete failed", e)
      //  alert('권한 삭제 실패')
    }
}


const openDetailModal = () => {
    if(detailForm.value.functionTypes.length === 0) {
        detailForm.value.functionTypes.push('')
    }
    showDetailModal.value = true
}

const closeDetailModal = () => {
    showDetailModal.value = false
}

const addFunctionType = () => {
    detailForm.value.functionTypes.push('')
}

const onDetailSearch = () => {
    appliedDetailFilter.value = JSON.parse(JSON.stringify(detailForm.value))
    closeDetailModal()
}

const filteredPermissionList = computed(() => {
    let result = permissionList.value

    if (searchName.value) {
        result = result.filter(item => item.permissionName.includes(searchName.value))
    }

    if (appliedDetailFilter.value) {
        const { permissionName } = appliedDetailFilter.value
        if (permissionName) {
            result = result.filter(item => item.permissionName.includes(permissionName))
        }
    }

    return result
})

const filteredMenuHeaders = computed(() => {
    let headers = menuHeaders.value

    if (appliedDetailFilter.value) {
        const { functionTypes } = appliedDetailFilter.value
        const validTypes = functionTypes.filter(t => t && t.trim() !== '')

        if (validTypes.length > 0) {
            headers = headers.filter(header => {
                return validTypes.some(type => header.includes(type))
            })
        }
    }

    return headers
})
</script>

<style scoped>
.permission-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 20px;
}


.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.search-group {
    display: flex;
    gap: 8px;
    align-items: center;
}

.custom-input {
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0 12px;
  font-size: 14px;
}

.name-input {
    width: 300px;
}

.detail-search-wrap {
    display: flex;
    align-items: center;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    height: 40px;
    padding-left: 12px;
    background: white;
}

.detail-label {
    font-size: 14px;
    color: #374151;
    margin-right: 8px;
}

.icon-base-btn {
  width: 40px !important;
  height: 40px !important;
  padding: 0 !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px !important;
}

.no-border {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
}

.add-btn-custom {
    background: linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%) !important;
    border: 1px solid #d1d5db !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
    color: #374151 !important;
}

.detail-search-wrap .icon-base-btn {
    height: 100% !important;
}


.table-wrapper {
  background: white;
  border-radius: 0;
  border: 1px solid #e5e7eb;
  overflow-x: auto;
}

.permission-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th, td {
  border: 1px solid #e5e7eb;
  padding: 8px;
  vertical-align: middle;
}

th {
  background: #f9fafb;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  text-align: center;
  padding: 12px 8px;
}

.th-name { width: 140px; }
.th-action { width: 140px; }

.td-name {
  text-align: center;
  font-weight: 700;
  font-size: 14px;
  color: #111827;
}

.td-perm {
    padding: 6px;
}

.checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-left: 20px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #374151;
    cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
    accent-color: #4f46e5;
    width: 14px;
    height: 14px;
}


.td-action {
    text-align: center;
}

.action-buttons {
    display: flex;
    gap: 6px;
    justify-content: center;
}

.custom-action-btn {
    font-weight: normal;
}

.edit-btn {
    border-color: #d1d5db !important;
}

.delete-btn {
    background: #fee2e2 !important;
    border-color: #fecaca !important;
    color: #ef4444 !important;
}

.empty-message {
    text-align: center;
    padding: 20px;
    color: #6b7280;
}


.pagination-wrapper {
    display: flex;
    justify-content: center;
    padding: 20px 0;
}


.detail-modal-body {
    padding: 20px 0;
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 8px;
}

.modal-row {
    display: flex;
    gap: 40px;
}

.modal-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.dynamic-input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.modal-col label {
    font-size: 13px;
    font-weight: 700;
    color: #111827;
}

.modal-input {
    width: 100%;
    height: 40px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0 12px;
    box-sizing: border-box;
}

.add-icon-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 8px;
}

.add-icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    border: 1px solid #cbd5e1;
    background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #334155;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.add-icon-btn:hover {
    background: #e2e8f0;
}
</style>

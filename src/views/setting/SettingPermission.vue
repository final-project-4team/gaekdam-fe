<template>
  <div class="permission-page">
    <div class="page-header">
      <BaseButton type="primary" @click="openCreateModal">권한 등록</BaseButton>
    </div>

    <!-- ListView 적용 -->
    <ListView
      :columns="columns"
      :rows="permissionList"
      :total="totalCount"
      :page="page"
      :pageSize="pageSize"
      :showSearch="true"
      :searchTypes="searchTypes"
      @search="onSearch"
      @page-change="onPageChange"
      @row-click="openEditModal"
    >
      <template #cell-actions="{ row }">
        <div class="action-buttons" @click.stop>
          <BaseButton 
            type="danger" 
            size="sm" 
            @click="deletePermission(row)"
            class="action-btn"
          >
            삭제
          </BaseButton>
        </div>
      </template>
    </ListView>

    <!-- 권한 상세/등록 모달 -->
    <PermissionDetailModal
      v-if="showModal"
      :permission="selectedPermission"
      @close="closeModal"
      @refresh="fetchPermissions"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BaseButton from '@/components/common/button/BaseButton.vue'
import ListView from '@/components/common/ListView.vue'
import PermissionDetailModal from '@/views/setting/modal/PermissionDetailModal.vue'
import { getPermissionList, deletePermission as apiDeletePermission } from '@/api/setting/permissionApi.js'

// === State ===
const permissionList = ref([])
const totalCount = ref(0)
const page = ref(1)
const pageSize = ref(10) // 기본 10개
const searchKeyword = ref('')

const showModal = ref(false)
const selectedPermission = ref(null)

// === Columns ===
const columns = [
  { key: 'permissionName', label: '권한 이름', align: 'center', width: '200px' },
  // 필요하다면 권한 개수 등을 보여줄 수 있지만, 현재 API 응답에 count가 있는지 불확실. 
  // 일단 이름만 표시.
  { key: 'actions', label: '관리', align: 'center', width: '120px' }
]

const searchTypes = [
  { label: '권한 이름', value: 'permissionName' }
]

// === API Fetch ===
const fetchPermissions = async () => {
  try {
    // API 파라미터 구조 확인 필요. 기존 코드 참조:
    // const res = await getPermissionList() -> res.content
    // 검색 지원 여부는 불확실하나, List API라면 보통 page, size, keyword 등을 받음.
    // 기존 SettingPermission.vue에서는 클라이언트 사이드 필터링을 하고 있었음.
    // 여기서는 API가 필터링을 지원한다고 가정하거나, 필요시 클라이언트 필터링 유지.
    // **중요**: 기존 코드는 `getPermissionList()` 파라미터 없이 호출 후 `res.content` 받아와서 JS로 필터링함.
    // 따라서 여기서도 일단 받아와서 JS 필터링 후 페이징 처리하는 것이 안전함 (백엔드 수정 없으므로).
    
    // (1) 전체 조회
    const res = await getPermissionList()
    let allData = res.content || []
    
    // (2) 검색 필터링 (클라이언트)
    if (searchKeyword.value) {
      allData = allData.filter(item => 
        item.permissionName.toLowerCase().includes(searchKeyword.value.toLowerCase())
      )
    }

    totalCount.value = allData.length
    
    // (3) 페이징 (클라이언트)
    const start = (page.value - 1) * pageSize.value
    const end = start + pageSize.value
    permissionList.value = allData.slice(start, end)

  } catch (e) {
    console.error("Permissions Fetch Failed", e)
  }
}

// === Event Handlers ===
const onSearch = (payload) => {
  // ListView search event: payload = { key: 'permissionName', value: '...' }
  if (payload) {
    searchKeyword.value = payload.value
  } else {
    searchKeyword.value = ''
  }
  page.value = 1
  fetchPermissions()
}

const onPageChange = (p) => {
  page.value = p
  fetchPermissions()
}

// === Modal Logic ===
const openCreateModal = () => {
  selectedPermission.value = null
  showModal.value = true
}

const openEditModal = (row) => {
  selectedPermission.value = row // 객체 통째로 전달
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedPermission.value = null
}

// === Delete Logic ===
const deletePermission = async (row) => {
  if (!confirm(`'${row.permissionName}' 권한을 삭제하시겠습니까?`)) return
  try {
    await apiDeletePermission(row.permissionCode)
    alert('권한이 삭제되었습니다.')
    fetchPermissions()
  } catch (e) {
    console.error("Delete failed", e)
    alert('권한 삭제 중 오류가 발생했습니다.')
  }
}

// === Lifecycle ===
onMounted(fetchPermissions)
</script>

<style scoped>
.permission-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 20px;
}

.page-header {
  display: flex;
  justify-content: flex-end;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.action-btn {
  font-size: 12px;
  height: 30px;
  min-width: 50px;
}
</style>

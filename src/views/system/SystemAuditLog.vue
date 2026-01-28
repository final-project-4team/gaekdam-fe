<template>
  <div class="system-log-page">
    <!-- 상단 탭 -->
    <ContentTabs :tabs="tabs" />

    <!-- 커스텀 날짜 필터 바 -->
    <div class="custom-filter-bar">
      <div class="date-range">
        <input
            type="date"
            v-model="dateFilter.fromDate"
            class="date-input"
            @change="handleDateChange"
        />
        <span class="separator">~</span>
        <input
            type="date"
            v-model="dateFilter.toDate"
            class="date-input"
            @change="handleDateChange"
        />
      </div>
    </div>

    <ListView
        :columns="columns"
        :rows="activityLogList"
        :total="totalCount"
        :page="page"
        :pageSize="pageSize"
        :searchTypes="searchTypes"
        @search="onSearch"
        @sort-change="onSortChange"
        @page-change="onPageChange"
        @row-click="openRowModal"
    >
      <!-- 상세 정보 커스텀 셀 -->
      <template #cell-detail="{ value }">
        <span class="detail-text" :title="value">{{ value }}</span>
      </template>
    </ListView>

    <!-- 상세 모달 -->
    <BaseModal
        v-if="showRowModal"
        title="활동 로그 상세 정보"
        @close="closeRowModal"
    >
      <div v-if="activityLogDetail" class="detail-view">
        <p><b>로그 번호:</b> {{ activityLogDetail.auditLogCode }}</p>
        <p><b>메뉴명:</b> {{ activityLogDetail.menuName }}</p>
        <p><b>업무명:</b> {{ activityLogDetail.action }}</p>
        <p><b>상세 정보:</b> {{ activityLogDetail.detail }}</p>
        <p><b>접속자 ID:</b> {{ activityLogDetail.loginId }}</p>
        <p><b>일시:</b> {{ activityLogDetail.occurredAt }}</p>
      </div>

      <template #footer>
        <BaseButton type="primary" size="sm" @press="closeRowModal">
          확인
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ContentTabs from '@/components/layoutComponents/ContentTabs.vue'
import ListView from '@/components/common/ListView.vue'
import BaseButton from '@/components/common/button/BaseButton.vue'
import BaseModal from '@/components/common/modal/BaseModal.vue'
import {
  getActivityLogList,
  getSystemLogDetail // 사용 가능한지 확인 필요, 없다면 activityDetail API 필요할수도
} from '@/api/system/systemLogApi.js'

// 탭 설정
const tabs = [
  { label: '로그인', path: '/system/log' },
  { label: '활동 기록', path: '/system/activity' },
  { label: '권한 변경', path: '/system/permission' },
  { label: '개인 정보 조회', path: '/system/privacy' }
]

// 테이블 컬럼
const columns = [
  { key: 'auditLogCode', label: '활동 로그 코드', sortable: true, width: '140px', align: 'center' },
  { key: 'action', label: '업무명', sortable: true, align: 'center' },
  { key: 'detail', label: '상세 정보', sortable: true, align: 'left' },
  { key: 'loginId', label: '접속자 ID', sortable: true, align: 'center' },
  { key: 'occurredAt', label: '일시', sortable: true, align: 'center' }
]

// 상태 관리
const activityLogList = ref([])
const activityLogDetail = ref(null)
const totalCount = ref(0)
const page = ref(1)
const pageSize = ref(10)

// 검색 타입 (전체만 지원하거나 필요한 경우 추가)
const searchTypes = [
  { label: '전체', value: '' },
  { label: '접속자 ID', value: 'loginId' },
  { label: '업무명', value: 'action' },
  { label: '상세 정보', value: 'detail' }
]

// 날짜 필터
const dateFilter = ref({
  fromDate: null,
  toDate: null
})

// 검색어 상태
const quickSearch = ref({
  keyword: null,
  loginId: null,
  action: null,
  detail: null
})

const sortState = ref({})

// 모달 상태
const showRowModal = ref(false)
const selectedRow = ref(null)

// 데이터 로드
const loadActivityLogs = async () => {
  try {
    const searchParams = {
      loginId: quickSearch.value.loginId,         // employeeLoginId -> loginId
      action: quickSearch.value.action,          // permissionTypeKey -> action
      detail: quickSearch.value.detail,          // details -> detail
      fromDate: dateFilter.value.fromDate ? `${dateFilter.value.fromDate}T00:00:00` : null,
      toDate: dateFilter.value.toDate ? `${dateFilter.value.toDate}T23:59:59` : null
    }

    // 2. 정렬 필드 매핑
    let mappedSort = { ...sortState.value }
    if (mappedSort.sortBy) {
      if (mappedSort.sortBy === 'action') mappedSort.sortBy = 'permissionTypeKey'
      else if (mappedSort.sortBy === 'detail') mappedSort.sortBy = 'details'
      else if (mappedSort.sortBy === 'loginId') mappedSort.sortBy = 'employeeLoginId'
    }

    const requestPage = page.value;

    const res = await getActivityLogList({
      page: requestPage,
      size: pageSize.value,
      detail: searchParams,
      sort: mappedSort
    })

    // 4. 결과 매핑 (백엔드 응답 필드 -> 프론트엔드 테이블 필드)
    activityLogList.value = (res.content || []).map(item => ({
      ...item,
      action: item.permissionTypeKey, // 백엔드 Enum/필드명 -> 테이블 '업무명'
      detail: item.details,           // 백엔드 details -> 테이블 '상세 정보'
      loginId: item.employeeLoginId   // 백엔드 employeeLoginId -> 테이블 '접속자 ID'
    }))
    totalCount.value = res.totalElements || 0
  } catch (error) {
    console.error('활동 로그 조회 실패:', error)
    activityLogList.value = []
    totalCount.value = 0
  }
}

// 날짜 변경
const handleDateChange = () => {
  page.value = 1
  loadActivityLogs()
}

// 검색 핸들러
const onSearch = (payload) => {
  page.value = 1
  // 검색어 초기화
  quickSearch.value = { keyword: null, loginId: null, action: null, detail: null }

  const key = payload.key ?? payload.type
  const value = payload.value

  if (key === 'loginId') {
    quickSearch.value.loginId = value
  } else if (key === 'detail') {
    quickSearch.value.detail = value
  } else if (key === 'action') { // 이 부분을 명시적으로 추가!
    quickSearch.value.action = value
  } else {
    quickSearch.value.keyword = value
  }

  loadActivityLogs()
}


// 페이지 변경
const onPageChange = (p) => {
  page.value = p < 1 ? 1 : p
  loadActivityLogs()
}

// 정렬 변경
const onSortChange = (sort) => {
  sortState.value = sort
  loadActivityLogs()
}

// 모달 열기
const openRowModal = (row) => {
  selectedRow.value = row
  // 상세 조회 API가 별도로 없다면 row 데이터를 그대로 사용
  activityLogDetail.value = row 
  showRowModal.value = true
}

const closeRowModal = () => {
  showRowModal.value = false
  selectedRow.value = null
  activityLogDetail.value = null
}

onMounted(() => {
  loadActivityLogs()
})
</script>

<style scoped>
.system-log-page {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ==================== 커스텀 필터 바 ==================== */
.custom-filter-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 14px 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-input {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  color: #374151;
  background: white;
  height: 32px;
}

.date-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.separator {
  color: #6b7280;
  font-size: 14px;
  margin: 0 4px;
}

/* ==================== 검색바 스타일 ==================== */
/* ListView의 toolbar 반응형 중앙 정렬 */
:deep(.toolbar) {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap; 
  gap: 10px;       
  padding: 16px 20px;
  width: 100%;
}

/* 검색 컨테이너 */
:deep(.search-bar) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap; 
  width: auto;
  max-width: 100%;
}

/* 검색 입력창 너비 확장 (반응형) */
:deep(.input-wrap .input) {
  width: 600px !important; 
  max-width: 100%;         
  min-width: 200px;        
}

/* ==================== 테이블 관련 ==================== */
.detail-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px; /* 상세 정보 길이 제한 */
}

/* ContentTabs 중앙 정렬 */
:deep(.tabs) {
  justify-content: center;
}

/* 모달 스타일 */
.detail-view p {
  margin: 8px 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

.detail-view b {
  color: #1f2937;
  font-weight: 600;
  margin-right: 8px;
}
</style>
<template>
  <h1>
    공통 컴포넌트 테스트 페이지
  </h1>
  <div class="example-page">
    <!-- 상단 검색 + 필터 -->
    <div class="toolbar">
      <SearchBar
          placeholder="고객명 또는 예약번호 검색"
          @search="onSearch"
          @detail="onDetail"
      />

      <div class="test-buttons">
        <BaseButton type="secondary" @click="openSimpleModal">
          공통 모달 테스트
        </BaseButton>

        <BaseButton type="primary" @click="openActionModal">
          버튼 추가 모달 테스트
        </BaseButton>
      </div>

      <FilterGroup
          :filters="filters"
          @change="onFilter"
      />
    </div>

    <!-- 테이블 -->
    <BaseTable
        :columns="columns"
        :rows="rows"
        @row-click="openModal"
    />

    <!-- 페이징 -->
    <Pagination
        :current="page"
        :pages="[1,2,3,4,5]"
        @change="onPageChange"
    />
  </div>


  <BaseModal
      v-if="showModal"
      title="예약 상세"
      @close="closeModal"
  >
    <div v-if="selectedRow">
      <p><b>예약번호:</b> {{ selectedRow.reservationNo }}</p>
      <p><b>고객명:</b> {{ selectedRow.customerName }}</p>
      <p><b>객실유형:</b> {{ selectedRow.roomType }}</p>
      <p><b>운영상태:</b> {{ selectedRow.status }}</p>
    </div>
  </BaseModal>


  <BaseModal
      v-if="showSimpleModal"
      title="공통 모달 테스트"
      @close="showSimpleModal = false"
  >
    <p>이 모달은 BaseModal 기본 footer(닫기 버튼)를 사용합니다.</p>
  </BaseModal>

  <BaseModal
      v-if="showActionModal"
      title="버튼 추가 모달 테스트"
      @close="showActionModal = false"
  >
    <p>이 모달은 footer를 커스터마이징한 버전입니다.</p>

    <template #footer>
      <BaseButton type="secondary" @click="showActionModal = false">
        취소
      </BaseButton>
      <BaseButton type="primary" @click="confirmAction">
        확인
      </BaseButton>
    </template>
  </BaseModal>


</template>



<script setup>
import { ref } from 'vue'

import SearchBar from '@/components/common/form/SearchBar.vue'
import FilterGroup from '@/components/common/filter/FilterGroup.vue'
import BaseTable from '@/components/common/table/BaseTable.vue'
import Pagination from '@/components/common/pagination/Pagination.vue'
import BaseModal from '@/components/common/modal/BaseModal.vue'
import BaseButton from "@/components/common/button/BaseButton.vue";


///////////////////////////////////////////////////////
/* ===== 예시 필터 ===== */
const filters = [
  {
    key: 'status',
    options: [
      { label: '운영상태', value: '' },
      { label: '투숙중', value: 'STAYING' },
      { label: '체크인예정', value: 'CHECKIN' },
      { label: '완료', value: 'COMPLETED' },
    ],
  },
  {
    key: 'roomType',
    options: [
      { label: '객실유형', value: '' },
      { label: '디럭스', value: 'DELUXE' },
      { label: '스위트', value: 'SUITE' },
    ],
  },
]
///////////////////////////////////////////////////////
/* ===== 테이블 컬럼 ===== */
const columns = [
  { key: 'reservationNo', label: '예약번호' },
  { key: 'customerName', label: '고객명' },
  { key: 'roomType', label: '객실유형' },
  { key: 'checkinDate', label: '투숙예정일' },
  { key: 'checkoutDate', label: '투숙종료일' },
  { key: 'status', label: '운영상태' },

]

/* ===== 더미 데이터 ===== */
const rows = ref([
  {
    id: 1,
    reservationNo: '1',
    customerName: '김철수',
    roomType: '디럭스',
    checkinDate: '2025/12/27',
    checkoutDate: '2025/12/28',
    status: '투숙중',
  },
  {
    id: 2,
    reservationNo: '2',
    customerName: '이영희',
    roomType: '스위트',
    checkinDate: '2025/12/28',
    checkoutDate: '2025/12/29',
    status: '체크인예정',
  },
])
///////////////////////////////////////////////////////
/* ===== 모달 ===== */
const showModal = ref(false)
const selectedRow = ref(null)
const showSimpleModal = ref(false)
const showActionModal = ref(false)

const openSimpleModal = () => {
  showSimpleModal.value = true
}

const openActionModal = () => {
  showActionModal.value = true
}

const openModal = (row) => {
  selectedRow.value = row
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedRow.value = null
}

const confirmAction = () => {
  console.log('확인 버튼 클릭')
  showActionModal.value = false
}
///////////////////////////////////////////////////////
/* ===== 페이징 ===== */
const page = ref(1)

/* ===== 이벤트 핸들러 (지금은 콘솔만) ===== */
const onSearch = (keyword) => {
  console.log('search:', keyword)
}

const onDetail = () => {
  console.log('detail search')
}

const onFilter = (values) => {
  console.log('filter:', values)
}

const onPageChange = (p) => {
  page.value = p
  console.log('page:', p)
}
</script>




<style scoped>
.example-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 검색 + 필터 한 줄 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-buttons {
  display: flex;
  gap: 8px;
}
</style>

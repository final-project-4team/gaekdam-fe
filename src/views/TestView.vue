<template>
  <div class="test-page">
    <h1 class="title">공통 컴포넌트 테스트 페이지</h1>

    <!-- ===================== -->
    <!-- 1. SearchBar 기본 -->
    <!-- ===================== -->
    <section class="block">
      <h3>SearchBar - 기본 (상세검색 없음)</h3>
      <SearchBar
          placeholder="예약번호 검색"
          :showDetail="false"
          @search="onSearch"
      />
    </section>

    <!-- ===================== -->
    <!-- 2. SearchBar 상세검색 -->
    <!-- ===================== -->
    <section class="block">
      <h3>SearchBar - 상세검색 포함</h3>
      <SearchBar
          placeholder="고객명 또는 예약번호 검색"
          @search="onSearch"
          @detail="onDetail"
      />
    </section>

    <!-- ===================== -->
    <!-- 3. SearchBar 기준 선택형 -->
    <!-- ===================== -->
    <section class="block">
      <h3>SearchBar - 검색 기준 선택형</h3>

      <SearchBar
          :searchTypes="searchTypes"
          v-model:type="searchType"
          placeholder="고객명 또는 예약번호 검색"
          @search="onSearchWithType"
          @detail="onDetail"
      />

      <p class="debug">
        선택된 검색 기준: <b>{{ searchType || '전체' }}</b>
      </p>
    </section>

    <!-- ===================== -->
    <!-- 4. 버튼 종류 / 사이즈 -->
    <!-- ===================== -->
    <section class="block">
      <h3>BaseButton 종류 / 사이즈</h3>

      <div class="button-row">
        <BaseButton type="primary" size="sm">등록</BaseButton>
        <BaseButton type="primary" size="md">등록</BaseButton>
        <BaseButton type="primary" size="lg">등록</BaseButton>
      </div>

      <div class="button-row">
        <BaseButton type="warning" size="sm">수정</BaseButton>
        <BaseButton type="warning" size="md">수정</BaseButton>
        <BaseButton type="warning" size="lg">수정</BaseButton>
      </div>

      <div class="button-row">
        <BaseButton type="danger" size="sm">삭제</BaseButton>
        <BaseButton type="danger" size="md">삭제</BaseButton>
        <BaseButton type="danger" size="lg">삭제</BaseButton>
      </div>

      <div class="button-row">
        <BaseButton type="ghost" size="sm">닫기</BaseButton>
        <BaseButton type="ghost" size="md">닫기</BaseButton>
        <BaseButton type="ghost" size="lg">닫기</BaseButton>
      </div>
    </section>

    <!-- ===================== -->
    <!-- 5. 모달 테스트 -->
    <!-- ===================== -->
    <section class="block">
      <h3>BaseModal 테스트</h3>

      <div class="button-row">
        <BaseButton type="ghost" size="md" @click="openSimpleModal">
          공통 모달
        </BaseButton>

        <BaseButton type="primary" size="md" @click="openActionModal">
          버튼 추가 모달
        </BaseButton>
      </div>
    </section>

    <!-- ===================== -->
    <!-- 6. 테이블 + 페이징 -->
    <!-- ===================== -->
    <section class="block">
      <h3>테이블 + 페이징</h3>

      <BaseTable
          :columns="columns"
          :rows="rows"
          @row-click="openRowModal"
      />

      <Pagination
          :current="page"
          :pages="[1,2,3,4,5]"
          @change="onPageChange"
      />
    </section>

    <!-- ===================== -->
    <!-- 모달 영역 -->
    <!-- ===================== -->

    <!-- 기본 모달 -->
    <BaseModal
        v-if="showSimpleModal"
        title="공통 모달 테스트"
        @close="showSimpleModal = false"
    >
      <p>이 모달은 기본 footer(닫기 버튼)를 사용합니다.</p>
    </BaseModal>

    <!-- 버튼 커스텀 모달 -->
    <BaseModal
        v-if="showActionModal"
        title="버튼 추가 모달 테스트"
        @close="showActionModal = false"
    >
      <p>이 모달은 footer를 커스터마이징한 버전입니다.</p>

      <template #footer>
        <BaseButton type="ghost" size="sm" @click="showActionModal = false">
          취소
        </BaseButton>
        <BaseButton type="primary" size="sm" @click="confirmAction">
          확인
        </BaseButton>
      </template>
    </BaseModal>

    <!-- 테이블 row 클릭 모달 -->
    <BaseModal
        v-if="showRowModal"
        title="예약 상세"
        @close="closeRowModal"
    >
      <div v-if="selectedRow">
        <p><b>예약번호:</b> {{ selectedRow.reservationNo }}</p>
        <p><b>고객명:</b> {{ selectedRow.customerName }}</p>
        <p><b>객실유형:</b> {{ selectedRow.roomType }}</p>
        <p><b>운영상태:</b> {{ selectedRow.status }}</p>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref } from 'vue'

import SearchBar from '@/components/common/form/SearchBar.vue'
import BaseButton from '@/components/common/button/BaseButton.vue'
import BaseTable from '@/components/common/table/BaseTable.vue'
import Pagination from '@/components/common/pagination/Pagination.vue'
import BaseModal from '@/components/common/modal/BaseModal.vue'

/* ===================== */
/* 검색 기준 옵션 */
/* ===================== */
const searchTypes = [
  { label: '전체', value: '' },
  { label: '고객명', value: 'CUSTOMER_NAME' },
  { label: '예약번호', value: 'RESERVATION_NO' },
  { label: '객실번호', value: 'ROOM_NO' },
]

const searchType = ref('')

/* ===================== */
/* 테이블 설정 */
/* ===================== */
const columns = [
  { key: 'reservationNo', label: '예약번호' },
  { key: 'customerName', label: '고객명' },
  { key: 'roomType', label: '객실유형' },
  { key: 'checkinDate', label: '투숙예정일' },
  { key: 'checkoutDate', label: '투숙종료일' },
  { key: 'status', label: '운영상태' },
]

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

/* ===================== */
/* 상태 */
/* ===================== */
const page = ref(1)
const showSimpleModal = ref(false)
const showActionModal = ref(false)
const showRowModal = ref(false)
const selectedRow = ref(null)

/* ===================== */
/* 이벤트 */
/* ===================== */
const onSearch = (keyword) => {
  console.log('[기본 검색]', keyword)
}

const onSearchWithType = ({ keyword, type }) => {
  console.log('[기준 검색]', { type, keyword })
}

const onDetail = () => {
  console.log('상세 검색 클릭')
}

const onPageChange = (p) => {
  page.value = p
}

const openSimpleModal = () => {
  showSimpleModal.value = true
}

const openActionModal = () => {
  showActionModal.value = true
}

const confirmAction = () => {
  console.log('확인 클릭')
  showActionModal.value = false
}

const openRowModal = (row) => {
  selectedRow.value = row
  showRowModal.value = true
}

const closeRowModal = () => {
  showRowModal.value = false
  selectedRow.value = null
}
</script>

<style scoped>
.test-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.block {
  background: #ffffff;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #eef2f7;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.block h3 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.button-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.debug {
  font-size: 13px;
  color: #6b7280;
}
</style>

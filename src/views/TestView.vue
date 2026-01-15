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
          placeholder="고객명 또는 예약번호 검색"
          @search="onSearchWithType"
          @detail="onDetail"
      />
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
      <h3>테이블 + 페이징 (정렬 포함)</h3>

      <TableWithPaging
          :columns="columns"
          :rows="rows"
          :pageSize="5"
          @row-click="openRowModal"
      />
    </section>

    <!-- ===================== -->
    <!-- 7. 통합 ListView -->
    <!-- ===================== -->
    <section class="block" style="border: 2px solid red">
      <h3>통합 ListView (Search + Filter + Sort + Paging + Detail)</h3>

      <ListView
          :columns="columns"
          :rows="rows"
          :filters="filters"
          :searchTypes="searchTypes"
          show-detail
          v-model:detail="detailForm"
          @row-click="openRowModal"
      >
        <!-- 상세검색 폼 슬롯 -->
        <template #detail-form>
          <div class="detail-form">
            <div class="row">
              <label>고객명</label>
              <input
                  v-model="detailForm.customerName"
                  placeholder="고객명 입력"
              />
            </div>

            <div class="row">
              <label>예약번호</label>
              <input
                  v-model="detailForm.reservationNo"
                  placeholder="예약번호 입력"
              />
            </div>

            <div class="row">
              <label>운영상태</label>
              <select v-model="detailForm.status">
                <option value="">전체</option>
                <option value="투숙중">투숙중</option>
                <option value="체크인예정">체크인예정</option>
              </select>
            </div>

            <p class="hint">
              * 적용: 모달 닫히면서 바로 리스트에 반영됨<br />
              * 초기화: 입력값이 비워지고 전체 리스트로 복귀
            </p>
          </div>
        </template>
      </ListView>
    </section>

    <!-- ===================== -->
    <!-- 모달 영역 -->
    <!-- ===================== -->
    <BaseModal
        v-if="showSimpleModal"
        title="공통 모달 테스트"
        @close="showSimpleModal = false"
    >
      <p>이 모달은 기본 footer(닫기 버튼)를 사용합니다.</p>
    </BaseModal>

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
import BaseModal from '@/components/common/modal/BaseModal.vue'
import TableWithPaging from '@/components/common/table/TableWithPaging.vue'
import ListView from '@/components/common/ListView.vue'

/* ===================== */
/* 필터 */
const filters = [
  {
    key: 'status',
    options: [
      { label: '운영상태', value: '' },
      { label: '투숙중', value: '투숙중' },
      { label: '체크인예정', value: '체크인예정' },
    ],
  },
  {
    key: 'roomType',
    options: [
      { label: '객실유형', value: '' },
      { label: '디럭스', value: '디럭스' },
      { label: '스위트', value: '스위트' },
    ],
  },
]

/* ===================== */
/* 검색 기준 */
const searchTypes = [
  { label: '전체', value: '' },
  { label: '고객명', value: 'CUSTOMER_NAME' },
  { label: '예약번호', value: 'RESERVATION_NO' },
  { label: '객실번호', value: 'ROOM_NO' },
]

/* ===================== */
/* 테이블 */
const columns = [
  { key: 'reservationNo', label: '예약번호', sortable: true, align: 'center' },
  { key: 'customerName', label: '고객명', sortable: true, align: 'center' },
  { key: 'roomType', label: '객실유형', sortable: true, align: 'center' },
  { key: 'checkinDate', label: '투숙예정일', sortable: true, align: 'center' },
  { key: 'checkoutDate', label: '투숙종료일', sortable: true, align: 'center' },
  { key: 'status', label: '운영상태', sortable: true, align: 'center' },
]

const rows = ref(
    [...Array(11)].map((_, i) => ({
      id: i + 1,
      reservationNo: String(i + 1),
      customerName: ['김철수', '이영희', '박고객', '김고객'][i % 4],
      roomType: i % 2 ? '스위트' : '디럭스',
      checkinDate: '2025/12/28',
      checkoutDate: '2025/12/29',
      status: i % 3 ? '체크인예정' : '투숙중',
    }))
)

/* ===================== */
/* 상세검색 테스트 상태 (ListView와 v-model로 연결됨) */
const detailForm = ref({
  customerName: '',
  reservationNo: '',
  status: '',
})

/* ===================== */
/* 모달 */
const showSimpleModal = ref(false)
const showActionModal = ref(false)
const showRowModal = ref(false)
const selectedRow = ref(null)

const openSimpleModal = () => (showSimpleModal.value = true)
const openActionModal = () => (showActionModal.value = true)
const confirmAction = () => (showActionModal.value = false)

const openRowModal = (row) => {
  selectedRow.value = row
  showRowModal.value = true
}

const closeRowModal = () => {
  showRowModal.value = false
  selectedRow.value = null
}

/* ===================== */
/* 테스트용 로그 */
const onSearch = (v) => console.log('[검색]', v)
const onSearchWithType = (v) => console.log('[기준 검색]', v)
const onDetail = () => console.log('[상세 검색]')
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
}

.block {
  background: white;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #eef2f7;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.button-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-form .row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-form label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.detail-form input,
.detail-form select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-size: 14px;
}

.hint {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}
</style>

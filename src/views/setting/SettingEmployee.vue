<template>
  <div class="activity-all-page">



    <ListView
        :columns="columns"
        :rows="employeeList"
        :filters="filters"
        :searchTypes="searchTypes"
        show-detail
        v-model:detail="detailForm"
        @row-click="openRowModal"
    >

      <template #detail-form>
        <div class="detail-form">
          <div class="row">
            <label>직원 명</label>
            <input v-model="detailForm.employeeName" />
          </div>

          <div class="row">
            <label>사번</label>
            <input v-model="detailForm.employeeNumber" />
          </div>

          <div class="row">
            <label>전화번호</label>
            <input v-model="detailForm.phoneNumber" />
          </div>

          <div class="row">
            <label>이메일</label>
            <input v-model="detailForm.email" />
          </div>


        </div>
      </template>
    </ListView>





    <BaseModal
        v-if="showRowModal"
        title="직원 상세"
        @close="closeRowModal"
    >
      <div v-if="employeeDetail" class="detail-view">
        <p><b>사번:</b> {{ employeeDetail.employeeNumber }}</p>
        <p><b>로그인ID:</b> {{ employeeDetail.loginId }}</p>
        <p><b>이름:</b> {{ employeeDetail.name }}</p>
        <p><b>전화:</b> {{ employeeDetail.phone }}</p>
        <p><b>이메일:</b> {{ employeeDetail.email }}</p>
        <p><b>부서:</b> {{ employeeDetail.departmentName }}</p>
        <p><b>직책:</b> {{ employeeDetail.hotelPositionName }}</p>
        <p><b>지점:</b> {{ employeeDetail.propertyName }}</p>
        <p><b>호텔그룹:</b> {{ employeeDetail.hotelGroupName }}</p>
        <p><b>권한:</b> {{ employeeDetail.permissionName }}</p>
        <p><b>상태:</b> {{ employeeDetail.employeeStatus }}</p>
      </div>
    </BaseModal>
  </div>
</template>


<script setup>
import {onMounted, ref} from 'vue'

import ListView from '@/components/common/ListView.vue'
import BaseModal from '@/components/common/modal/BaseModal.vue'
import {getEmployeeDetail, getEmployeeList} from "@/api/setting/employeeApi.js";


const employeeList=ref([]);
const employeeDetail=ref([]);


const searchTypes = [
  { label: '전체', value: '' },
  { label: '부서', value: 'departmentName' },
  { label: '직책', value: 'hotelPositionName' },
  { label: '이름', value: 'employeeName' }
]


const filters = [
  {
    key: 'employeeStatus',
    options: [
      { label: '상태', value: '' },
      { label: 'ACTIVE', value: 'ACTIVE' },
      { label: 'LOCKED', value: 'LOCKED' },
      { label: 'DORMANCY', value: 'DORMANCY' },
    ],
  }
]


const columns = [
  { key: 'employeeNumber', label: '사번', align: 'center',sortable: true },
  { key: 'departmentName', label: '부서',sortable: true },
  { key: 'hotelPositionName', label: '직책', align: 'center',sortable: true },
  { key: 'employeeName', label: '이름', align: 'center' ,sortable: true},
  { key: 'phoneNumber', label: '전화번호', align: 'center' ,sortable: true},
  { key: 'loginId', label: '아이디', align: 'center' ,sortable: true},
  { key: 'email', label: '이메일', align: 'center' ,sortable: true},
  { key: 'employeeStatus', label: '상태', align: 'center' ,sortable: true},
]



const detailForm = ref({
  employeeName: '',
  employeeNumber: '',
  phoneNumber : '',
  email: '',
})

/* ===================== */
/* Row Modal */
/* ===================== */
const showRowModal = ref(false)

const openRowModal = async (row) => {
  const employeeCode = row.employeeCode;
  employeeDetail.value=await getEmployeeDetail(employeeCode);
  showRowModal.value = true
}

const closeRowModal = () => {
  showRowModal.value = false
  employeeDetail.value = null
}
const openActionModal = () => {
  console.log('openActionModal');
};

onMounted(async () => {
  employeeList.value = await getEmployeeList();
});
</script>


<style scoped>
.activity-all-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 20px;
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
}

.detail-view p {
  margin: 6px 0;
}
.button-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>

<template>
  <div class="system-my-page">
    <!-- 1. 내 정보 섹션 -->
    <section class="page-section">
      <div class="section-header">
        <h3>내 정보</h3>
      </div>

      <div class="detail-container">
        <!-- 1행: 성명 / 아이디 -->
        <div class="row">
          <div class="col">
            <label>성명</label>
            <input type="text" :value="myInfo.name" readonly class="read-only" />
          </div>
          <div class="col">
            <label>아이디</label>
            <input type="text" :value="myInfo.loginId" readonly class="read-only" />
          </div>
        </div>

        <!-- 2행: 사원번호 / 입사일자 -->
        <div class="row">
          <div class="col">
            <label>사원번호</label>
            <input type="text" :value="myInfo.employeeNumber" readonly class="read-only" />
          </div>
          <div class="col">
            <label>입사일자</label>
            <input type="text" :value="formatDate(myInfo.hiredAt)" readonly class="read-only" />
          </div>
        </div>

        <!-- 3행: 부서 / 직급 -->
        <div class="row">
          <div class="col">
            <label>부서</label>
            <input type="text" :value="myInfo.departmentName" readonly class="read-only" />
          </div>
          <div class="col">
            <label>직급</label>
            <input type="text" :value="myInfo.hotelPositionName" readonly class="read-only" />
          </div>
        </div>

        <!-- 4행: 권한 / 전화번호 -->
        <div class="row">
          <div class="col">
            <label>권한</label>
             <input type="text" :value="myInfo.permissionName" readonly class="read-only" />
          </div>
          <div class="col">
            <label>전화번호</label>
            <input type="text" :value="myInfo.phone" readonly class="read-only" />
          </div>
        </div>

        <!-- 5행: 이메일 (Full Width) -->
        <div class="row">
          <div class="col full-width">
            <label>이메일</label>
            <input type="text" :value="myInfo.email" readonly class="read-only" />
          </div>
        </div>
      </div>
    </section>

    <hr class="divider" />

    <!-- 2. 비밀번호 변경 섹션 -->
    <section class="page-section">
      <div class="section-header flex-between">
        <h3>비밀번호 변경</h3>
        <BaseButton @click="onChangePassword">비밀번호 변경</BaseButton>
      </div>

      <div class="detail-container">
        <div class="row">
           <div class="col">
            <label>현재 비밀번호</label>
            <input type="password" v-model="passwordForm.currentPassword" />
          </div>
           <div class="col">
            <label>신규 비밀번호</label>
            <input type="password" v-model="passwordForm.newPassword" />
          </div>
           <div class="col">
            <label>신규 비밀번호 확인</label>
            <input type="password" v-model="passwordForm.confirmPassword" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from "@/stores/authStore";
import { getEmployeeList } from "@/api/setting/employeeApi.js";
import { changePassword } from "@/api/system/myPageApi.js";
import BaseButton from "@/components/common/button/BaseButton.vue";

const authStore = useAuthStore();
const myInfo = ref({
  loginId: '',
  name: '',
  phone: '',
  departmentName: '',
  email: '',
  hotelPositionName: '',
  employeeStatus: '',
  employeeNumber: '',
  hiredAt: '',
  permissionName: ''
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 날짜 포맷팅
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return dateStr.substring(0, 10)
}

onMounted(async () => {
  try {
    const employeeList = await getEmployeeList();
    const currentLoginId = authStore.user?.loginId;
    
    if (currentLoginId) {
      const found = employeeList.find(emp => emp.loginId === currentLoginId);
      if (found) {
        myInfo.value = {
          loginId: found.loginId,
          name: found.employeeName,
          phone: found.phoneNumber,
          departmentName: found.departmentName,
          email: found.email,
          hotelPositionName: found.hotelPositionName,
          employeeStatus: found.employeeStatus,
          employeeNumber: found.employeeNumber,
          hiredAt: found.hiredAt,
          permissionName: found.permissionName
        };
      }
    }
  } catch (e) {
    console.error("내 정보 불러오기 실패", e);
  }
});

const onChangePassword = async () => {
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword) {
    alert("비밀번호를 입력해주세요.");
    return;
  }

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert("새 비밀번호가 일치하지 않습니다.");
    return;
  }

  try {
    await changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    });
    alert("비밀번호가 변경되었습니다.");
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
  } catch (e) {
    console.error("비밀번호 변경 실패", e);
    alert("비밀번호 변경에 실패했습니다.");
  }
};
</script>

<style scoped>
.system-my-page {
  display: flex;
  flex-direction: column;
  gap: 40px; /* Increased gap between sections */
  padding: 40px 0; /* More top/bottom padding */
  max-width: 800px; /* Limit width to resemble modal */
  margin: 0 auto; /* Center the form (optional, depending on preference, but usually good for focused tasks) */
}

.page-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #374151;
}

.section-header.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #374151;
  padding-bottom: 12px;
}

.section-header.flex-between h3 {
    border-bottom: none;
    padding-bottom: 0;
}

.divider {
  border: 0;
  height: 1px;
  background-color: #e5e7eb;
  margin: 0;
}

/* Detail Modal Styles Reused */
.detail-container {
  display: flex;
  flex-direction: column;
  gap: 24px; /* Increased from 16px */
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
  width: 100%; /* Ensure full width in cols */
}

input:focus {
  border-color: #2563eb;
  outline: none;
}

input.read-only {
  background-color: #f3f4f6;
  color: #6b7280;
  cursor: default; /* Changed from not-allowed for MyPage to look cleaner */
}
</style>
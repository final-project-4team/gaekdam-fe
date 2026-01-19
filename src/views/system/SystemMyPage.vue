<template>
  <div class="system-my-page">
    <!-- 1. 내 정보 섹션 -->
    <section class="page-section">
      <div class="section-header">
        <h3>내 정보</h3>
      </div>

      <div class="form-container">
        <!-- 첫 번째 줄: 아이디 / 이름 -->
        <div class="form-row two-col">
          <div class="form-group">
            <label>아이디</label>
            <input type="text" :value="myInfo.loginId" readonly class="read-only" />
          </div>
          <div class="form-group">
            <label>이름</label>
            <input type="text" :value="myInfo.name" />
          </div>
        </div>

        <!-- 두 번째 줄: 전화번호 / 부서 -->
        <div class="form-row two-col">
          <div class="form-group">
            <label>전화번호</label>
            <input type="text" :value="myInfo.phone" />
          </div>
          <div class="form-group">
            <label>부서</label>
            <div class="fake-select read-only">
              {{ myInfo.departmentName }}
              <span class="arrow">▼</span>
            </div>
          </div>
        </div>

        <!-- 세 번째 줄: 이메일 / 직급 -->
        <div class="form-row two-col">
          <div class="form-group">
            <label>이메일</label>
            <input type="text" :value="myInfo.email" readonly class="read-only" />
          </div>
          <div class="form-group">
            <label>직급</label>
            <div class="fake-select read-only">
              {{ myInfo.hotelPositionName }}
              <span class="arrow">▼</span>
            </div>
          </div>
        </div>

        <!-- 네 번째 줄: 사용자 상태 -->
        <div class="form-row">
          <div class="form-group half-width">
            <label>사용자 상태</label>
            <input type="text" :value="myInfo.employeeStatus" readonly class="read-only" />
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

      <div class="form-container">
        <div class="form-row three-col">
          <div class="form-group">
            <label>현재 비밀번호</label>
            <input type="password" v-model="passwordForm.currentPassword" />
          </div>
          <div class="form-group">
            <label>신규 비밀번호</label>
            <input type="password" v-model="passwordForm.newPassword" />
          </div>
          <div class="form-group">
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
import { changePassword } from "@/api/myPageApi.js";
import BaseButton from "@/components/common/button/BaseButton.vue";

const authStore = useAuthStore();
const myInfo = ref({
  loginId: '',
  name: '',
  phone: '',
  departmentName: '',
  email: '',
  hotelPositionName: '',
  employeeStatus: ''
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

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
          employeeStatus: found.employeeStatus
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
  gap: 32px;
  padding: 10px 0; /* 내부 여백 */
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

/* BaseButton 때문에 높이 안맞는 문제 해결 */
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

/* 폼 스타일 유지 */
.form-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-row {
  display: flex;
  gap: 24px;
}

.two-col > .form-group {
  flex: 1;
}

.three-col > .form-group {
  flex: 1;
}

.half-width {
  width: calc(50% - 12px);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.form-group input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #111827;
}

.form-group input:focus {
  border-color: #2563eb;
  outline: none;
}

.form-group input.read-only {
  background-color: #f3f4f6;
  color: #4b5563;
}

.fake-select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background-color: #f3f4f6;
  color: #4b5563;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fake-select .arrow {
  font-size: 10px;
  color: #6b7280;
}
</style>
<template>
  <div class="login-page">
    <div class="login-card">
      <h2>직원 로그인</h2>

      <div class="form-row">
        <label>아이디</label>
        <input
            v-model="loginId"
            type="text"
            placeholder="아이디 입력"
        />
      </div>

      <div class="form-row">
        <label>비밀번호</label>
        <input
            v-model="password"
            type="password"
            placeholder="비밀번호 입력"
        />
      </div>

      <button
          class="login-button"
          :disabled="loading"
          @click="onLogin"
      >
        {{ loading ? "로그인 중..." : "로그인" }}
      </button>

      <p v-if="errorMessage" class="error">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loginId = ref("");
const password = ref("");
const errorMessage = ref("");
const loading = ref(false);

const onLogin = async () => {
  errorMessage.value = "";
  loading.value = true;

  const result = await authStore.login({
    loginId: loginId.value,
    password: password.value,
  });

  loading.value = false;

  if (!result.success) {
    errorMessage.value = "아이디 또는 비밀번호가 올바르지 않습니다.";
    return;
  }

  // 원래 가려던 페이지로 이동
  const redirectPath = route.query.redirect || "/";
  router.push(redirectPath);
};
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
}

.login-card {
  width: 360px;
  padding: 24px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-card h2 {
  margin-bottom: 8px;
  text-align: center;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row label {
  font-size: 13px;
  font-weight: 600;
}

.form-row input {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.login-button {
  margin-top: 8px;
  padding: 12px;
  border-radius: 8px;
  border: none;
  background: #2563eb;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #dc2626;
  font-size: 13px;
  text-align: center;
}
</style>

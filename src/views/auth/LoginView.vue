<template>
  <el-card class="card">
    <div class="header">
      <div class="sub">고객을 담다</div>
      <div class="brand">gaekdam</div>
      <h2>로그인</h2>
    </div>

    <el-form :model="form" @submit.prevent="onSubmit">
      <el-form-item label="아이디">
        <el-input v-model="form.loginId" />
      </el-form-item>

      <el-form-item label="비밀번호">
        <el-input v-model="form.password" type="password" show-password />
      </el-form-item>

      <el-button type="primary" class="btn" @click="onSubmit">로그인</el-button>
    </el-form>
  </el-card>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { loginApi } from '@/api/auth.api'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  loginId: '',
  password: '',
})

const onSubmit = async () => {

  const res = await loginApi(form)

  const token = res.data?.data?.accessToken || res.data?.accessToken
  const user = res.data?.data?.user || res.data?.user || null

  auth.setAuth(token, user)
  router.push('/reservations')
}
</script>

<style scoped>
.card { width: 420px; }
.header { text-align: center; margin-bottom: 12px; }
.sub { color: #7b8794; font-size: 12px; }
.brand { font-weight: 700; margin-top: 4px; }
.btn { width: 100%; }
</style>

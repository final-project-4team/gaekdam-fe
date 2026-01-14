<template>
  <aside class="side">
    <div class="hotel">Hotel Name</div>

    <div class="menu" @click="go('/reports')">리포트</div>
    <div class="menu" @click="go('/customers')">고객관리</div>
    <div class="menu active" @click="go('/activities')">고객활동</div>
    <div class="menu" @click="go('/voc')">고객의소리</div>
    <div class="menu" @click="go('/survey')">고객설문</div>
    <div class="menu" @click="go('/messages')">메시지</div>
    <div class="menu" @click="go('/setting')">세팅</div>
    <div class="menu" @click="go('/system')">시스템설정</div>
  </aside>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const go = (path) => router.push(path)
</script>

<style scoped>
.side {
  width: 220px;
  background: #fff;
  border-right: 1px solid #e6eaf0;
}
.hotel {
  height: 56px;
  display: flex;
  align-items: center;
  padding-left: 16px;
  font-weight: 600;
}
.menu {
  padding: 14px 16px;
  cursor: pointer;
}
.menu:hover { background: #f0f4f8; }
.active { background: #e6f0ff; }
</style>

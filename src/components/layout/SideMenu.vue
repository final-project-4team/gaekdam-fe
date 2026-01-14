<template>
  <div class="side">
    <div class="logo">Hotel Name</div>

    <el-menu :default-active="active" class="menu" router>
      <el-menu-item index="/reservations">고객관리</el-menu-item>
      <el-menu-item index="/messages">메시지</el-menu-item>
      <el-menu-item index="/setting">세팅</el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = computed(() => route.path)
</script>

<style scoped>
.side {
  width: 220px;
  background: #ffffff;
  border-right: 1px solid #eaeef5;
}
.logo {
  padding: 16px;
  font-weight: 700;
  border-bottom: 1px solid #eaeef5;
}
.menu {
  border-right: none;
}
</style>
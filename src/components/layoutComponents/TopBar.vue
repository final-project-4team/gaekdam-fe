<template>
  <header class="top-bar">
    <div class="left"></div>

    <div class="center" @click="goTestPage">
      고객을 담다 <br />
      <span class="brand">客談</span>
    </div>

    <div class="right">
      <div class="user-wrapper" @click="toggleMenu">
        <span class="user">{{ loginId }}</span>

        <!-- 드롭다운 -->
        <div v-if="showMenu" class="dropdown">

           <div class="item">마이페이지</div>

          <div class="item logout" @click.stop="logout">
            로그아웃
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const authStore = useAuthStore();

const showMenu = ref(false);

const loginId = computed(() => authStore.user?.loginId || "");

const toggleMenu = () => {
  showMenu.value = !showMenu.value;
};

const logout = async () => {
  await authStore.logout();
  showMenu.value = false;
};

const goTestPage = () => {
  router.push("/");
};
</script>

<style scoped>
.top-bar {
  height: 56px;
  background: #5b6b7a;
  color: white;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 20px;
}

.center {
  justify-self: center;
  font-size: 12px;
  cursor: pointer;
}

.brand {
  margin-left: 15px;
}

.right {
  justify-self: end;
  position: relative;
}

/* 유저 영역 */
.user-wrapper {
  position: relative;
  cursor: pointer;
}

.user {
  font-weight: 500;
}

/* 드롭다운 */
.dropdown {
  position: absolute;
  top: 28px;
  right: 0;
  background: white;
  color: #111827;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  min-width: 120px;
  overflow: hidden;
  z-index: 100;
}

.item {
  padding: 10px 14px;
  font-size: 14px;
  cursor: pointer;
}

.item:hover {
  background: #f3f4f6;
}

.logout {
  color: #dc2626;
}
</style>

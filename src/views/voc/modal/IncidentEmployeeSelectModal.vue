<template>
  <BaseModal title="직원 검색" @close="$emit('close')">
    <div class="wrap">
      <div class="search">
        <input
            v-model="keyword"
            placeholder="이름으로 검색(정확히)"
            @keyup.enter="search"
        />
        <BaseButton type="primary" size="sm" @click="search">검색</BaseButton>
      </div>

      <div class="list">
        <div
            v-for="e in rows"
            :key="e.employeeCode"
            class="item"
            @click="select(e)"
        >
          <div class="name">{{ e.employeeName || "-" }}</div>
          <div class="sub">{{ e.loginId || "-" }}</div>
        </div>

        <div v-if="!rows.length" class="empty">검색 결과가 없습니다.</div>
      </div>

      <div class="paging">
        <BaseButton type="ghost" size="sm" :disabled="page <= 1" @click="prev">이전</BaseButton>
        <span class="p">{{ page }}</span>
        <BaseButton type="ghost" size="sm" :disabled="rows.length < size" @click="next">다음</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref } from "vue";
import BaseModal from "@/components/common/modal/BaseModal.vue";
import BaseButton from "@/components/common/button/BaseButton.vue";
import { getEmployeeList } from "@/api/setting/employeeApi"; // 기존 파일 그대로 사용

const emit = defineEmits(["close", "select"]);

const keyword = ref("");
const rows = ref([]);

const page = ref(1);
const size = ref(10);

const search = async () => {
  page.value = 1;
  await load();
};

const load = async () => {
  const name = keyword.value?.trim();

  const data = await getEmployeeList({
    page: page.value,
    size: size.value,
    filters: {},
    // 이름 정확 일치 검색만 사용 (employeeApi 내부에서 name: detail.employeeName || detail.keyword)
    detail: { employeeName: name || undefined },
    sort: { sortBy: "created_at", direction: "DESC" },
  });

  rows.value = data?.content ?? [];
};

const prev = async () => {
  if (page.value <= 1) return;
  page.value -= 1;
  await load();
};

const next = async () => {
  page.value += 1;
  await load();
};

const select = (e) => {
  emit("select", e);
};
</script>

<style scoped>
.wrap { display: flex; flex-direction: column; gap: 12px; }
.search { display: flex; gap: 8px; align-items: center; }
.search input {
  flex: 1; padding: 9px 10px; border-radius: 10px;
  border: 1px solid #e5e7eb; font-size: 14px;
}
.list { border: 1px solid #e7edf4; border-radius: 12px; overflow: hidden; }
.item {
  padding: 12px 14px; cursor: pointer;
  border-bottom: 1px solid #eef2f7;
}
.item:hover { background: #f9fafb; }
.name { font-weight: 800; }
.sub { font-size: 12px; color: #6b7280; margin-top: 2px; }
.empty { padding: 14px; text-align: center; color: #6b7280; }
.paging { display: flex; justify-content: center; align-items: center; gap: 10px; }
.p { font-weight: 800; }
</style>

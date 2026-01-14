<template>
  <div class="table-wrapper">
    <table class="base-table">
      <thead>
      <tr>
        <th v-for="col in columns" :key="col.key">
          {{ col.label }}
        </th>
      </tr>
      </thead>

      <tbody>
      <tr
          v-for="row in rows"
          :key="row.id"
          class="table-row"
          @click="$emit('row-click', row)"
      >
        <td v-for="col in columns" :key="col.key">
          {{ row[col.key] }}
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  columns: Array,
  rows: Array,
})
</script>

<style scoped>
.table-wrapper {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e6eaf0;
}

.base-table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f8fafc;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  padding: 12px;
  color: #475569;
}

td {
  padding: 12px;
  font-size: 14px;
  border-top: 1px solid #eef2f7;
}

.table-row {
  transition: background 0.15s ease;
  cursor: pointer;
}

.table-row:hover {
  background: #f1f5ff;
}
</style>

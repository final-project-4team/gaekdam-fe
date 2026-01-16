<template>
  <div class="filters">
    <select
        v-for="filter in filters"
        :key="filter.key"
        :value="values[filter.key]"
        @change="e => onChange(filter.key, e.target.value)"
    >
      <option
          v-for="opt in filter.options"
          :key="opt.value"
          :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const props = defineProps({
  filters: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['change'])

const values = reactive({})

props.filters.forEach(f => {
  values[f.key] = ''
})

const onChange = (key, value) => {
  values[key] = value
  emit('change', { ...values })
}
</script>

<style scoped>
.filters {
  display: flex;
  gap: 8px;
}

select {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 13px;
}
</style>

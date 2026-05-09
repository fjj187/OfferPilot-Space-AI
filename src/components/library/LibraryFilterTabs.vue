<script lang="ts" setup>
interface FilterTab {
  key: string
  label: string
}

interface Props {
  tabs: FilterTab[]
  activeKey: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  change: [key: string]
}>()

const isActive = (key: string) => props.activeKey === key
</script>

<template>
  <div class="filter-row">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="filter-chip"
      :class="{ 'is-active': isActive(tab.key) }"
      @click="emit('change', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-chip {
  padding: 10px 16px;
  border: 1px solid #e3e9f4;
  border-radius: 999px;
  background: rgb(255 255 255 / 82%);
  color: #66758f;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.filter-chip.is-active,
.filter-chip:hover {
  border-color: #d8e0ff;
  background: #eef2ff;
  color: #5c72ef;
}
</style>

<script lang="ts" setup>
interface SummaryItem {
  label: string
  value: string
}

defineProps<{
  items: SummaryItem[]
  columns?: 1 | 2 | 3 | 4
}>()
</script>

<template>
  <section
    class="context-grid"
    :style="{ gridTemplateColumns: `repeat(${columns || 3}, minmax(0, 1fr))` }"
  >
    <div
      v-for="item in items"
      :key="item.label"
      class="context-card"
    >
      <div class="context-label">{{ item.label }}</div>
      <div class="context-value">{{ item.value }}</div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.context-grid {
  display: grid;
  gap: 16px;
}

.context-card {
  padding: 20px;
  border: 1px solid #e8edf6;
  border-radius: 20px;
  background: rgb(255 255 255 / 90%);
}

.context-label {
  font-size: 12px;
  color: #8d98b0;
}

.context-value {
  margin-top: 10px;
  font-size: 20px;
  font-weight: 700;
  color: #1f2746;
  text-transform: capitalize;
}

@media (max-width: 900px) {
  .context-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>

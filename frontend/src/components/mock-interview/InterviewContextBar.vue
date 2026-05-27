<script lang="ts" setup>
interface ContextItem {
  label: string
  value: string
}

defineProps<{
  items: ContextItem[]
}>()
</script>

<template>
  <section class="context-bar">
    <div
      v-for="item in items"
      :key="item.label"
      class="context-item"
    >
      <div class="context-label">{{ item.label }}</div>
      <div class="context-value">{{ item.value }}</div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.context-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.context-item {
  padding: 16px 18px;
  border: 1px solid #e8edf6;
  border-radius: 18px;
  background: rgb(255 255 255 / 90%);
}

.context-label {
  font-size: 12px;
  color: #8a96ac;
}

.context-value {
  margin-top: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #1f2746;
}

@media (max-width: 1200px) {
  .context-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .context-bar {
    grid-template-columns: 1fr;
  }
}
</style>

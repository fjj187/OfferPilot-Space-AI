<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  caption?: string
  loading?: boolean
  empty?: boolean
  error?: string
}>(), {
  caption: '',
  error: ''
})
</script>

<template>
  <section class="analytics-chart-panel">
    <header class="analytics-chart-panel__header">
      <div>
        <h3>{{ title }}</h3>
        <p v-if="caption">{{ caption }}</p>
      </div>
    </header>

    <div
      v-if="loading"
      class="analytics-chart-panel__state"
    >
      数据加载中
    </div>
    <div
      v-else-if="error"
      class="analytics-chart-panel__state analytics-chart-panel__state--error"
    >
      {{ error }}
    </div>
    <div
      v-else-if="empty"
      class="analytics-chart-panel__state"
    >
      暂无可视化数据
    </div>
    <slot v-else></slot>
  </section>
</template>

<style lang="scss" scoped>
.analytics-chart-panel {
  min-width: 0;
  padding: 18px;
  border: 1px solid rgb(148 199 255 / 0.16);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgb(10 27 47 / 0.82), rgb(6 16 30 / 0.88)),
    rgb(7 17 32 / 0.92);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.06);
}

.analytics-chart-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.analytics-chart-panel__header h3 {
  margin: 0;
  color: #f6fbff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
}

.analytics-chart-panel__header p {
  margin: 6px 0 0;
  color: rgb(219 237 255 / 0.66);
  font-size: 13px;
  line-height: 1.6;
}

.analytics-chart-panel__state {
  display: grid;
  min-height: 220px;
  place-items: center;
  border: 1px dashed rgb(169 210 255 / 0.22);
  border-radius: 8px;
  color: rgb(224 238 255 / 0.72);
  font-size: 14px;
}

.analytics-chart-panel__state--error {
  border-color: rgb(255 136 136 / 0.28);
  color: #ffc9bd;
}
</style>

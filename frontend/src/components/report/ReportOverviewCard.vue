<script lang="ts" setup>
defineProps<{
  answeredText: string
  statusText: string
  modeText: string
  sourceText: string
  startedAt: string
  finishedAt: string
}>()
</script>

<template>
  <section class="overview-card">
    <div class="overview-grid">
      <div class="overview-item">
        <div class="label">已答题数</div>
        <div class="value">{{ answeredText }}</div>
      </div>
      <div class="overview-item">
        <div class="label">当前状态</div>
        <div class="value">{{ statusText }}</div>
      </div>
      <div class="overview-item">
        <div class="label">训练模式</div>
        <div class="value">{{ modeText }}</div>
      </div>
      <div class="overview-item">
        <div class="label">资料来源</div>
        <div class="value">{{ sourceText }}</div>
      </div>
      <div class="overview-item">
        <div class="label">开始时间</div>
        <div class="value small">{{ startedAt }}</div>
      </div>
      <div class="overview-item">
        <div class="label">结束时间</div>
        <div class="value small">{{ finishedAt }}</div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.overview-card {
  padding: 22px;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 6%);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.overview-item {
  padding: 16px 18px;
  border-radius: 18px;
  background: #f8faff;
}

.label {
  font-size: 12px;
  color: #8b97ad;
}

.value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 700;
  color: #1f2746;
}

.value.small {
  font-size: 14px;
  line-height: 1.7;
}

@media (max-width: 1200px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>

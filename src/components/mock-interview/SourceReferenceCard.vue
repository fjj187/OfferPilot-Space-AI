<script lang="ts" setup>
defineProps<{
  source: string
  docType: string
  reference: string
  tags: string[]
}>()
</script>

<template>
  <section class="reference-card">
    <div class="section-kicker">文档命中</div>
    <h3>当前问题来自哪里</h3>

    <div class="reference-grid">
      <div class="reference-item">
        <div class="reference-label">来源标识</div>
        <div class="reference-value">{{ source }}</div>
      </div>
      <div class="reference-item">
        <div class="reference-label">文档类型</div>
        <div class="reference-value">{{ docType }}</div>
      </div>
      <div class="reference-item full">
        <div class="reference-label">命中文档</div>
        <div class="reference-value">{{ reference }}</div>
      </div>
    </div>

    <div class="tag-list">
      <span
        v-for="tag in tags"
        :key="tag"
        class="tag-chip"
      >
        {{ tag }}
      </span>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.reference-card {
  padding: 20px;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 7%);
}

.section-kicker {
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h3 {
  margin: 8px 0 0;
  font-size: 20px;
  color: #1f2746;
}

.reference-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.reference-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: #f8faff;
}

.reference-item.full {
  grid-column: 1 / -1;
}

.reference-label {
  font-size: 12px;
  color: #8a96ac;
}

.reference-value {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #1f2746;
  line-height: 1.6;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.tag-chip {
  padding: 8px 14px;
  border: 1px solid #dde4f4;
  border-radius: 999px;
  background: #fbfcff;
  font-size: 13px;
  font-weight: 600;
  color: #607293;
}
</style>

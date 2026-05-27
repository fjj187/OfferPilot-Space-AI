<script lang="ts" setup>
const emit = defineEmits<{
  primaryAction: []
  secondaryAction: []
}>()
</script>

<template>
  <div class="hero-panel">
    <div class="hero-copy">
      <div class="hero-badge">本周训练计划</div>
      <h1>把你的面试资料库，变成可追问、可复盘的 AI 面试官。</h1>
      <p>
        导入自己的 md 和 Word 面试资料，开始一轮更像真实场景的模拟面试，
        最后自动沉淀薄弱点报告和完整问卷。
      </p>
      <div class="hero-actions">
        <n-button
          type="primary"
          round
          size="large"
          @click="emit('primaryAction')"
        >
          导入资料并开始
        </n-button>
        <n-button
          ghost
          round
          size="large"
          color="#6c7df7"
          @click="emit('secondaryAction')"
        >
          查看复盘样例
        </n-button>
      </div>
    </div>

    <div class="hero-stats">
      <div class="stat-card stat-primary">
        <div class="stat-label">本周已训练</div>
        <div class="stat-value">08 次</div>
        <div class="stat-meta">连续 4 天保持输出</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">资料库文档</div>
        <div class="stat-value">24 份</div>
        <div class="stat-meta">共切分 312 个知识片段</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(220px, 0.75fr);
  gap: 18px;
  margin-bottom: 18px;
}

.hero-copy,
.stat-card {
  border: 1px solid #e8edf6;
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 7%);
}

.hero-copy {
  padding: 26px 28px;
  border-radius: 28px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 16px 0 14px;
  font-size: 34px;
  line-height: 1.15;
  color: #1d2440;
}

.hero-copy p {
  max-width: 90%;
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #6d7a92;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.hero-stats {
  display: grid;
  gap: 16px;
}

.stat-card {
  padding: 20px;
  border-radius: 24px;
}

.stat-primary {
  background: linear-gradient(135deg, #eff3ff 0%, #f5fbff 100%);
}

.stat-label {
  font-size: 12px;
  color: #8d98b0;
}

.stat-value {
  margin-top: 12px;
  font-size: 30px;
  font-weight: 700;
  color: #1e2642;
}

.stat-meta {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #697690;
}

@media (max-width: 1200px) {
  .hero-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .hero-copy h1 {
    font-size: 28px;
  }
}
</style>

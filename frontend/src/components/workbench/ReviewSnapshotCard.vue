<script lang="ts" setup>
interface Props {
  title: string
  statusText: string
  score: number
  delta: number
  highlights: string[]
}

defineProps<Props>()

const emit = defineEmits<{
  openReport: []
}>()
</script>

<template>
  <section class="rail-card accent-card">
    <div class="accent-top">
      <div>
        <div class="section-kicker">复盘快照</div>
        <h3>{{ title }}</h3>
      </div>
      <span class="pill-tag">{{ statusText }}</span>
    </div>

    <div class="snapshot-score">
      <div>
        <div class="score-label">综合表现</div>
        <div class="score-value">{{ score }} / 100</div>
      </div>
      <div class="score-trend">较上次 +{{ delta }}</div>
    </div>

    <ul class="snapshot-list">
      <li
        v-for="item in highlights"
        :key="item"
      >
        {{ item }}
      </li>
    </ul>

    <n-button
      type="primary"
      block
      round
      @click="emit('openReport')"
    >
      打开完整复盘报告
    </n-button>
  </section>
</template>

<style lang="scss" scoped>
.rail-card {
  padding: 20px;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 7%);
}

.accent-card {
  background: linear-gradient(180deg, #f8faff 0%, #ffffff 100%);
}

.accent-top,
.snapshot-score {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.accent-top h3 {
  margin: 6px 0 0;
  font-size: 22px;
  color: #1f2746;
}

.pill-tag {
  padding: 7px 12px;
  border-radius: 999px;
  background: #eef8f4;
  color: #2f8f67;
  font-size: 12px;
  font-weight: 700;
}

.snapshot-score {
  margin-top: 18px;
  padding: 16px 18px;
  border-radius: 18px;
  background: #f6f8fd;
}

.score-label {
  font-size: 12px;
  color: #8d98b0;
}

.score-value {
  margin-top: 8px;
  font-size: 30px;
  font-weight: 800;
  color: #1f2746;
}

.score-trend {
  font-size: 13px;
  font-weight: 700;
  color: #4ea77a;
}

.snapshot-list {
  margin: 16px 0 18px;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.7;
  color: #75829b;
}

.snapshot-list li + li {
  margin-top: 10px;
}
</style>

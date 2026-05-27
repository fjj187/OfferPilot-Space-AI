<script lang="ts" setup>
defineProps<{
  title: string
  desc: string
  hint: string
  followUps: string[]
  hintVisible: boolean
}>()
</script>

<template>
  <section class="guide-panel">
    <div class="section-kicker">AI 引导</div>
    <h3>{{ title }}</h3>
    <p class="guide-desc">{{ desc }}</p>

    <div
      v-if="hintVisible"
      class="hint-box"
    >
      <div class="hint-label">建议你先这样回答</div>
      <div class="hint-text">{{ hint }}</div>
    </div>

    <div class="followup-list">
      <div class="list-label">面试官可能继续追问</div>
      <div
        v-for="item in followUps"
        :key="item"
        class="followup-item"
      >
        {{ item }}
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.guide-panel {
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

.guide-desc {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: #7b88a0;
}

.hint-box {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid #dfe7ff;
  border-radius: 18px;
  background: linear-gradient(180deg, #f7f9ff 0%, #f3f6ff 100%);
}

.hint-label,
.list-label {
  font-size: 12px;
  font-weight: 700;
  color: #6076ff;
}

.hint-text {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.8;
  color: #37435e;
}

.followup-list {
  margin-top: 18px;
}

.followup-item {
  margin-top: 10px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f8faff;
  color: #55647f;
  font-size: 14px;
  line-height: 1.7;
}
</style>

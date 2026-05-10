<script lang="ts" setup>
defineProps<{
  stageLabel: string
  title: string
  prompt: string
  tags: string[]
  difficulty: string
  questionIndex: number
  total: number
  followUp?: string
}>()
</script>

<template>
  <section class="question-card">
    <div class="question-head">
      <div>
        <div class="eyebrow">{{ stageLabel }}</div>
        <h1>{{ title }}</h1>
      </div>
      <div class="question-meta">
        <span class="question-order">第 {{ questionIndex }} / {{ total }} 题</span>
        <span class="question-difficulty">{{ difficulty }}</span>
      </div>
    </div>

    <p class="question-prompt">{{ prompt }}</p>

    <div class="tag-list">
      <span
        v-for="tag in tags"
        :key="tag"
        class="tag-item"
      >{{ tag }}</span>
    </div>

    <div
      v-if="followUp"
      class="follow-up-box"
    >
      <div class="follow-up-label">当前追问</div>
      <div class="follow-up-text">{{ followUp }}</div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.question-card {
  padding: 28px;
  border: 1px solid #e8edf6;
  border-radius: 26px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 6%);
}

.question-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.eyebrow {
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h1 {
  margin: 10px 0 0;
  font-size: 42px;
  line-height: 1.16;
  color: #1d2440;
}

.question-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
  white-space: nowrap;
}

.question-order,
.question-difficulty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.question-order {
  background: #eef2ff;
  color: #6076ff;
}

.question-difficulty {
  border: 1px solid #dde4f1;
  color: #6f7c95;
}

.question-prompt {
  margin: 24px 0 0;
  font-size: 18px;
  line-height: 1.85;
  color: #62718c;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.tag-item {
  padding: 8px 14px;
  border: 1px solid #dde4f4;
  border-radius: 999px;
  background: #fbfcff;
  font-size: 13px;
  font-weight: 600;
  color: #607293;
}

.follow-up-box {
  margin-top: 24px;
  padding: 18px 20px;
  border: 1px solid #dfe7ff;
  border-radius: 20px;
  background: linear-gradient(180deg, #f7f9ff 0%, #f3f6ff 100%);
}

.follow-up-label {
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
}

.follow-up-text {
  margin-top: 8px;
  font-size: 15px;
  line-height: 1.8;
  color: #35415d;
}

@media (max-width: 1200px) {
  h1 {
    font-size: 34px;
  }
}

@media (max-width: 720px) {
  .question-card {
    padding: 22px;
  }

  .question-head {
    flex-direction: column;
  }

  .question-meta {
    align-items: flex-start;
  }

  h1 {
    font-size: 30px;
  }
}
</style>

<script lang="ts" setup>
import type { PersistedReportSummary } from '@/types/workbench'

defineProps<{
  summaries: PersistedReportSummary[]
  topicLabelMap: Record<string, string>
}>()

const emit = defineEmits<{
  openReport: [sessionId: string]
}>()
</script>

<template>
  <section class="history-card">
    <div class="section-kicker">报告 Summary</div>
    <h3>历史复盘摘要</h3>

    <div
      v-if="summaries.length"
      class="summary-list"
    >
      <article
        v-for="item in summaries"
        :key="item.id"
        class="summary-item"
      >
        <div class="summary-title">{{ topicLabelMap[item.topic] || item.topic }}</div>
        <div class="summary-meta">{{ item.source }}</div>

        <div class="summary-stats">
          <span>{{ item.answeredCount }} / {{ item.totalCount }} 题</span>
          <span>{{ item.weaknessTags.length }} 个薄弱点</span>
        </div>

        <div class="summary-time">{{ item.createdAt }}</div>

        <n-button
          size="small"
          secondary
          @click="emit('openReport', item.sessionId)"
        >
          查看详情
        </n-button>
      </article>
    </div>

    <p
      v-else
      class="empty-text"
    >
      当前还没有复盘摘要，先完成一轮训练并结束面试。
    </p>
  </section>
</template>

<style lang="scss" scoped>
.history-card {
  padding: 22px;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 6%);
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
  font-size: 22px;
  color: #1f2746;
}

.summary-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.summary-item {
  padding: 18px;
  border-radius: 20px;
  background: #f8faff;
}

.summary-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2746;
}

.summary-meta,
.summary-time {
  margin-top: 6px;
  font-size: 13px;
  color: #7b88a0;
}

.summary-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 12px 0;
  font-size: 13px;
  color: #5f6f8a;
}

.empty-text {
  margin: 18px 0 0;
  font-size: 14px;
  line-height: 1.8;
  color: #718099;
}
</style>

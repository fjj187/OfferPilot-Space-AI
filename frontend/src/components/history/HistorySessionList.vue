<script lang="ts" setup>
import type { PersistedInterviewSession } from '@/types/workbench'

defineProps<{
  sessions: PersistedInterviewSession[]
  topicLabelMap: Record<string, string>
}>()

const emit = defineEmits<{
  openReport: [sessionId: string, threadId?: string]
}>()

const modeLabelMap: Record<string, string> = {
  standard: '标准模拟',
  guided: '引导模式'
}

const statusLabelMap: Record<string, string> = {
  in_progress: '进行中',
  completed: '已完成',
  aborted: '已中断'
}

const sourceLabelMap: Record<string, string> = {
  'backend-session': '后端真实会话',
  overview: '总览页入口',
  library: '资料库入口',
  'hero-import': '导入资料入口'
}
</script>

<template>
  <section class="history-card">
    <div class="section-kicker">训练 Session</div>
    <h3>历史训练记录</h3>

    <div
      v-if="sessions.length"
      class="session-list"
    >
      <article
        v-for="item in sessions"
        :key="item.id"
        class="session-item"
      >
        <div class="session-head">
          <div>
            <div class="session-title">{{ topicLabelMap[item.topic] || item.topic }}</div>
            <div class="session-meta">{{ modeLabelMap[item.mode] || item.mode }} · {{ sourceLabelMap[item.source] || item.source }}</div>
          </div>
          <span
            class="session-status"
            :class="`is-${item.status}`"
          >
            {{ statusLabelMap[item.status] || item.status }}
          </span>
        </div>

        <div
          v-if="item.questionTitle"
          class="session-question"
        >
          {{ item.questionTitle }}
        </div>

        <div class="session-stats">
          <span>{{ item.answeredCount }} / {{ item.questionCount }} 题</span>
          <span>{{ item.weaknessTags.length }} 个薄弱点</span>
        </div>

        <div
          v-if="item.backendLatestAssistantMessage || item.backendLatestUserMessage"
          class="session-preview"
        >
          {{ item.backendLatestAssistantMessage || item.backendLatestUserMessage }}
        </div>

        <div class="session-time">
          {{ item.startedAt }}
        </div>

        <n-button
          size="small"
          secondary
          @click="emit('openReport', item.id, item.activeQuestionThreadId)"
        >
          查看对应报告
        </n-button>
      </article>
    </div>

    <p
      v-else
      class="empty-text"
    >
      当前还没有历史训练 session，先去完成一轮模拟面试。
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

.session-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.session-item {
  padding: 18px;
  border-radius: 20px;
  background: #f8faff;
}

.session-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.session-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2746;
}

.session-meta,
.session-time {
  margin-top: 6px;
  font-size: 13px;
  color: #7b88a0;
}

.session-question {
  margin-top: 12px;
  color: #2b3650;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.6;
}

.session-status {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
}

.session-status.is-completed {
  background: #ebf8f2;
  color: #2f8f67;
}

.session-status.is-in_progress {
  background: #eef2ff;
  color: #5f79ff;
}

.session-status.is-aborted {
  background: #fff2f2;
  color: #d05f5f;
}

.session-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
  font-size: 13px;
  color: #5f6f8a;
}

.session-preview {
  margin-top: 12px;
  color: #62708a;
  font-size: 13px;
  line-height: 1.7;
}

.empty-text {
  margin: 18px 0 0;
  font-size: 14px;
  line-height: 1.8;
  color: #718099;
}
</style>

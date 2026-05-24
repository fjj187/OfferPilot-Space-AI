<script lang="ts" setup>
import type { InterviewMessage } from '@/types/message'
import MarkdownMessage from './MarkdownMessage.vue'
import StreamingCursor from './StreamingCursor.vue'

const props = defineProps<{
  message: InterviewMessage
}>()

const roleLabelMap: Record<InterviewMessage['role'], string> = {
  assistant: 'AI 面试官',
  user: '我的回答',
  system: '系统提示'
}

const timeLabel = computed(() => {
  const date = new Date(props.message.createdAt)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
})
</script>

<template>
  <article
    class="message-bubble"
    :class="[`is-${message.role}`, `is-${message.status}`]"
  >
    <header class="bubble-head">
      <span class="role-label">{{ roleLabelMap[message.role] }}</span>
      <span class="time-label">{{ timeLabel }}</span>
    </header>

    <div class="bubble-body">
      <MarkdownMessage
        v-if="message.format === 'markdown'"
        :content="message.displayContent"
      />
      <p v-else class="plain-text">
        {{ message.displayContent }}
      </p>

      <StreamingCursor v-if="message.status === 'streaming'" />
    </div>
  </article>
</template>

<style lang="scss" scoped>
.message-bubble {
  padding: 18px 20px;
  border: 1px solid #e6ebf5;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 14px 32px rgb(36 53 87 / 5%);
}

.message-bubble.is-user {
  border-color: #d9eadf;
  background: #f3fbf6;
}

.message-bubble.is-system {
  border-style: dashed;
  background: #fbfcff;
}

.message-bubble.is-error {
  border-color: #f0c4c4;
  background: #fff8f8;
}

.message-bubble.is-aborted {
  border-color: #efdca8;
  background: #fffaf0;
}

.bubble-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.role-label {
  font-size: 12px;
  font-weight: 700;
  color: #6b7a96;
}

.time-label {
  font-size: 12px;
  color: #9aa5ba;
}

.bubble-body {
  color: #31405b;
}

.plain-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>

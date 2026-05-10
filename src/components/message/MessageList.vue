<script lang="ts" setup>
import type { InterviewMessage } from '@/types/message'
import MessageBubble from './MessageBubble.vue'

const props = defineProps<{
  messages: InterviewMessage[]
  scrollVersion?: string
}>()

const listRef = ref<HTMLElement | null>(null)

const scrollToBottom = () => {
  requestAnimationFrame(() => {
    const el = listRef.value
    if (!el) return
    el.scrollTop = el.scrollHeight
  })
}

watch(
  () => [props.messages.length, props.scrollVersion],
  () => {
    nextTick(scrollToBottom)
  },
  { immediate: true }
)
</script>

<template>
  <section ref="listRef" class="message-list">
    <div v-if="!messages.length" class="empty-state">
      <div class="empty-title">还没有开始本轮对话</div>
      <div class="empty-desc">先阅读当前题目，再在下方输入你的回答，AI 面试官会流式给出追问和反馈。</div>
    </div>

    <MessageBubble
      v-for="message in messages"
      v-else
      :key="message.id"
      :message="message"
    />
  </section>
</template>

<style lang="scss" scoped>
.message-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 320px;
  max-height: 540px;
  padding-right: 6px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex: 1;
  min-height: 320px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  border: 1px dashed #d9e1ef;
  border-radius: 24px;
  background: #fafcff;
  text-align: center;
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2746;
}

.empty-desc {
  max-width: 520px;
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.8;
  color: #7b88a0;
}
</style>

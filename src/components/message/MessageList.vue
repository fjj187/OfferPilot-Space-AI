<script lang="ts" setup>
import type { InterviewMessage } from '@/types/message'
import MessageBubble from './MessageBubble.vue'

const props = defineProps<{
  messages: InterviewMessage[]
  scrollVersion?: string
}>()

const listRef = ref<HTMLElement | null>(null)
const hasMessages = computed(() => props.messages.length > 0)

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
  {
    immediate: true
  }
)
</script>

<template>
  <section
    ref="listRef"
    class="message-list"
    :class="{ 'has-messages': hasMessages, 'is-empty': !hasMessages }"
  >
    <div
      v-if="!messages.length"
      class="empty-state"
    >
      <div class="empty-orb"></div>
      <div class="empty-title">从这里开始你的回答</div>
      <div class="empty-desc">先在下方输入你的思路提纲，提交后这里会平滑出现面试官的追问与反馈。</div>
    </div>

    <TransitionGroup
      v-else
      name="message-fade"
      tag="div"
      class="message-stack"
    >
      <MessageBubble
        v-for="message in messages"
        :key="message.id"
        :message="message"
      />
    </TransitionGroup>
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
  overflow-y: hidden;
}

.message-list.has-messages {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgb(151 141 209 / 0.75) transparent;
}

.message-list.has-messages::-webkit-scrollbar {
  width: 4px;
}

.message-list.has-messages::-webkit-scrollbar-track {
  background: transparent;
}

.message-list.has-messages::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: linear-gradient(180deg, rgb(196 187 246 / 0.88), rgb(130 119 193 / 0.72));
}

.message-list.has-messages::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgb(214 207 255 / 0.92), rgb(145 133 214 / 0.82));
}

.message-stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.empty-state {
  display: flex;
  flex: 1;
  min-height: 320px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 32px;
  text-align: center;
}

.empty-orb {
  width: 72px;
  height: 72px;
  margin-bottom: 18px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 34% 32%, rgb(255 255 255 / 0.98) 0%, rgb(227 214 255 / 0.92) 24%, rgb(169 143 255 / 0.82) 58%, rgb(117 93 215 / 0.72) 100%);
  box-shadow:
    0 18px 40px rgb(103 81 197 / 0.2),
    inset 0 1px 12px rgb(255 255 255 / 0.56);
}

.empty-title {
  font-size: 20px;
  font-weight: 700;
  color: rgb(62 56 112 / 0.96);
}

.empty-desc {
  max-width: 520px;
  margin-top: 10px;
  font-size: 15px;
  line-height: 1.8;
  color: rgb(99 92 148 / 0.88);
}

.message-fade-enter-active,
.message-fade-leave-active {
  transition:
    opacity 0.32s ease,
    transform 0.32s ease,
    filter 0.32s ease;
}

.message-fade-enter-from,
.message-fade-leave-to {
  opacity: 0;
  transform: translateY(14px);
  filter: blur(6px);
}
</style>

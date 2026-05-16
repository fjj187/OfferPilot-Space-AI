<script setup lang="ts">
import type { InterviewMessage } from '@/types/message'
import MessageList from '@/components/message/MessageList.vue'
import AnswerInputPanel from '@/components/mock-interview/AnswerInputPanel.vue'
import SpaceSceneHeader from '@/components/showcase/mock-interview-space/SpaceSceneHeader.vue'

const props = defineProps<{
  navLabel: string
  sectionTitle: string
  sectionBody: string
  panelMeta: string[]
  sourceMeta: string[]
  knowledgeTags: string[]
  questionPrompt: string
  hintText: string
  messages: InterviewMessage[]
  answeredCount: number
  scrollVersion?: string
  answerDraft: string
  submitted: boolean
  totalCount: number
  streaming: boolean
  streamError?: string
  sessionStatusText: string
}>()

interface MetaChip {
  key: string
  label: string
  priority: number
  tone?: 'source' | 'document' | 'topic' | 'knowledge'
}

const metaPriorityMap: Record<string, number> = {
  阶段: 10,
  难度: 20,
  模式: 30,
  题源: 40,
  资料: 50,
  类型: 60,
  主题: 70,
  知识点: 80
}

const metaToneMap: Record<string, MetaChip['tone']> = {
  题源: 'source',
  资料: 'document',
  类型: 'document',
  主题: 'topic',
  知识点: 'knowledge'
}

const metaLabelKey = (label: string) => label.split(':')[0]?.trim() || label

const normalizeMetaChip = (label: string, fallbackIndex: number): MetaChip => {
  const key = metaLabelKey(label)
  return {
    key: `meta-${ key }-${ label }`,
    label,
    priority: metaPriorityMap[key] || 100 + fallbackIndex,
    tone: metaToneMap[key]
  }
}

const visibleMetaChips = computed<MetaChip[]>(() => {
  const seenKeys = new Set<string>()
  const orderedLabels = [
    ...props.panelMeta,
    ...props.sourceMeta,
    ...props.knowledgeTags.map(item => `知识点: ${ item }`)
  ]

  const chips = orderedLabels
    .map((item, index) => normalizeMetaChip(item, index))
    .sort((first, second) => first.priority - second.priority)
    .filter((item) => {
      if (seenKeys.has(item.key)) {
        return false
      }

      seenKeys.add(item.key)
      return true
    })

  return chips
})

const emit = defineEmits<{
  'update:answerDraft': [value: string]
  submit: []
  finish: []
  clear: []
  stop: []
}>()

</script>

<template>
  <div class="mock-scene-shell">
    <SpaceSceneHeader
      :title="sectionTitle"
      :body="sectionBody"
      aside-min-width="560px"
    >
      <template #aside>
        <div class="mock-meta-row">
          <span
            v-for="item in visibleMetaChips"
            :key="item.key"
            class="mock-meta-chip"
            :class="{
              'is-source': item.tone === 'source',
              'is-document': item.tone === 'document',
              'is-topic': item.tone === 'topic',
              'is-knowledge': item.tone === 'knowledge'
            }"
          >
            {{ item.label }}
          </span>
        </div>
      </template>
    </SpaceSceneHeader>

    <div class="mock-live-shell">
      <section class="mock-session-card">
        <div class="mock-session-layout">
          <div class="mock-conversation-shell">
            <div class="mock-conversation-head">
              <div class="mock-conversation-label">问答内容区</div>
              <span class="mock-session-pill">
                {{ answeredCount }} / {{ totalCount || 1 }} 题
              </span>
            </div>
            <MessageList
              :messages="messages"
              :scroll-version="scrollVersion"
            />
            <div
              v-if="streamError"
              class="mock-stream-error"
            >
              {{ streamError }}
            </div>
          </div>

          <aside class="mock-side-column">
            <div class="mock-question-card">
              <div class="mock-prompt-label">题目</div>
              <div class="mock-prompt-body">{{ questionPrompt || sectionBody }}</div>
            </div>

            <section class="mock-question-info">
              <div class="mock-side-label">提示</div>
              <p>{{ hintText || '当前还没有提示内容。' }}</p>
            </section>

            <div class="mock-draft-shell">
              <AnswerInputPanel
                :value="answerDraft"
                :submitted="submitted"
                :streaming="streaming"
                variant="space"
                @update:value="emit('update:answerDraft', $event)"
                @submit="emit('submit')"
                @clear="emit('clear')"
                @stop="emit('stop')"
              />
            </div>
          </aside>
        </div>

        <div class="mock-session-footer">
          <div class="mock-session-note">{{ sessionStatusText }}</div>
          <button
            type="button"
            class="mock-finish-button"
            :disabled="streaming || !answeredCount"
            @click="emit('finish')"
          >
            结束本轮并查看报告
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mock-scene-shell {
  display: grid;
  gap: 24px;
}

.mock-prompt-label,
.mock-side-label,
.mock-conversation-label {
  color: var(--scene-primary);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mock-meta-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
  gap: 10px 12px;
  justify-content: end;
  align-content: start;
  width: 100%;
  max-height: 122px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgb(255 255 255 / 0.3) transparent;
}

.mock-meta-row::-webkit-scrollbar {
  width: 4px;
}

.mock-meta-row::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgb(255 255 255 / 0.28);
}

.mock-meta-chip {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.05);
  color: rgb(245 248 255 / 0.88);
  font-size: 15px;
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mock-meta-chip.is-source {
  border-color: rgb(198 206 255 / 0.18);
  background: rgb(198 206 255 / 0.12);
  color: rgb(241 244 255 / 0.96);
}

.mock-meta-chip.is-document {
  border-color: rgb(168 210 255 / 0.18);
  background: rgb(96 142 188 / 0.14);
  color: rgb(236 246 255 / 0.96);
}

.mock-meta-chip.is-topic {
  border-color: rgb(255 220 150 / 0.18);
  background: rgb(166 123 52 / 0.14);
  color: rgb(255 248 232 / 0.96);
}

.mock-meta-chip.is-knowledge {
  border-color: rgb(138 236 208 / 0.2);
  background: rgb(90 146 125 / 0.14);
  color: rgb(232 255 245 / 0.96);
}

.mock-live-shell {
  display: grid;
  gap: 18px;
  min-height: 0;
}

.mock-session-card {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 2px;
  height: clamp(710px, calc(90vh - 80px), 900px);
  min-height: 710px;
  max-height: 900px;
  padding: 20px;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 20px;
  background: rgb(255 255 255 / 0.04);
  backdrop-filter: blur(14px);
}

.mock-conversation-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mock-session-layout {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(340px, 3fr);
  gap: 20px;
  align-items: start;
  min-height: 0;
}

.mock-side-column {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 16px;
  min-height: 0;
}

.mock-question-card,
.mock-question-info,
.mock-draft-shell {
  padding: 18px 18px 16px;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 20px;
  background: rgb(255 255 255 / 0.04);
}

.mock-question-info {
  min-height: 0;
}

.mock-prompt-body {
  margin-top: 14px;
  color: rgb(244 247 255 / 0.94);
  font-size: 19px;
  font-weight: 400;
  line-height: 1.86;
}

.mock-question-info p {
  margin-top: 10px;
  color: rgb(240 245 255 / 0.92);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.75;
}

.mock-conversation-shell {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  padding: 22px 22px 22px 26px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 24px;
  background: linear-gradient(180deg, rgb(88 80 154 / 0.32) 0%, rgb(64 57 126 / 0.24) 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08);
}

.mock-conversation-label {
  color: rgb(92 82 152 / 0.92);
}

.mock-session-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
  color: rgb(235 241 255 / 0.84);
  font-size: 14px;
}

.mock-stream-error {
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid rgb(255 186 186 / 0.2);
  border-radius: 14px;
  background: rgb(255 112 112 / 0.08);
  color: rgb(255 219 219 / 0.94);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.7;
}

.mock-draft-shell {
  min-height: 0;
  overflow: hidden;
}

.mock-session-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 12px;
}

.mock-session-note {
  color: rgb(225 231 248 / 0.8);
  font-size: 15px;
  line-height: 1.7;
  padding-top: 12px;
  border-top: 1px solid rgb(255 255 255 / 0.08);
}

.mock-finish-button {
  min-height: 44px;
  padding: 0 18px;
  margin-top: 10px;
  border: 1px solid rgb(139 246 220 / 0.3);
  border-radius: 14px;
  background: linear-gradient(180deg, rgb(77 130 118 / 0.38) 0%, rgb(45 90 80 / 0.3) 100%);
  color: #fff;
  font: inherit;
  font-size: 15px;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    opacity 0.22s ease;
}

.mock-finish-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgb(139 246 220 / 0.45);
}

.mock-finish-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.mock-live-shell :deep(.message-list) {
  min-height: 0;
  max-height: none;
  height: 100%;
  box-sizing: border-box;
  padding: 8px 14px 8px 8px;
  overflow-y: hidden;
}

.mock-live-shell :deep(.message-list.has-messages) {
  overflow-y: auto;
}

.mock-live-shell :deep(.message-bubble) {
  padding: 8px 0 18px;
  border: 0;
  border-bottom: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.mock-live-shell :deep(.message-bubble.is-user) {
  border-color: rgb(255 255 255 / 0.08);
  background: transparent;
}

.mock-live-shell :deep(.message-bubble.is-system) {
  border-style: solid;
  border-color: rgb(255 255 255 / 0.08);
  background: transparent;
}

.mock-live-shell :deep(.message-bubble:last-child) {
  padding-bottom: 4px;
  border-bottom: 0;
}

.mock-live-shell :deep(.role-label),
.mock-live-shell :deep(.time-label) {
  font-size: 15px;
  font-weight: 500;
  color: rgb(232 236 255 / 0.76);
}

.mock-live-shell :deep(.bubble-head) {
  margin-bottom: 14px;
}

.mock-live-shell :deep(.bubble-body),
.mock-live-shell :deep(.plain-text),
.mock-live-shell :deep(.markdown-message),
.mock-live-shell :deep(.markdown-message p),
.mock-live-shell :deep(.markdown-message li),
.mock-live-shell :deep(.markdown-message ol),
.mock-live-shell :deep(.markdown-message ul) {
  color: rgb(247 249 255 / 0.96);
  font-size: 17px;
  line-height: 1.85;
}

.mock-live-shell :deep(.markdown-message h1),
.mock-live-shell :deep(.markdown-message h2),
.mock-live-shell :deep(.markdown-message h3),
.mock-live-shell :deep(.markdown-message h4),
.mock-live-shell :deep(.markdown-message strong) {
  color: rgb(255 255 255 / 0.98);
}

.mock-live-shell :deep(.markdown-message ul),
.mock-live-shell :deep(.markdown-message ol) {
  padding-left: 24px;
}

.mock-live-shell :deep(.markdown-message li) {
  padding-left: 2px;
}

.mock-live-shell :deep(.empty-title) {
  font-size: 20px;
  font-weight: 600;
  color: rgb(243 246 255 / 0.96);
}

.mock-live-shell :deep(.empty-desc) {
  font-size: 16px;
  line-height: 1.8;
  color: rgb(225 231 248 / 0.8);
}

.mock-live-shell :deep(.empty-state) {
  transform: translateY(15px);
}

.mock-draft-shell :deep(.answer-panel) {
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.mock-draft-shell :deep(.panel-title) {
  font-size: 20px;
  font-weight: 600;
  color: rgb(248 250 255 / 0.96);
}

.mock-draft-shell :deep(.panel-note) {
  font-size: 15px;
  font-weight: 400;
  line-height: 1.75;
  color: rgb(229 236 255 / 0.78);
}

.mock-draft-shell :deep(.answer-status) {
  font-size: 15px;
  font-weight: 400;
  background: rgb(255 255 255 / 0.08);
  color: rgb(235 241 255 / 0.86);
}

.mock-draft-shell :deep(.answer-status.is-submitted) {
  background: rgb(131 245 202 / 0.18);
  color: rgb(226 255 242 / 0.98);
}

.mock-draft-shell :deep(.answer-status.is-streaming) {
  background: rgb(160 188 255 / 0.16);
  color: rgb(236 242 255 / 0.98);
}

.mock-draft-shell :deep(.n-input),
.mock-draft-shell :deep(.n-input textarea),
.mock-draft-shell :deep(.n-input .n-input__textarea),
.mock-draft-shell :deep(.n-input .n-input__textarea-el),
.mock-draft-shell :deep(.n-input .n-input__input-el),
.mock-draft-shell :deep(.n-input .n-input__textarea-mirror) {
  font-size: 16px;
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
  line-height: 1.8;
  caret-color: #fff !important;
  background: transparent !important;
  opacity: 1 !important;
  text-shadow: none !important;
}

.mock-draft-shell :deep(.n-input) {
  --n-text-color: #fff !important;
  --n-text-color-disabled: #fff !important;
  --n-placeholder-color: rgb(255 255 255 / 0.72) !important;
  --n-caret-color: #fff !important;
}

.mock-draft-shell :deep(.n-input .n-input-wrapper),
.mock-draft-shell :deep(.n-input .n-input__border),
.mock-draft-shell :deep(.n-input .n-input__state-border) {
  min-height: auto;
  background: transparent !important;
  box-shadow: none !important;
  border-color: transparent !important;
}

.mock-draft-shell :deep(.n-input .n-input__placeholder),
.mock-draft-shell :deep(.n-input textarea::placeholder),
.mock-draft-shell :deep(.n-input .n-input__textarea-el::placeholder) {
  color: rgb(255 255 255 / 0.72) !important;
  -webkit-text-fill-color: rgb(255 255 255 / 0.72) !important;
  opacity: 1 !important;
}

.mock-draft-shell :deep(.n-button) {
  font-size: 15px;
  font-weight: 500;
}

.mock-draft-shell :deep(.n-button--primary-type) {
  background: linear-gradient(180deg, rgb(114 88 255 / 0.88) 0%, rgb(89 62 228 / 0.92) 100%);
  border-color: rgb(167 145 255 / 0.36);
  color: #fff;
}

.mock-draft-shell :deep(.n-button--primary-type:disabled) {
  opacity: 0.55;
  color: rgb(255 255 255 / 0.78);
}

.mock-draft-shell :deep(.n-button:not(.n-button--primary-type)) {
  color: rgb(228 236 255 / 0.88);
}

@media (max-width: 1100px) {
  .mock-meta-row {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    justify-content: flex-start;
  }

  .mock-session-card {
    height: clamp(660px, calc(88vh - 80px), 820px);
    min-height: 660px;
  }

  .mock-session-layout {
    grid-template-columns: 1fr;
  }

  .mock-side-column {
    grid-template-rows: auto auto auto;
  }

  .mock-conversation-shell {
    min-height: 420px;
  }
}

@media (max-width: 780px) {
  .mock-session-card {
    padding: 18px;
    border-radius: 18px;
  }

  .mock-meta-row {
    grid-template-columns: 1fr;
  }

  .mock-session-card {
    height: 710px;
    min-height: 710px;
    max-height: 710px;
  }

  .mock-conversation-shell {
    min-height: 360px;
    max-height: 360px;
    padding: 16px;
  }

  .mock-conversation-head,
  .mock-session-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

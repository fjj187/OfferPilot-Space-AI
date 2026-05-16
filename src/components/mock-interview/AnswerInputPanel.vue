<script lang="ts" setup>
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<{
  value: string
  submitted: boolean
  streaming?: boolean
  variant?: 'default' | 'space'
}>(), {
  streaming: false,
  variant: 'default'
})

const emit = defineEmits<{
  'update:value': [value: string]
  submit: []
  clear: []
  stop: []
}>()

const isSpaceVariant = computed(() => props.variant === 'space')
const isDraftFocused = ref(false)
const statusText = computed(() => {
  if (props.streaming) return 'AI 生成中'
  if (props.submitted) return '本题已提交'
  return '等待输入'
})
</script>

<template>
  <section
    class="answer-panel"
    :class="{ 'is-space': isSpaceVariant }"
  >
    <div class="panel-head">
      <div>
        <div class="panel-title">你的回答草稿</div>
        <div
          v-if="!isSpaceVariant"
          class="panel-note"
        >
          先说结论，再补拆分过程和项目例子。当前版本会把你的回答送入流式面试官对话里。
        </div>
      </div>
      <span
        class="answer-status"
        :class="{ 'is-submitted': submitted, 'is-streaming': streaming }"
      >
        {{ statusText }}
      </span>
    </div>

    <article
      v-if="isSpaceVariant"
      class="draft-bubble"
    >
      <div class="bubble-body">
        <div
          v-if="!value.trim() && !isDraftFocused"
          class="draft-placeholder"
        >
          先写你的回答提纲，例如：场景是什么、你怎么拆、为什么这样做、结果如何。
        </div>
        <n-input
          class="answer-input is-bubble-input"
          :value="value"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 3 }"
          placeholder=""
          @focus="isDraftFocused = true"
          @blur="isDraftFocused = false"
          @update:value="emit('update:value', $event)"
        />
      </div>
    </article>

    <n-input
      v-else
      class="answer-input"
      :value="value"
      type="textarea"
      :autosize="{ minRows: 3, maxRows: 3 }"
      placeholder="先写你的回答提纲，例如：场景是什么、你怎么拆、为什么这样做、结果如何。"
      @update:value="emit('update:value', $event)"
    />

    <div class="panel-actions">
      <n-button
        type="primary"
        :disabled="!value.trim() || streaming"
        @click="emit('submit')"
      >
        提交回答并继续追问
      </n-button>
      <n-button
        quaternary
        :disabled="streaming"
        @click="emit('clear')"
      >
        清空草稿
      </n-button>
      <n-button
        v-if="streaming"
        tertiary
        type="warning"
        @click="emit('stop')"
      >
        停止生成
      </n-button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.answer-panel {
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 12px;
  padding: 22px;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: rgb(255 255 255 / 92%);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2746;
}

.panel-note {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: #7b88a0;
}

.answer-status {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: #f3f5fa;
  color: #7d8aa2;
  font-size: 12px;
  font-weight: 700;
}

.answer-status.is-submitted {
  background: #ebf8f2;
  color: #33a06f;
}

.answer-status.is-streaming {
  background: #eef2ff;
  color: #6076ff;
}

.answer-input :deep(.n-input-wrapper) {
  min-height: 96px;
}

.draft-bubble {
  padding: 18px 20px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 24px;
  background: linear-gradient(180deg, rgb(88 80 154 / 0.48) 0%, rgb(64 57 126 / 0.4) 100%);
  box-shadow:
    0 10px 24px rgb(18 14 49 / 0.14),
    inset 0 1px 0 rgb(255 255 255 / 0.08);
}

.bubble-body {
  position: relative;
  color: rgb(247 249 255 / 0.96);
}

.draft-placeholder {
  position: absolute;
  top: 2px;
  left: 0;
  right: 0;
  pointer-events: none;
  color: rgb(225 231 248 / 0.62);
  font-size: 17px;
  line-height: 1.85;
  text-shadow: none;
  white-space: normal;
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.is-space {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.is-space .panel-title {
  color: rgb(248 250 255 / 0.96);
  font-size: 20px;
}

.is-space .answer-status {
  background: rgb(255 255 255 / 0.08);
  color: rgb(235 241 255 / 0.86);
  font-size: 14px;
  font-weight: 500;
}

.is-space .answer-status.is-submitted {
  background: rgb(131 245 202 / 0.18);
  color: rgb(226 255 242 / 0.98);
}

.is-space .answer-status.is-streaming {
  background: rgb(160 188 255 / 0.16);
  color: rgb(236 242 255 / 0.98);
}

.is-space .answer-input :deep(.n-input-wrapper),
.is-space .answer-input :deep(.n-input__border),
.is-space .answer-input :deep(.n-input__state-border) {
  background: transparent !important;
  box-shadow: none !important;
  border-color: transparent !important;
}

.is-space .answer-input :deep(.n-input) {
  --n-text-color: rgb(247 249 255 / 0.96) !important;
  --n-text-color-disabled: rgb(247 249 255 / 0.96) !important;
  --n-placeholder-color: rgb(225 231 248 / 0.62) !important;
  --n-caret-color: rgb(247 249 255 / 0.96) !important;
}

.is-space .answer-input :deep(textarea),
.is-space .answer-input :deep(.n-input__textarea-el),
.is-space .answer-input :deep(.n-input__input-el) {
  padding: 2px 0 0 !important;
  color: rgb(247 249 255 / 0.96) !important;
  -webkit-text-fill-color: rgb(247 249 255 / 0.96) !important;
  caret-color: rgb(247 249 255 / 0.96) !important;
  background: transparent !important;
  line-height: 1.85;
  font-size: 17px;
  opacity: 1 !important;
  text-shadow: none !important;
}

.is-space .answer-input :deep(.n-input__textarea-mirror) {
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  text-shadow: none !important;
}

.is-space .panel-actions {
  align-items: center;
  justify-content: flex-start;
}

.is-space .panel-actions :deep(.n-button--primary-type) {
  background: linear-gradient(180deg, rgb(114 88 255 / 0.88) 0%, rgb(89 62 228 / 0.92) 100%);
  border-color: rgb(167 145 255 / 0.36);
  color: #fff;
}

.is-space .panel-actions :deep(.n-button--primary-type:disabled) {
  opacity: 0.55;
}

.is-space .panel-actions :deep(.n-button:not(.n-button--primary-type)) {
  color: rgb(228 236 255 / 0.88);
}

@media (max-width: 720px) {
  .panel-head,
  .panel-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

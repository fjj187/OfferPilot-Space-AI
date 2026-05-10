<script lang="ts" setup>
defineProps<{
  value: string
  submitted: boolean
  streaming?: boolean
}>()

const emit = defineEmits<{
  'update:value': [value: string]
  submit: []
  clear: []
  stop: []
}>()
</script>

<template>
  <section class="answer-panel">
    <div class="panel-head">
      <div>
        <div class="panel-title">你的回答草稿</div>
        <div class="panel-note">
          先说结论，再补拆分过程和项目例子。当前版本会把你的回答送入流式面试官对话里。
        </div>
      </div>
      <span class="answer-status" :class="{ 'is-submitted': submitted, 'is-streaming': streaming }">
        {{ streaming ? 'AI 生成中' : submitted ? '本题已提交' : '等待输入' }}
      </span>
    </div>

    <n-input
      :value="value"
      type="textarea"
      :autosize="{ minRows: 6, maxRows: 10 }"
      placeholder="先写你的回答提纲，例如：场景是什么、你怎么拆、为什么这样做、结果如何。"
      @update:value="emit('update:value', $event)"
    />

    <div class="panel-actions">
      <n-button type="primary" :disabled="!value.trim() || streaming" @click="emit('submit')">
        提交回答并继续追问
      </n-button>
      <n-button quaternary :disabled="streaming" @click="emit('clear')">
        清空草稿
      </n-button>
      <n-button v-if="streaming" tertiary type="warning" @click="emit('stop')">
        停止生成
      </n-button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.answer-panel {
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
  margin-bottom: 14px;
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

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
}

@media (max-width: 720px) {
  .panel-head,
  .panel-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

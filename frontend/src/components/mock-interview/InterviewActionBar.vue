<script lang="ts" setup>
defineProps<{
  canMoveNext: boolean
  isLastQuestion: boolean
  streaming?: boolean
}>()

const emit = defineEmits<{
  hint: []
  followup: []
  skip: []
  next: []
  finish: []
}>()
</script>

<template>
  <section class="action-bar">
    <div class="left-actions">
      <n-button
        secondary
        :disabled="streaming"
        @click="emit('hint')"
      >
        查看提示
      </n-button>
      <n-button
        secondary
        :disabled="streaming"
        @click="emit('followup')"
      >
        请求追问
      </n-button>
      <n-button
        quaternary
        :disabled="streaming"
        @click="emit('skip')"
      >
        跳过本题
      </n-button>
    </div>

    <div class="right-actions">
      <n-button
        type="primary"
        :disabled="!canMoveNext || streaming"
        @click="emit(isLastQuestion ? 'finish' : 'next')"
      >
        {{ isLastQuestion ? '完成本轮面试' : '进入下一题' }}
      </n-button>
      <n-button
        strong
        secondary
        :disabled="streaming"
        @click="emit('finish')"
      >
        结束本轮
      </n-button>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid #e8edf6;
  border-radius: 22px;
  background: rgb(255 255 255 / 92%);
}

.left-actions,
.right-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 900px) {
  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

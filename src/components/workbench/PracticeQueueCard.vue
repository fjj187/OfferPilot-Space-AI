<script lang="ts" setup>
interface Props {
  id: string
  title: string
  progress: number
  note: string
  questionCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  active?: boolean
}

withDefaults(defineProps<Props>(), {
  active: false
})

const emit = defineEmits<{
  select: [id: string]
}>()

const difficultyLabelMap = {
  easy: '基础',
  medium: '进阶',
  hard: '高阶'
} as const
</script>

<template>
  <button
    type="button"
    class="queue-item"
    :class="{ 'is-active': active }"
    @click="emit('select', id)"
  >
    <div class="queue-copy">
      <div class="queue-title-row">
        <div class="queue-title">{{ title }}</div>
        <span class="queue-tag">{{ difficultyLabelMap[difficulty] }}</span>
      </div>
      <div class="queue-note">{{ note }}</div>
      <div class="queue-meta">{{ questionCount }} 题待练</div>
    </div>
    <n-progress
      type="line"
      :percentage="progress"
      indicator-placement="inside"
      rail-color="#edf1f7"
      color="#6c7df7"
      :height="10"
      :border-radius="999"
    />
  </button>
</template>

<style lang="scss" scoped>
.queue-item {
  width: 100%;
  padding: 16px;
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #fbfcff;
  text-align: left;
  cursor: pointer;
  transition: 0.2s ease;
}

.queue-item:hover,
.queue-item.is-active {
  border-color: #d7e0ff;
  box-shadow: 0 12px 24px rgb(36 53 87 / 8%);
}

.queue-copy {
  margin-bottom: 12px;
}

.queue-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.queue-title {
  font-size: 15px;
  font-weight: 700;
  color: #1f2746;
}

.queue-tag {
  padding: 4px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #6073f4;
  font-size: 12px;
  font-weight: 700;
}

.queue-note {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #75829b;
}

.queue-meta {
  margin-top: 8px;
  font-size: 12px;
  color: #90a0b8;
}
</style>

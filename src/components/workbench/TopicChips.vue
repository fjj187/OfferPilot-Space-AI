<script lang="ts" setup>
interface Props {
  topics: Array<{
    key: string
    label: string
  }>
  activeTopic: string
}

defineProps<Props>()

const emit = defineEmits<{
  change: [topic: string]
}>()
</script>

<template>
  <div class="topic-row">
    <button
      v-for="topic in topics"
      :key="topic.key"
      type="button"
      class="topic-chip"
      :class="{ 'is-active': topic.key === activeTopic }"
      @click="emit('change', topic.key)"
    >
      {{ topic.label }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.topic-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.topic-chip {
  padding: 10px 16px;
  border: 1px solid #e3e9f4;
  border-radius: 999px;
  background: rgb(255 255 255 / 82%);
  color: #66758f;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.topic-chip.is-active,
.topic-chip:hover {
  border-color: #d8e0ff;
  background: #eef2ff;
  color: #5c72ef;
}
</style>

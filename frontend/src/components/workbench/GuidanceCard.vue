<script lang="ts" setup>
interface Props {
  id: string
  title: string
  desc: string
  tone: 'primary' | 'neutral'
  active?: boolean
}

withDefaults(defineProps<Props>(), {
  active: false
})

const emit = defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <button
    type="button"
    class="guidance-card"
    :class="[{ 'is-primary': tone === 'primary' }, { 'is-active': active }]"
    @click="emit('select', id)"
  >
    <div class="guidance-title">{{ title }}</div>
    <div class="guidance-desc">{{ desc }}</div>
  </button>
</template>

<style lang="scss" scoped>
.guidance-card {
  padding: 16px;
  border: 1px solid #e9edf6;
  border-radius: 18px;
  background: #f9fbff;
  text-align: left;
  cursor: pointer;
  transition: 0.2s ease;
}

.guidance-card.is-primary {
  background: linear-gradient(135deg, #edf1ff 0%, #f5fbff 100%);
  border-color: #dce5ff;
}

.guidance-card:hover,
.guidance-card.is-active {
  transform: translateY(-1px);
  border-color: #d7e0ff;
  box-shadow: 0 12px 28px rgb(36 53 87 / 8%);
}

.guidance-title {
  font-size: 15px;
  font-weight: 700;
  color: #1f2746;
}

.guidance-desc {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #75829b;
}
</style>

<script lang="ts" setup>
interface Props {
  id: string
  title: string
  meta: string
  desc: string
  accent: string
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
    class="library-card"
    :class="{ 'is-active': active }"
    @click="emit('select', id)"
  >
    <div
      class="library-card-banner"
      :class="`bg-gradient-to-br ${accent}`"
    ></div>
    <div class="library-card-body">
      <div class="library-card-meta">{{ meta }}</div>
      <h3>{{ title }}</h3>
      <p>{{ desc }}</p>
      <div class="library-card-footer">
        <span class="i-lucide-file-text"></span>
        <span>可用于生成面试题与知识卡片</span>
      </div>
    </div>
  </button>
</template>

<style lang="scss" scoped>
.library-card {
  display: block;
  width: 100%;
  overflow: hidden;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 7%);
  text-align: left;
  cursor: pointer;
  transition: 0.2s ease;
}

.library-card:hover,
.library-card.is-active {
  transform: translateY(-2px);
  border-color: #d7e0ff;
  box-shadow: 0 18px 36px rgb(64 88 140 / 12%);
}

.library-card-banner {
  height: 120px;
}

.library-card-body {
  padding: 18px 18px 20px;
}

.library-card-meta {
  font-size: 12px;
  color: #8d98b0;
}

.library-card-body h3 {
  margin: 10px 0 10px;
  font-size: 18px;
  line-height: 1.35;
  color: #1e2642;
}

.library-card-body p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #6b7790;
}

.library-card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: #7b88a0;
  font-size: 13px;
}
</style>

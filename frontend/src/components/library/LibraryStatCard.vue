<script lang="ts" setup>
interface Props {
  label: string
  value: string
  note: string
  tone?: 'primary' | 'neutral'
}

withDefaults(defineProps<Props>(), {
  tone: 'neutral'
})
</script>

<template>
  <article
    class="stat-card"
    :class="{ 'is-primary': tone === 'primary' }"
  >
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value">{{ value }}</div>
    <div class="stat-note">{{ note }}</div>
  </article>
</template>

<style lang="scss" scoped>
.stat-card {
  padding: 18px 20px;
  border: 1px solid #e8edf6;
  border-radius: 22px;
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 7%);
}

.stat-card.is-primary {
  background: linear-gradient(135deg, #eff3ff 0%, #f5fbff 100%);
}

.stat-label {
  font-size: 12px;
  color: #8d98b0;
}

.stat-value {
  margin-top: 12px;
  font-size: 28px;
  font-weight: 700;
  color: #1e2642;
}

.stat-note {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #697690;
}
</style>

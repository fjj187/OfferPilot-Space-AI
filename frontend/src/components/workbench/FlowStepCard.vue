<script lang="ts" setup>
interface Props {
  label: string
  detail: string
  icon: string
}

defineProps<Props>()
</script>

<template>
  <article class="flow-card">
    <div
      class="flow-icon"
      :class="icon"
    ></div>
    <div class="flow-title">{{ label }}</div>
    <div class="flow-detail">{{ detail }}</div>
  </article>
</template>

<style lang="scss" scoped>
.flow-card {
  padding: 18px;
  border: 1px solid #e8edf6;
  border-radius: 22px;
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 7%);
}

.flow-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #eef2ff;
  color: #5f79ff;
  font-size: 20px;
}

.flow-title {
  margin-top: 18px;
  font-size: 16px;
  font-weight: 700;
  color: #1f2746;
}

.flow-detail {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #75829b;
}
</style>

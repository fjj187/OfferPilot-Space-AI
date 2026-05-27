<script lang="ts" setup>
defineProps<{
  eyebrow: string
  title: string
  description: string
}>()
</script>

<template>
  <section class="page-intro">
    <div class="eyebrow">{{ eyebrow }}</div>
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </section>
</template>

<style lang="scss" scoped>
.page-intro {
  margin-bottom: 24px;
}

.eyebrow {
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h1 {
  margin: 12px 0;
  font-size: 28px;
  color: #1f2746;
}

p {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #6d7a92;
}
</style>

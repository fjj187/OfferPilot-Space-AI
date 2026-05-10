<script lang="ts" setup>
defineProps<{
  suggestions: string[]
}>()
</script>

<template>
  <section class="suggestion-card">
    <div class="section-kicker">下一步建议</div>
    <h3>接下来你最适合怎么练</h3>

    <ul class="suggestion-list">
      <li
        v-for="item in suggestions"
        :key="item"
      >
        {{ item }}
      </li>
    </ul>
  </section>
</template>

<style lang="scss" scoped>
.suggestion-card {
  padding: 22px;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: linear-gradient(180deg, #f9fbff 0%, #ffffff 100%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 6%);
}

.section-kicker {
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h3 {
  margin: 8px 0 0;
  font-size: 22px;
  color: #1f2746;
}

.suggestion-list {
  margin: 18px 0 0;
  padding-left: 18px;
  color: #5f6f8a;
  font-size: 14px;
  line-height: 1.85;
}

.suggestion-list li + li {
  margin-top: 10px;
}
</style>

<script lang="ts" setup>
defineProps<{
  weaknessTags: string[]
}>()
</script>

<template>
  <section class="weakness-section">
    <div class="section-kicker">薄弱点分析</div>
    <h3>这一轮最值得优先补练的方向</h3>

    <div
      v-if="weaknessTags.length"
      class="tag-list"
    >
      <span
        v-for="tag in weaknessTags"
        :key="tag"
        class="tag-item"
      >
        {{ tag }}
      </span>
    </div>

    <p
      v-else
      class="empty-text"
    >
      当前还没有足够的薄弱点标签，建议先继续完成更多题目，再回来看更完整的复盘。
    </p>
  </section>
</template>

<style lang="scss" scoped>
.weakness-section {
  padding: 22px;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: rgb(255 255 255 / 92%);
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

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.tag-item {
  padding: 10px 16px;
  border-radius: 999px;
  background: #eef2ff;
  color: #5f79ff;
  font-size: 13px;
  font-weight: 700;
}

.empty-text {
  margin: 18px 0 0;
  font-size: 14px;
  line-height: 1.8;
  color: #718099;
}
</style>

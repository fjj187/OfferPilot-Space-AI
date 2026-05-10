<script lang="ts" setup>
defineProps<{
  weaknessTags: string[]
  answeredCount: number
  total: number
}>()
</script>

<template>
  <section class="weakness-card">
    <div class="card-head">
      <div>
        <div class="section-kicker">薄弱点跟踪</div>
        <h3>这一轮你最该补什么</h3>
      </div>
      <span class="progress-pill">{{ answeredCount }} / {{ total }}</span>
    </div>

    <div
      v-if="weaknessTags.length"
      class="tag-list"
    >
      <span
        v-for="tag in weaknessTags"
        :key="tag"
        class="weakness-tag"
      >
        {{ tag }}
      </span>
    </div>

    <p
      v-else
      class="empty-state"
    >
      提交几道题后，这里会汇总当前轮次暴露出的表达薄弱点。
    </p>
  </section>
</template>

<style lang="scss" scoped>
.weakness-card {
  padding: 20px;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 7%);
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
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
  font-size: 20px;
  color: #1f2746;
}

.progress-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: #eef2ff;
  color: #6076ff;
  font-size: 12px;
  font-weight: 700;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.weakness-tag {
  padding: 8px 14px;
  border-radius: 999px;
  background: #f4f7ff;
  color: #55647f;
  font-size: 13px;
  font-weight: 600;
}

.empty-state {
  margin: 18px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: #7b88a0;
}
</style>

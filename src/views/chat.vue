<script lang="ts" setup>
const router = useRouter()

onMounted(() => {
  router.replace({
    name: 'WorkbenchOverview'
  })
})
</script>

<template>
  <div class="legacy-chat-page">
    <div class="legacy-card">
      <div class="eyebrow">Legacy Entry</div>
      <h1>旧聊天工作台入口已收敛</h1>
      <p>当前产品主流程已经迁移到新的工作台体系，正在跳转到总览页。</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.legacy-chat-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgb(124 138 255 / 14%), transparent 36%),
    linear-gradient(180deg, #f8faff 0%, #f5f7fc 100%);
}

.legacy-card {
  width: min(520px, 100%);
  padding: 28px;
  border: 1px solid #e8edf6;
  border-radius: 28px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 8%);
}

.eyebrow {
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h1 {
  margin: 12px 0 10px;
  font-size: 30px;
  color: #1f2746;
}

p {
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #6d7a92;
}
</style>

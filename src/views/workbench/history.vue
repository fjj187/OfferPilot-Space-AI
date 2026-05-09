<script lang="ts" setup>
import WorkbenchContentShell from '@/components/workbench/WorkbenchContentShell.vue'
</script>

<template>
  <WorkbenchContentShell>
    <div class="eyebrow">训练历史页</div>
    <h1>训练历史</h1>
    <p>这里将承接历史训练记录、表现趋势和会话回看入口。</p>
  </WorkbenchContentShell>
</template>

<style lang="scss" scoped>
.eyebrow { font-size: 12px; font-weight: 700; color: #7182f8; letter-spacing: 0.04em; text-transform: uppercase; }
h1 { margin: 12px 0; font-size: 28px; color: #1f2746; }
p { margin: 0; font-size: 15px; line-height: 1.8; color: #6d7a92; }
</style>

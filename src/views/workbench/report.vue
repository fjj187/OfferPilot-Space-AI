<script lang="ts" setup>
import WorkbenchContentShell from '@/components/workbench/WorkbenchContentShell.vue'

const route = useRoute()

const topicLabelMap: Record<string, string> = {
  vue3: 'Vue 3',
  typescript: 'TypeScript',
  engineering: '工程化',
  browser: '浏览器',
  performance: '性能优化',
  scenario: '场景题'
}

const currentTopic = computed(() => topicLabelMap[String(route.query.topic || '')] || '综合')
const currentSource = computed(() => String(route.query.from || 'workspace'))
const currentSample = computed(() => String(route.query.sample || 'latest'))
</script>

<template>
  <WorkbenchContentShell>
    <div class="eyebrow">复盘报告页</div>
    <h1>复盘报告</h1>
    <p>这里将承接薄弱点分析、知识点解析、问卷汇总和导出入口。</p>

    <div class="context-grid">
      <div class="context-card">
        <div class="context-label">报告主题</div>
        <div class="context-value">{{ currentTopic }}</div>
      </div>
      <div class="context-card">
        <div class="context-label">来源</div>
        <div class="context-value">{{ currentSource }}</div>
      </div>
      <div class="context-card">
        <div class="context-label">报告类型</div>
        <div class="context-value">{{ currentSample }}</div>
      </div>
    </div>
  </WorkbenchContentShell>
</template>

<style lang="scss" scoped>
.eyebrow { font-size: 12px; font-weight: 700; color: #7182f8; letter-spacing: 0.04em; text-transform: uppercase; }
h1 { margin: 12px 0; font-size: 28px; color: #1f2746; }
p { margin: 0; font-size: 15px; line-height: 1.8; color: #6d7a92; }
.context-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 24px; }
.context-card { padding: 20px; border: 1px solid #e8edf6; border-radius: 20px; background: rgb(255 255 255 / 90%); }
.context-label { font-size: 12px; color: #8d98b0; }
.context-value { margin-top: 10px; font-size: 20px; font-weight: 700; color: #1f2746; text-transform: capitalize; }
@media (max-width: 900px) { .context-grid { grid-template-columns: 1fr; } }
</style>

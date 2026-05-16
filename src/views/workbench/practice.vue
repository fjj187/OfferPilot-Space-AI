<script lang="ts" setup>
import WorkbenchContentShell from '@/components/workbench/WorkbenchContentShell.vue'
import WorkbenchContextSummary from '@/components/workbench/WorkbenchContextSummary.vue'
import WorkbenchPageIntro from '@/components/workbench/WorkbenchPageIntro.vue'

const route = useRoute()

const topicLabelMap: Record<string, string> = {
  vue3: 'Vue 3',
  typescript: 'TypeScript',
  engineering: '工程化',
  browser: '浏览器',
  performance: '性能优化',
  scenario: '场景题'
}

const currentTopic = computed(() => topicLabelMap[String(route.query.topic || '')] || '未指定')
const currentDifficulty = computed(() => String(route.query.difficulty || 'medium'))
const currentQuestionCount = computed(() => `${ String(route.query.questionCount || '6') } 题`)

const summaryItems = computed(() => [
  {
    label: '刷题主题',
    value: currentTopic.value
  },
  {
    label: '难度',
    value: currentDifficulty.value
  },
  {
    label: '题量',
    value: currentQuestionCount.value
  }
])
</script>

<template>
  <WorkbenchContentShell>
    <WorkbenchPageIntro
      eyebrow="专项刷题页"
      title="专项刷题"
      description="这里将承接按主题练题、题单生成、即时反馈与进度跟踪。"
    />

    <WorkbenchContextSummary
      :items="summaryItems"
      :columns="3"
    />
  </WorkbenchContentShell>
</template>

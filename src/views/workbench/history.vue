<script lang="ts" setup>
import HistoryReportList from '@/components/history/HistoryReportList.vue'
import HistorySessionList from '@/components/history/HistorySessionList.vue'
import WorkbenchContentShell from '@/components/workbench/WorkbenchContentShell.vue'
import WorkbenchPageIntro from '@/components/workbench/WorkbenchPageIntro.vue'
import { useWorkbenchPersistence } from '@/composables/useWorkbenchPersistence'

const router = useRouter()
const { loadInterviewSessions, loadReportSummaries } = useWorkbenchPersistence()

const topicLabelMap: Record<string, string> = {
  vue3: 'Vue 3',
  typescript: 'TypeScript',
  engineering: '工程化',
  browser: '浏览器',
  performance: '性能优化',
  scenario: '场景题'
}

const sessions = computed(() => {
  return [...loadInterviewSessions()].sort((prev, next) => {
    return new Date(next.startedAt).getTime() - new Date(prev.startedAt).getTime()
  })
})

const summaries = computed(() => {
  return [...loadReportSummaries()].sort((prev, next) => {
    return new Date(next.createdAt).getTime() - new Date(prev.createdAt).getTime()
  })
})

const openReport = (sessionId: string) => {
  router.push({
    name: 'WorkbenchReport',
    query: {
      sessionId
    }
  })
}
</script>

<template>
  <WorkbenchContentShell>
    <WorkbenchPageIntro
      eyebrow="训练历史页"
      title="训练历史"
      description="这里集中查看历史训练 session 和历史复盘摘要，并支持继续回看对应报告。"
    />

    <div class="history-layout">
      <HistorySessionList
        :sessions="sessions"
        :topic-label-map="topicLabelMap"
        @open-report="openReport"
      />

      <HistoryReportList
        :summaries="summaries"
        :topic-label-map="topicLabelMap"
        @open-report="openReport"
      />
    </div>
  </WorkbenchContentShell>
</template>

<style lang="scss" scoped>
.history-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

@media (max-width: 1200px) {
  .history-layout {
    grid-template-columns: 1fr;
  }
}
</style>

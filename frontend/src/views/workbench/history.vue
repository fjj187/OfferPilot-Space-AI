<script lang="ts" setup>
import HistoryReportList from '@/components/history/HistoryReportList.vue'
import HistorySessionList from '@/components/history/HistorySessionList.vue'
import WorkbenchContentShell from '@/components/workbench/WorkbenchContentShell.vue'
import WorkbenchPageIntro from '@/components/workbench/WorkbenchPageIntro.vue'
import { useWorkbenchPersistence } from '@/composables/workspace/useWorkbenchPersistence'
import { listRemoteInterviewSessions } from '@/services/interview/interview-session-api'
import type { PersistedInterviewSession } from '@/types/workbench'

const router = useRouter()
const { loadInterviewSessions, loadReportSummaries } = useWorkbenchPersistence()
const remoteSessions = ref<PersistedInterviewSession[]>([])
const remoteSessionsLoaded = ref(false)

const topicLabelMap: Record<string, string> = {
  vue3: 'Vue 3',
  typescript: 'TypeScript',
  engineering: '工程化',
  browser: '浏览器',
  performance: '性能优化',
  scenario: '场景题'
}

const trimPreview = (text: string, maxLength = 84) => {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  return normalized.length > maxLength ? `${ normalized.slice(0, maxLength) }...` : normalized
}

const sessions = computed(() => {
  const sourceSessions = remoteSessionsLoaded.value && remoteSessions.value.length
    ? remoteSessions.value
    : loadInterviewSessions()

  return [...sourceSessions].sort((prev, next) => {
    return new Date(next.startedAt).getTime() - new Date(prev.startedAt).getTime()
  })
})

const summaries = computed(() => {
  return [...loadReportSummaries()].sort((prev, next) => {
    return new Date(next.createdAt).getTime() - new Date(prev.createdAt).getTime()
  })
})

const openReport = (sessionId: string, threadId?: string) => {
  router.push({
    name: 'WorkbenchReport',
    query: {
      sessionId,
      ...(threadId ? { threadId } : {})
    }
  })
}

const buildFallbackStatus = (messageCount: number): PersistedInterviewSession['status'] => {
  return messageCount >= 2 ? 'completed' : 'in_progress'
}

const loadRemoteSessions = async () => {
  try {
    const sessionsPayload = await listRemoteInterviewSessions()
    remoteSessions.value = sessionsPayload.map(item => ({
      id: item.sessionId,
      topic: (item.topic as PersistedInterviewSession['topic']) || 'vue3',
      mode: item.feedbackStyle === 'guided' ? 'guided' : 'standard',
      source: 'backend-session',
      questionTitle: item.questionTitle,
      backendThreadId: item.threadId,
      backendLatestUserMessage: trimPreview(item.latestUserMessage || ''),
      backendLatestAssistantMessage: trimPreview(item.latestAssistantMessage || ''),
      questionCount: Math.max(Math.ceil(item.messageCount / 2), 1),
      answeredCount: Math.max(Math.floor(item.messageCount / 2), 0),
      currentQuestionIndex: 0,
      submittedQuestionIds: [],
      activeQuestionThreadId: item.threadId,
      generatedThreadCount: 1,
      weaknessTags: [],
      followUpIndex: 0,
      hintVisible: false,
      startedAt: item.updatedAt,
      finishedAt: item.updatedAt,
      status: buildFallbackStatus(item.messageCount)
    }))
  } catch {
    remoteSessions.value = []
  } finally {
    remoteSessionsLoaded.value = true
  }
}

onMounted(() => {
  loadRemoteSessions()
})
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

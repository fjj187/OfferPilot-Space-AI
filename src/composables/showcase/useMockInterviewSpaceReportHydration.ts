import { computed, ref, watch } from 'vue'
import type { ComputedRef } from 'vue'
import type { PersistedInterviewSession, PersistedReportSummary } from '@/types/workbench'
import {
  getRemoteInterviewReportBySessionId,
  isInterviewReportApiAvailable
} from '@/services/interview/interview-report-api'
import {
  getRemoteInterviewSessionDetail,
  listRemoteInterviewSessions
} from '@/services/interview/interview-session-api'

const trimPreview = (text: string, maxLength = 88) => {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  return normalized.length > maxLength ? `${ normalized.slice(0, maxLength) }...` : normalized
}

interface RemoteSessionMessage {
  role: string
  content: string
}

const buildEvidenceFromRemoteMessages = (
  questionTitle: string,
  messages: RemoteSessionMessage[]
) => {
  const userMessages = messages.filter(item => item.role === 'user')
  const assistantMessages = messages.filter(item => item.role === 'assistant')
  const latestAnswer = userMessages[userMessages.length - 1]?.content || ''
  const latestFeedback = assistantMessages[assistantMessages.length - 1]?.content || ''
  const snapshots: string[] = []

  if (latestAnswer) {
    snapshots.push(`${ questionTitle }: ${ trimPreview(latestAnswer) }`)
  }
  if (latestFeedback) {
    snapshots.push(`系统反馈: ${ trimPreview(latestFeedback, 72) }`)
  }

  return snapshots
}

interface UseMockInterviewSpaceReportHydrationOptions {
  reportSession: ComputedRef<PersistedInterviewSession | null>
  getLocalReportSummary: (sessionId: string) => PersistedReportSummary | undefined
}

export function useMockInterviewSpaceReportHydration(options: UseMockInterviewSpaceReportHydrationOptions) {
  const remoteReportSummary = ref<PersistedReportSummary | null>(null)
  const remoteEvidenceSnapshot = ref<string[]>([])
  const isHydrating = ref(false)

  const reportSessionId = computed(() => options.reportSession.value?.id || '')

  const resolveReportSummary = (sessionId: string) => {
    if (!sessionId) return undefined
    const local = options.getLocalReportSummary(sessionId)
    if (local) return local
    if (remoteReportSummary.value?.sessionId === sessionId) {
      return remoteReportSummary.value
    }
    return undefined
  }

  const hydrateReportContext = async (sessionId: string) => {
    if (!sessionId || !isInterviewReportApiAvailable()) {
      remoteReportSummary.value = null
      remoteEvidenceSnapshot.value = []
      return
    }

    isHydrating.value = true
    try {
      const localSummary = options.getLocalReportSummary(sessionId)
      if (localSummary) {
        remoteReportSummary.value = null
      } else {
        remoteReportSummary.value = await getRemoteInterviewReportBySessionId(sessionId)
      }

      let threadId = options.reportSession.value?.backendThreadId || ''
      if (!threadId) {
        const sessions = await listRemoteInterviewSessions()
        threadId = sessions.find(item => item.sessionId === sessionId)?.threadId || ''
      }

      if (!threadId) {
        remoteEvidenceSnapshot.value = []
        return
      }

      const sessionDetail = await getRemoteInterviewSessionDetail(sessionId, threadId)
      if (!sessionDetail?.messages?.length) {
        remoteEvidenceSnapshot.value = []
        return
      }

      const questionTitle = sessionDetail.questionTitle || '本轮训练'
      remoteEvidenceSnapshot.value = buildEvidenceFromRemoteMessages(questionTitle, sessionDetail.messages)
    } catch (error) {
      console.warn('[mock-interview-space] report hydration fallback:', error)
      remoteReportSummary.value = null
      remoteEvidenceSnapshot.value = []
    } finally {
      isHydrating.value = false
    }
  }

  watch(reportSessionId, (sessionId) => {
    void hydrateReportContext(sessionId)
  }, {
    immediate: true
  })

  const reportAnswerSnapshotFromRemote = computed(() => {
    const summary = resolveReportSummary(reportSessionId.value)
    if (summary?.answerSnapshot?.length) {
      return summary.answerSnapshot
    }
    return remoteEvidenceSnapshot.value
  })

  return {
    isReportHydrating: isHydrating,
    remoteReportSummary,
    reportAnswerSnapshotFromRemote,
    resolveReportSummary
  }
}

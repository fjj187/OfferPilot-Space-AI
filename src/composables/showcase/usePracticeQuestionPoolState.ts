import { ref } from 'vue'
import type { PracticeQuestionPool } from '@/types/practice-pool'
import type { PersistedPracticePlan, PersistedReportSummary } from '@/types/workbench'
import { generatePracticePool, isPracticePoolApiAvailable } from '@/services/practice/practice-pool-api'
import { buildPracticeReportSignature } from '@/utils/practice/build-practice-report-signature'
import {
  getPracticeQuestionPool,
  setPracticeQuestionPool
} from '@/utils/storage/practice-pool-storage'
import { getPersistedLibraryDocuments } from '@/utils/storage/workbench-storage'

export const PRACTICE_POOL_STALE_MESSAGE = '报告已更新（弱项或复盘有变化），请重新生成补练题'

const PREPARING_STALE_MS = 5 * 60 * 1000

const toStalePool = (pool: PracticeQuestionPool): PracticeQuestionPool => ({
  ...pool,
  status: 'idle',
  errorMessage: PRACTICE_POOL_STALE_MESSAGE
})

type PreparePracticeResult =
  | { ok: true, pool: PracticeQuestionPool, isShortfall: boolean }
  | { ok: false, message: string }

/** 同一场次并发生成时复用同一请求，切轨返回后仍等原请求结束 */
const inflightPrepareBySession = new Map<string, Promise<PreparePracticeResult>>()

export function usePracticeQuestionPoolState() {
  const poolVersion = ref(0)

  const touchPoolVersion = () => {
    poolVersion.value += 1
  }

  const resolvePoolForSession = (
    sessionId: string,
    report?: PersistedReportSummary | null
  ) => {
    void poolVersion.value
    if (!sessionId) return null

    const storedPool = getPracticeQuestionPool(sessionId)
    if (!storedPool) return null

    if (storedPool.status === 'preparing') {
      const preparedAt = Date.parse(storedPool.preparedAt)
      if (!Number.isNaN(preparedAt) && Date.now() - preparedAt > PREPARING_STALE_MS) {
        return {
          ...storedPool,
          status: 'error',
          errorMessage: '上次生成已中断，请重新点击「生成补练题」'
        }
      }
    }

    if (!report?.sessionId) return storedPool

    const currentSignature = buildPracticeReportSignature(report)
    if (storedPool.reportSignature && storedPool.reportSignature !== currentSignature) {
      return toStalePool(storedPool)
    }

    return storedPool
  }

  const getPoolStatusLabel = (pool: PracticeQuestionPool | null) => {
    if (!pool || pool.status === 'idle') {
      return pool?.errorMessage || '未准备'
    }
    if (pool.status === 'preparing') return '生成中'
    if (pool.status === 'ready') return `已生成 ${ pool.questions.length } 题`
    if (pool.status === 'error') return pool.errorMessage || '生成失败'
    return '未准备'
  }

  const isPracticePoolStale = (pool: PracticeQuestionPool | null) => (
    Boolean(pool?.errorMessage === PRACTICE_POOL_STALE_MESSAGE && pool.status === 'idle')
  )

  const preparePracticeQuestions = async (
    report: PersistedReportSummary,
    plan: PersistedPracticePlan,
    questionCount: number
  ): Promise<PreparePracticeResult> => {
    if (!report.sessionId) {
      return {
        ok: false as const,
        message: '缺少场次 ID，无法生成补练题'
      }
    }

    const sessionId = report.sessionId
    const inflight = inflightPrepareBySession.get(sessionId)
    if (inflight) {
      return inflight
    }

    const task = preparePracticeQuestionsTask(report, plan, questionCount)
    inflightPrepareBySession.set(sessionId, task)
    try {
      return await task
    } finally {
      if (inflightPrepareBySession.get(sessionId) === task) {
        inflightPrepareBySession.delete(sessionId)
      }
    }
  }

  const preparePracticeQuestionsTask = async (
    report: PersistedReportSummary,
    plan: PersistedPracticePlan,
    questionCount: number
  ): Promise<PreparePracticeResult> => {
    if (!isPracticePoolApiAvailable()) {
      return {
        ok: false as const,
        message: '补练题池 API 未配置，请启动后端并配置 VITE_INTERVIEW_API_BASE_URL'
      }
    }

    const reportSignature = buildPracticeReportSignature(report)
    const documentId = report.sourceDocumentId?.trim()
    const document = documentId
      ? getPersistedLibraryDocuments().find(item => item.id === documentId)
      : null
    const sourceDocumentExcerpt = report.sourceDocumentExcerpt?.trim() || ''

    setPracticeQuestionPool({
      sessionId: report.sessionId,
      reportId: report.id,
      planSnapshot: { ...plan },
      reportSignature,
      questions: [],
      preparedAt: new Date().toISOString(),
      status: 'preparing'
    })
    touchPoolVersion()

    try {
      const result = await generatePracticePool({
        sessionId: report.sessionId,
        reportId: report.id,
        questionCount,
        plan,
        questionReviews: report.questionReviews?.map(item => ({
          questionId: item.questionId,
          questionTitle: item.questionTitle,
          userAnswer: item.userAnswer,
          aiFeedback: item.aiFeedback
        })),
        sourceDocumentId: report.sourceDocumentId,
        sourceDocumentName: report.sourceDocumentName,
        sourceDocumentSummary: document?.summary,
        sourceDocumentTags: document?.tags,
        sourceDocumentExcerpt: sourceDocumentExcerpt || undefined,
        reportSignature,
        summaryBody: report.summaryBody,
        weaknessTags: report.weaknessTags
      })

      const pool: PracticeQuestionPool = {
        ...result.pool,
        planSnapshot: result.pool.planSnapshot || plan,
        reportSignature: result.pool.reportSignature || reportSignature,
        status: result.pool.questions.length ? 'ready' : 'error',
        errorMessage: result.pool.questions.length ? undefined : '未能生成任何补练题'
      }
      setPracticeQuestionPool(pool)
      touchPoolVersion()

      if (pool.status !== 'ready') {
        return {
          ok: false as const,
          message: pool.errorMessage || '未能生成补练题'
        }
      }

      return {
        ok: true as const,
        pool,
        isShortfall: result.isShortfall
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成补练题失败'
      setPracticeQuestionPool({
        sessionId: report.sessionId,
        reportId: report.id,
        planSnapshot: { ...plan },
        reportSignature,
        questions: [],
        preparedAt: new Date().toISOString(),
        status: 'error',
        errorMessage: message
      })
      touchPoolVersion()
      return {
        ok: false as const,
        message
      }
    }
  }

  return {
    poolVersion,
    touchPoolVersion,
    resolvePoolForSession,
    getPoolStatusLabel,
    isPracticePoolStale,
    preparePracticeQuestions
  }
}

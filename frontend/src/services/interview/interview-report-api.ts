import type { AxiosRequestConfig } from 'axios'

import request from '@/utils/request'
import type {
  PersistedPracticeDifficulty,
  PersistedPracticeFocusArea,
  PersistedPracticePlan,
  PersistedPracticeQuestionType,
  PersistedPracticeZone,
  PersistedReportSummary,
  PersistedTopicKey
} from '@/types/workbench'
import { isInterviewApiAvailable } from '@/services/interview/interview-session-api'

interface RemoteInterviewReportSummary {
  id: string
  sessionId: string
  threadId?: string
  topic: string
  source: string
  sourceDocumentId?: string
  sourceDocumentName?: string
  questionTitle?: string
  summaryHeadline: string
  summaryBody: string
  weaknessTags: string[]
  primaryWeakness?: string
  weaknessFocusAreas?: string[]
  answeredCount: number
  totalCount: number
  answerSnapshot?: string[]
  suggestedFocus?: string[]
  practicePlan?: {
    weaknessTag: string
    questionType: string
    difficulty: string
    zone: string
  }
  createdAt: string
  updatedAt: string
}

export interface GenerateRemoteInterviewReportPayload {
  sessionId: string
  topic?: string
  source?: string
  sourceDocumentId?: string
  sourceDocumentName?: string
  answeredCount?: number
  totalCount?: number
  weaknessTags?: string[]
  primaryWeakness?: string
}

const resolveInterviewApiBase = () => {
  const configuredBase = import.meta.env.VITE_INTERVIEW_API_BASE_URL?.trim() || ''
  if (configuredBase) return configuredBase.replace(/\/$/, '')
  if (import.meta.env.DEV) {
    return `${ window.location.origin }/api/interview`
  }
  return ''
}

const createInterviewApiError = (message: string) => new Error(message)

const normalizeApiPath = (apiBase: string, path: string) => `${ apiBase }${ path }`

const requestInterviewReportApi = async <T>(
  apiBase: string,
  path: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await request.get(
    normalizeApiPath(apiBase, path),
    undefined,
    {
      ...config,
      requestName: config?.requestName || path
    }
  )

  if (response.error !== 0) {
    throw createInterviewApiError(response.msg || `Interview report API request failed: ${ response.error }`)
  }

  return response.data as T
}

const postInterviewReportApi = async <T>(
  apiBase: string,
  path: string,
  payload?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await request.post(
    normalizeApiPath(apiBase, path),
    payload,
    {
      ...config,
      retry: config?.retry,
      requestName: config?.requestName || path
    }
  )

  if (response.error !== 0) {
    throw createInterviewApiError(response.msg || `Interview report API request failed: ${ response.error }`)
  }

  return response.data as T
}

const toPracticePlan = (report: RemoteInterviewReportSummary): PersistedPracticePlan | undefined => {
  if (!report.practicePlan) return undefined

  const focusArea = (report.weaknessFocusAreas?.[0] || 'structure') as PersistedPracticeFocusArea

  return {
    weaknessTag: report.practicePlan.weaknessTag,
    focusArea,
    zone: report.practicePlan.zone as PersistedPracticeZone,
    questionType: report.practicePlan.questionType as PersistedPracticeQuestionType,
    questionCount: 10,
    difficulty: report.practicePlan.difficulty as PersistedPracticeDifficulty,
    reason: report.summaryHeadline
  }
}

export const mapRemoteReportToPersisted = (
  report: RemoteInterviewReportSummary
): PersistedReportSummary => ({
  id: report.id,
  sessionId: report.sessionId,
  topic: report.topic as PersistedTopicKey,
  source: report.source,
  sourceDocumentId: report.sourceDocumentId,
  sourceDocumentName: report.sourceDocumentName,
  weaknessTags: report.weaknessTags,
  weaknessFocusAreas: report.weaknessFocusAreas as PersistedReportSummary['weaknessFocusAreas'],
  primaryWeakness: report.primaryWeakness,
  answeredCount: report.answeredCount,
  totalCount: report.totalCount,
  summaryHeadline: report.summaryHeadline,
  summaryBody: report.summaryBody,
  answerSnapshot: report.answerSnapshot,
  suggestedFocus: report.suggestedFocus,
  practicePlan: toPracticePlan(report),
  createdAt: report.createdAt
})

export const listRemoteInterviewReports = async () => {
  const apiBase = resolveInterviewApiBase()
  if (!apiBase) return []

  const payload = await requestInterviewReportApi<{ reports?: RemoteInterviewReportSummary[] }>(
    apiBase,
    '/reports',
    {
      requestName: 'listRemoteInterviewReports'
    }
  )
  return Array.isArray(payload.reports) ? payload.reports.map(mapRemoteReportToPersisted) : []
}

export const getRemoteInterviewReportBySessionId = async (sessionId: string) => {
  const apiBase = resolveInterviewApiBase()
  if (!apiBase || !sessionId) return null

  try {
    const encodedSessionId = encodeURIComponent(sessionId)
    const payload = await requestInterviewReportApi<{ report?: RemoteInterviewReportSummary }>(
      apiBase,
      `/reports/${ encodedSessionId }`,
      {
        requestName: 'getRemoteInterviewReportBySessionId'
      }
    )
    return payload.report ? mapRemoteReportToPersisted(payload.report) : null
  } catch {
    return null
  }
}

export const generateRemoteInterviewReport = async (payload: GenerateRemoteInterviewReportPayload) => {
  const apiBase = resolveInterviewApiBase()
  if (!apiBase) {
    throw createInterviewApiError('Interview report API is not configured.')
  }

  const result = await postInterviewReportApi<{
    report: RemoteInterviewReportSummary
    created: boolean
  }>(
    apiBase,
    '/reports/generate',
    payload,
    {
      requestName: 'generateRemoteInterviewReport'
    }
  )

  return {
    report: mapRemoteReportToPersisted(result.report),
    created: result.created
  }
}

export const isInterviewReportApiAvailable = () => isInterviewApiAvailable()

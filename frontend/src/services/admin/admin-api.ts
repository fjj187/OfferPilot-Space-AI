import request from '@/utils/request'
import type { AxiosRequestConfig } from 'axios'

export interface AdminDashboardResponse {
  metrics: {
    totalSessions: number
    todaySessions: number
    totalReports: number
    todayReports: number
    abnormalSessions: number
    reportSuccessRate: number
  }
  trends: {
    sessions7d: Array<{ label: string, count: number }>
    reports7d: Array<{ label: string, count: number }>
  }
  recentSessions: Array<{
    sessionId: string
    threadId: string
    topic: string
    questionTitle: string
    messageCount: number
    status: 'in_progress' | 'completed' | 'aborted'
    updatedAt: string
  }>
  recentReports: Array<{
    id: string
    sessionId: string
    topic: string
    summaryHeadline: string
    score: number
    generateStatus: 'generated' | 'incomplete'
    createdAt: string
  }>
}

export interface AdminSessionListItem {
  sessionId: string
  threadId: string
  topic: string
  questionTitle: string
  messageCount: number
  latestUserMessage: string
  latestAssistantMessage: string
  updatedAt: string
  status: 'in_progress' | 'completed' | 'aborted'
}

export interface AdminReportListItem {
  id: string
  sessionId: string
  threadId?: string
  topic: string
  questionTitle?: string
  summaryHeadline: string
  summaryBody: string
  primaryWeakness?: string
  weaknessTags: string[]
  answeredCount: number
  totalCount: number
  createdAt: string
  updatedAt: string
  score: number
  generateStatus: 'generated' | 'incomplete'
}

export type AdminModelProvider =
  | 'openai-compatible'
  | 'deepseek'
  | 'moonshot'
  | 'qwen'
  | 'ollama'
  | 'custom'

export interface AdminModelListItem {
  modelId: string
  displayName: string
  provider: AdminModelProvider
  baseUrl: string
  modelName: string
  apiKeyPreview?: string
  enabled: boolean
  isDefault: boolean
  supportsStream: boolean
  enableThinking: boolean
  createdAt: string
  updatedAt: string
  lastTestedAt?: string
  lastTestStatus?: 'success' | 'failed'
  lastTestMessage?: string
}

export interface AdminModelConnectivityTestResult {
  ok: boolean
  latencyMs: number
  message: string
  checkedAt: string
}

const unwrapResponse = <T>(response: IRequestData) => {
  if (response.error !== 0) {
    throw new Error(response.msg || 'Request failed')
  }

  return response.data as T
}

const resolveAdminApiBase = () => {
  const configuredBase = import.meta.env.VITE_ADMIN_API_BASE_URL?.trim() || ''
  if (configuredBase) return configuredBase.replace(/\/$/, '')
  if (import.meta.env.DEV) {
    return `${ window.location.origin }/api/admin`
  }
  return ''
}

const normalizeApiPath = (apiBase: string, path: string) => `${ apiBase }${ path }`

const requestAdminApi = async <T>(path: string, config?: AxiosRequestConfig) => {
  const apiBase = resolveAdminApiBase()
  if (!apiBase) {
    throw new Error('Admin API is not configured.')
  }

  const response = await request.get(normalizeApiPath(apiBase, path), undefined, {
    ...config,
    requestName: config?.requestName || path
  })

  return unwrapResponse<T>(response)
}

const requestAdminApiWithBody = async <T>(method: 'post' | 'put' | 'patch', path: string, data?: unknown, config?: AxiosRequestConfig) => {
  const apiBase = resolveAdminApiBase()
  if (!apiBase) {
    throw new Error('Admin API is not configured.')
  }

  const response = await request[method](normalizeApiPath(apiBase, path), data, {
    ...config,
    requestName: config?.requestName || path
  })

  return unwrapResponse<T>(response)
}

export const getAdminDashboard = async () => {
  return requestAdminApi<AdminDashboardResponse>('/dashboard', {
    requestName: 'getAdminDashboard'
  })
}

export const listAdminSessions = async () => {
  return requestAdminApi<{ sessions: AdminSessionListItem[] }>('/sessions', {
    requestName: 'listAdminSessions'
  }).then(payload => payload.sessions || [])
}

export const listAdminReports = async () => {
  return requestAdminApi<{ reports: AdminReportListItem[] }>('/reports', {
    requestName: 'listAdminReports'
  }).then(payload => payload.reports || [])
}

export const listAdminModels = async () => {
  return requestAdminApi<{ models: AdminModelListItem[] }>('/models', {
    requestName: 'listAdminModels'
  }).then(payload => payload.models || [])
}

export const createAdminModel = async (payload: Partial<AdminModelListItem> & { apiKey?: string }) => {
  return requestAdminApiWithBody<{ model: AdminModelListItem }>('post', '/models', payload, {
    requestName: 'createAdminModel'
  }).then(result => result.model)
}

export const updateAdminModel = async (modelId: string, payload: Partial<AdminModelListItem> & { apiKey?: string }) => {
  return requestAdminApiWithBody<{ model: AdminModelListItem }>('put', `/models/${ modelId }`, payload, {
    requestName: 'updateAdminModel'
  }).then(result => result.model)
}

export const updateAdminModelStatus = async (modelId: string, enabled: boolean) => {
  return requestAdminApiWithBody<{ model: AdminModelListItem }>('patch', `/models/${ modelId }/status`, { enabled }, {
    requestName: 'updateAdminModelStatus'
  }).then(result => result.model)
}

export const updateAdminModelDefault = async (modelId: string) => {
  return requestAdminApiWithBody<{ model: AdminModelListItem }>('patch', `/models/${ modelId }/default`, {}, {
    requestName: 'updateAdminModelDefault'
  }).then(result => result.model)
}

export const testAdminModel = async (modelId: string) => {
  return requestAdminApiWithBody<{ result: AdminModelConnectivityTestResult }>('post', `/models/${ modelId }/test`, {}, {
    requestName: 'testAdminModel'
  }).then(result => result.result)
}

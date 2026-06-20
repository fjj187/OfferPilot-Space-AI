import type { AxiosRequestConfig } from 'axios'

import request from '@/utils/request'
import type { InterviewMessage } from '@/types/message'

interface RemoteInterviewSessionListItem {
  sessionId: string
  threadId: string
  topic: string
  questionTitle: string
  feedbackStyle?: string
  messageCount: number
  latestUserMessage?: string
  latestAssistantMessage?: string
  updatedAt: string
}

interface RemoteInterviewSessionDetail extends RemoteInterviewSessionListItem {
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    createdAt: string
  }>
}

const resolveInterviewApiBase = () => {
  const configuredBase = import.meta.env.VITE_INTERVIEW_API_BASE_URL?.trim() || ''
  if (configuredBase) return configuredBase.replace(/\/$/, '')
  if (import.meta.env.DEV) {
    return `${ window.location.origin }/api/interview`
  }
  return ''
}

const INTERVIEW_API_RETRY_CONFIG: AxiosRequestConfig['retry'] = {
  maxRetries: 2,
  retryDelayMs: 600
}
const INTERVIEW_API_NO_RETRY_CONFIG: AxiosRequestConfig['retry'] = {
  maxRetries: 0
}

const createInterviewApiError = (message: string) => new Error(message)

const normalizeApiPath = (apiBase: string, path: string) => `${ apiBase }${ path }`

const requestInterviewApi = async <T>(
  apiBase: string,
  path: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await request.get(
    normalizeApiPath(apiBase, path),
    undefined,
    {
      ...config,
      retry: config?.retry ?? INTERVIEW_API_RETRY_CONFIG,
      requestName: config?.requestName || path
    }
  )

  if (response.error !== 0) {
    throw createInterviewApiError(response.msg || `Interview API request failed: ${ response.error }`)
  }

  return response.data as T
}

const postInterviewApi = async <T>(
  apiBase: string,
  path: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  const response = await request.post(
    normalizeApiPath(apiBase, path),
    data,
    {
      ...config,
      retry: config?.retry ?? INTERVIEW_API_RETRY_CONFIG,
      requestName: config?.requestName || path
    }
  )

  if (response.error !== 0) {
    throw createInterviewApiError(response.msg || `Interview API request failed: ${ response.error }`)
  }

  return response.data as T
}

export const isInterviewApiAvailable = () => Boolean(resolveInterviewApiBase())

export const listRemoteInterviewSessions = async () => {
  const apiBase = resolveInterviewApiBase()
  if (!apiBase) return []

  const payload = await requestInterviewApi<{ sessions?: RemoteInterviewSessionListItem[] }>(
    apiBase,
    '/sessions',
    {
      requestName: 'listRemoteInterviewSessions'
    }
  )
  return Array.isArray(payload.sessions) ? payload.sessions : []
}

export const getRemoteInterviewSessionDetail = async (sessionId: string, threadId: string) => {
  const apiBase = resolveInterviewApiBase()
  if (!apiBase || !sessionId || !threadId) return null

  const encodedSessionId = encodeURIComponent(sessionId)
  const encodedThreadId = encodeURIComponent(threadId)
  const payload = await requestInterviewApi<{ session?: RemoteInterviewSessionDetail }>(
    apiBase,
    `/sessions/${ encodedSessionId }/${ encodedThreadId }`,
    {
      requestName: 'getRemoteInterviewSessionDetail'
    }
  )

  return payload.session || null
}

export const clearRemoteInterviewHistory = async () => {
  const apiBase = resolveInterviewApiBase()
  if (!apiBase) return false

  await postInterviewApi<{ ok?: boolean }>(
    apiBase,
    '/history/clear',
    undefined,
    {
      retry: INTERVIEW_API_NO_RETRY_CONFIG,
      requestName: 'clearRemoteInterviewHistory'
    }
  )
  return true
}

export const buildInterviewMessagesFromRemote = (detail: RemoteInterviewSessionDetail): InterviewMessage[] => {
  return detail.messages.map((item, index) => ({
    id: `${ detail.sessionId }-${ detail.threadId }-${ index }`,
    threadId: detail.threadId,
    role: item.role,
    content: item.content,
    displayContent: item.content,
    format: item.role === 'assistant' ? 'markdown' : 'plain',
    status: 'done',
    createdAt: item.createdAt
  }))
}

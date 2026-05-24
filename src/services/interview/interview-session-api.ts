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
  return import.meta.env.DEV ? '/api/interview' : ''
}

const createInterviewApiError = (message: string) => new Error(message)

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init)
  if (!response.ok) {
    throw createInterviewApiError(`Interview API request failed: ${ response.status }`)
  }

  return response.json() as Promise<T>
}

export const isInterviewApiAvailable = () => Boolean(resolveInterviewApiBase())

export const listRemoteInterviewSessions = async () => {
  const apiBase = resolveInterviewApiBase()
  if (!apiBase) return []

  const payload = await fetchJson<{ sessions?: RemoteInterviewSessionListItem[] }>(`${ apiBase }/sessions`)
  return Array.isArray(payload.sessions) ? payload.sessions : []
}

export const getRemoteInterviewSessionDetail = async (sessionId: string, threadId: string) => {
  const apiBase = resolveInterviewApiBase()
  if (!apiBase || !sessionId || !threadId) return null

  const encodedSessionId = encodeURIComponent(sessionId)
  const encodedThreadId = encodeURIComponent(threadId)
  const payload = await fetchJson<{ session?: RemoteInterviewSessionDetail }>(
    `${ apiBase }/sessions/${ encodedSessionId }/${ encodedThreadId }`
  )

  return payload.session || null
}

export const clearRemoteInterviewHistory = async () => {
  const apiBase = resolveInterviewApiBase()
  if (!apiBase) return false

  await fetchJson<{ ok?: boolean }>(`${ apiBase }/history/clear`, {
    method: 'POST'
  })
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

import type { InterviewMessage } from '@/types/message'

const INTERVIEW_MESSAGE_STORAGE_PREFIX = 'offerpilot.interview.messages.'

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage

const resolveStorageKey = (sessionId: string) => `${ INTERVIEW_MESSAGE_STORAGE_PREFIX }${ sessionId }`

const normalizeMessage = (message: InterviewMessage): InterviewMessage => ({
  ...message,
  status: message.status === 'streaming' ? 'aborted' : message.status,
  displayContent: message.displayContent || message.content,
  content: message.content || message.displayContent
})

export const getPersistedInterviewMessages = (sessionId: string): InterviewMessage[] => {
  if (!sessionId || !canUseStorage()) return []

  try {
    const raw = window.localStorage.getItem(resolveStorageKey(sessionId))
    const parsed = raw ? JSON.parse(raw) as InterviewMessage[] : []
    return Array.isArray(parsed) ? parsed.map(normalizeMessage) : []
  } catch {
    return []
  }
}

export const setPersistedInterviewMessages = (sessionId: string, messages: InterviewMessage[]) => {
  if (!sessionId || !canUseStorage()) return
  window.localStorage.setItem(resolveStorageKey(sessionId), JSON.stringify(messages.map(normalizeMessage)))
}

export const clearPersistedInterviewMessages = (sessionId: string) => {
  if (!sessionId || !canUseStorage()) return
  window.localStorage.removeItem(resolveStorageKey(sessionId))
}

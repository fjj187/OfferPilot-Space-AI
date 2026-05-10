import type { InterviewStreamEvent } from '@/services/sse/sse-types'

export const parseInterviewStreamChunk = (
  messageId: string,
  chunk: string
): InterviewStreamEvent | null => {
  const normalized = chunk.replace(/\r/g, '')

  if (!normalized) {
    return null
  }

  if (normalized.trim() === '[DONE]') {
    return {
      type: 'done',
      messageId
    }
  }

  return {
    type: 'delta',
    messageId,
    delta: normalized
  }
}

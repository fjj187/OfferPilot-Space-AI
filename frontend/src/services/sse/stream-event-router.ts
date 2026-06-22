import type { InterviewApiError, InterviewStreamEvent } from './sse-types'

interface SSEFrame {
  event: string
  data: string
}

const parseFrameJson = <T>(data: string): T | null => {
  const normalized = data.trim()
  if (!normalized) return null

  try {
    return JSON.parse(normalized) as T
  } catch {
    return null
  }
}

export const createFallbackStreamError = (message: string) => ({
  code: 'INTERVIEW_STREAM_ERROR',
  message,
  retryable: true
})

export const routeInterviewSSEFrame = (
  frame: SSEFrame,
  messageId: string
): InterviewStreamEvent[] => {
  if (frame.event === 'chunk' || frame.event === 'message') {
    const chunkPayload = parseFrameJson<{ content?: string }>(frame.data)

    return [
      {
        type: 'chunk',
        messageId,
        chunk: chunkPayload?.content || frame.data
      }
    ]
  }

  if (frame.event === 'done') {
    return [{ type: 'done', messageId }]
  }

  if (frame.event === 'heartbeat') {
    const heartbeatPayload = parseFrameJson<{
      idempotentKey?: string
      sequence?: number
    }>(frame.data)

    return [
      {
        type: 'heartbeat',
        messageId,
        idempotentKey: heartbeatPayload?.idempotentKey,
        checkpointSequence: heartbeatPayload?.sequence
      }
    ]
  }

  if (frame.event === 'checkpoint') {
    const checkpointPayload = parseFrameJson<{
      idempotentKey?: string
      sequence?: number
      status?: 'streaming' | 'done' | 'error' | 'aborted'
    }>(frame.data)

    return [
      {
        type: 'checkpoint',
        messageId,
        idempotentKey: checkpointPayload?.idempotentKey,
        checkpointSequence: checkpointPayload?.sequence,
        checkpointStatus: checkpointPayload?.status
      }
    ]
  }

  if (frame.event === 'error') {
    const parsedError = parseFrameJson<InterviewApiError>(frame.data)

    return [
      {
        type: 'error',
        messageId,
        error: parsedError || createFallbackStreamError(frame.data || 'Stream request failed')
      }
    ]
  }

  return []
}

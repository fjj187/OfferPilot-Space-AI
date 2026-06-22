import { consumeSSEStream, consumeStreamText } from './sse-client'
import { classifyFetchStreamError, createFetchStreamReader, isFetchStreamTransportError } from './fetch-stream-transport'
import { createMockInterviewStreamReader } from './interview-stream-mock'
import { normalizeInterviewStreamRequest, resolveInterviewStreamEndpoint, resolveInterviewStreamMode } from './interview-stream-payload'
import { StreamConnectionManager } from './stream-connection-manager'
import { createFallbackStreamError, routeInterviewSSEFrame } from './stream-event-router'
import type { InterviewApiError, InterviewStreamHandlers, InterviewStreamLaunchPayload, InterviewStreamRequest, InterviewStreamTask } from './sse-types'

const createId = () => `msg-${ Date.now() }-${ Math.random().toString(36).slice(2, 8) }`

const createStreamError = (message: string, code = 'INTERVIEW_STREAM_ERROR', retryable = true): InterviewApiError => ({
  code,
  message,
  retryable
})

const createInterviewStreamReader = async (
  request: InterviewStreamRequest,
  signal?: AbortSignal
): Promise<ReadableStreamDefaultReader<string>> => {
  const endpoint = resolveInterviewStreamEndpoint()
  const normalizedRequest = normalizeInterviewStreamRequest(request)

  if (!endpoint) {
    return createMockInterviewStreamReader(normalizedRequest)
  }

  return createFetchStreamReader({
    endpoint,
    body: normalizedRequest,
    signal
  })
}

export const startInterviewStream = (
  payload: InterviewStreamLaunchPayload,
  handlers: InterviewStreamHandlers
): InterviewStreamTask => {
  const connectionManager = new StreamConnectionManager()
  const messageId = createId()
  const mode = resolveInterviewStreamMode()
  let hasCompleted = false
  const signal = connectionManager.open()
  const createReader = (nextSignal?: AbortSignal) => createInterviewStreamReader({
    ...payload,
    messageId
  }, nextSignal)

  const emitActivity = () => {
    connectionManager.markActive()
    handlers.onEvent({
      type: 'activity',
      messageId,
      mode
    })
  }

  const resolveStreamError = (error: Error): InterviewApiError => {
    if (isFetchStreamTransportError(error)) {
      return createStreamError(error.message, error.code, error.retryable)
    }

    if ('code' in error && 'message' in error) {
      return error as InterviewApiError
    }

    const transportError = classifyFetchStreamError(error)
    return createStreamError(transportError.message, transportError.code, transportError.retryable)
  }

  if (mode === 'remote') {
    consumeSSEStream({
      signal,
      createReader,
      onStart: () => {
        emitActivity()
        handlers.onEvent({
          type: 'start',
          messageId,
          mode
        })
      },
      onEvent: (frame) => {
        emitActivity()

        routeInterviewSSEFrame(frame, messageId).forEach((event) => {
          if (event.type === 'done') {
            hasCompleted = true
            connectionManager.markClosed()
          }

          if (event.type === 'error') {
            connectionManager.markError()
            event.error = event.error || createFallbackStreamError('Stream request failed')
          }

          if (event.type === 'heartbeat' || event.type === 'checkpoint') {
            connectionManager.markActive()
          }

          handlers.onEvent(event)
        })
      },
      onDone: () => {
        emitActivity()
        if (hasCompleted) return
        hasCompleted = true
        connectionManager.markClosed()
        handlers.onEvent({
          type: 'done',
          messageId
        })
      },
      onError: error => {
        connectionManager.markError()
        handlers.onEvent({
          type: 'error',
          messageId,
          error: resolveStreamError(error)
        })
      }
    })
  }
  else {
    consumeStreamText({
      signal,
      createReader,
      onStart: () => {
        emitActivity()
        handlers.onEvent({
          type: 'start',
          messageId,
          mode
        })
      },
      onChunk: chunk => {
        emitActivity()
        handlers.onEvent({
          type: 'chunk',
          messageId,
          chunk
        })
      },
      onDone: () => {
        emitActivity()
        if (hasCompleted) return
        hasCompleted = true
        connectionManager.markClosed()
        handlers.onEvent({
          type: 'done',
          messageId
        })
      },
      onError: error => {
        connectionManager.markError()
        handlers.onEvent({
          type: 'error',
          messageId,
          error: resolveStreamError(error)
        })
      }
    })
  }

  return {
    messageId,
    abort: () => {
      connectionManager.abort()
    },
    getSnapshot: () => connectionManager.getSnapshot()
  }
}

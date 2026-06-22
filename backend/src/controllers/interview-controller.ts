import type { Request, Response } from 'express'
import { InterviewService } from '../services/interview-service.js'
import { createInterviewProvider } from '../services/interview-provider-factory.js'
import {
  getStoredInterviewSession,
  getStoredInterviewSessions,
  getStoredInterviewSessionsByOwner
} from '../storage/interview-session-store.js'
import {
  failInterviewStreamCheckpoint,
  getLatestStoredInterviewStreamCheckpoint,
  getStoredInterviewStreamCheckpoint
} from '../storage/interview-stream-checkpoint-store.js'
import type {
  InterviewApiError,
  InterviewStreamCheckpointSnapshot,
  InterviewSessionDetail,
  InterviewSessionListItem,
  InterviewStreamRequest
} from '../types/interview.js'
import { setupSSEResponse, writeSSEEvent } from '../utils/sse.js'

const createValidationError = (message: string): InterviewApiError => ({
  code: 'INVALID_REQUEST',
  message
})

const validateInterviewRequest = (body: Partial<InterviewStreamRequest>) => {
  if (!body.sessionId) return createValidationError('sessionId is required.')
  if (!body.messageId) return createValidationError('messageId is required.')
  if (!body.threadId) return createValidationError('threadId is required.')
  if (!body.topic) return createValidationError('topic is required.')
  if (!body.topicLabel) return createValidationError('topicLabel is required.')
  if (!body.questionTitle) return createValidationError('questionTitle is required.')
  if (!body.questionPrompt) return createValidationError('questionPrompt is required.')
  if (!body.answer) return createValidationError('answer is required.')
  if (!body.prompt) return createValidationError('prompt is required.')
  return null
}

const buildCheckpointDetail = (
  checkpoint: ReturnType<typeof getStoredInterviewStreamCheckpoint>
): InterviewStreamCheckpointSnapshot | null => {
  if (!checkpoint) return null

  return {
    sessionId: checkpoint.sessionId,
    threadId: checkpoint.threadId,
    messageId: checkpoint.messageId,
    idempotentKey: checkpoint.idempotentKey,
    status: checkpoint.status,
    content: checkpoint.content,
    lastSequence: checkpoint.lastSequence,
    createdAt: checkpoint.createdAt,
    updatedAt: checkpoint.updatedAt,
    completedAt: checkpoint.completedAt,
    errorCode: checkpoint.errorCode,
    errorMessage: checkpoint.errorMessage
  }
}

const buildSessionListItem = (session: ReturnType<typeof getStoredInterviewSessions>[number]): InterviewSessionListItem => ({
  sessionId: session.sessionId,
  threadId: session.threadId,
  topic: session.topic,
  questionTitle: session.questionTitle,
  feedbackStyle: session.feedbackStyle,
  messageCount: session.messages.length,
  latestUserMessage: [...session.messages].reverse().find(item => item.role === 'user')?.content || '',
  latestAssistantMessage: [...session.messages].reverse().find(item => item.role === 'assistant')?.content || '',
  updatedAt: session.updatedAt
})

const buildSessionDetail = (session: NonNullable<ReturnType<typeof getStoredInterviewSession>>): InterviewSessionDetail => ({
  ...buildSessionListItem(session),
  messages: session.messages
})

const resolveScopedSessionList = (request: Request) => {
  if (request.authUser?.role === 'admin') {
    return getStoredInterviewSessions()
  }

  if (request.authUser?.role === 'user') {
    return getStoredInterviewSessionsByOwner(request.authUser.username)
  }

  return getStoredInterviewSessions().filter(session => !session.owner)
}

const canAccessSession = (
  request: Request,
  session: NonNullable<ReturnType<typeof getStoredInterviewSession>>
) => {
  if (!request.authUser) return !session.owner
  if (request.authUser.role === 'admin') return true
  return session.owner === request.authUser.username
}

export const streamInterviewController = async (request: Request, response: Response) => {
  const payload = request.body as Partial<InterviewStreamRequest>
  const validationError = validateInterviewRequest(payload)

  if (validationError) {
    response.status(400).json(validationError)
    return
  }

  setupSSEResponse(response)

  const interviewService = new InterviewService(createInterviewProvider())
  const streamAbortController = new AbortController()
  let clientClosedEarly = false
  const normalizedPayload = {
    ...payload,
    idempotentKey: payload.idempotentKey?.trim() || payload.messageId
  } as InterviewStreamRequest
  const checkpointKey = normalizedPayload.idempotentKey || normalizedPayload.messageId
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null

  const stopHeartbeat = () => {
    if (!heartbeatTimer) return
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }

  const emitCheckpointEvent = () => {
    const checkpoint = getStoredInterviewStreamCheckpoint(
      normalizedPayload.sessionId,
      normalizedPayload.threadId,
      checkpointKey
    )

    if (!checkpoint || response.writableEnded) return

    writeSSEEvent(response, 'checkpoint', {
      idempotentKey: checkpoint.idempotentKey,
      sequence: checkpoint.lastSequence,
      status: checkpoint.status
    })
  }

  response.on('close', () => {
    if (!response.writableEnded) {
      clientClosedEarly = true
      streamAbortController.abort()
    }
  })

  try {
    heartbeatTimer = setInterval(() => {
      if (clientClosedEarly || response.writableEnded) {
        stopHeartbeat()
        return
      }

      writeSSEEvent(response, 'heartbeat', {
        ts: Date.now(),
        idempotentKey: checkpointKey
      })
      emitCheckpointEvent()
    }, 5000)

    for await (const event of interviewService.streamInterview(normalizedPayload, {
      signal: streamAbortController.signal,
      owner: request.authUser?.username
    })) {
      if (clientClosedEarly || response.writableEnded) {
        break
      }

      if (event.type === 'chunk') {
        writeSSEEvent(response, 'chunk', {
          content: event.content
        })
        continue
      }

      if (event.type === 'done') {
        writeSSEEvent(response, 'done', {})
        break
      }

      if (event.type === 'heartbeat') {
        writeSSEEvent(response, 'heartbeat', {
          idempotentKey: event.checkpointIdempotentKey,
          sequence: event.checkpointSequence,
          ts: Date.now()
        })
        emitCheckpointEvent()
        continue
      }

      if (event.type === 'error') {
        writeSSEEvent(response, 'error', {
          code: event.code,
          message: event.message
        })
        break
      }
    }
  } catch (error) {
    if (streamAbortController.signal.aborted || clientClosedEarly) {
      failInterviewStreamCheckpoint({
        sessionId: normalizedPayload.sessionId,
        threadId: normalizedPayload.threadId,
        idempotentKey: checkpointKey,
        code: 'STREAM_ABORTED',
        message: 'Stream aborted by client.',
        status: 'aborted'
      })
      return
    }

    const normalizedError: InterviewApiError = {
      code: 'INTERNAL_STREAM_ERROR',
      message: error instanceof Error ? error.message : 'Unknown stream error.'
    }
    failInterviewStreamCheckpoint({
      sessionId: normalizedPayload.sessionId,
      threadId: normalizedPayload.threadId,
      idempotentKey: checkpointKey,
      code: normalizedError.code,
      message: normalizedError.message,
      status: 'error'
    })
    writeSSEEvent(response, 'error', {
      ...normalizedError
    })
  } finally {
    stopHeartbeat()
    streamAbortController.abort()

    if (!response.writableEnded) {
      response.end()
    }
  }
}

export const listInterviewSessionsController = (request: Request, response: Response) => {
  response.json({
    sessions: resolveScopedSessionList(request).map(buildSessionListItem)
  })
}

export const getInterviewSessionDetailController = (request: Request, response: Response) => {
  const sessionId = String(request.params.sessionId || '').trim()
  const threadId = String(request.params.threadId || '').trim()

  if (!sessionId || !threadId) {
    response.status(400).json(createValidationError('sessionId and threadId are required.'))
    return
  }

  const session = getStoredInterviewSession(sessionId, threadId)

  if (!session) {
    response.status(404).json({
      code: 'SESSION_NOT_FOUND',
      message: `No interview session found for sessionId=${ sessionId } and threadId=${ threadId }.`
    })
    return
  }

  if (!canAccessSession(request, session)) {
    response.status(404).json({
      code: 'SESSION_NOT_FOUND',
      message: `No interview session found for sessionId=${ sessionId } and threadId=${ threadId }.`
    })
    return
  }

  response.json({
    session: buildSessionDetail(session)
  })
}

export const getInterviewStreamCheckpointController = (request: Request, response: Response) => {
  const sessionId = String(request.params.sessionId || '').trim()
  const threadId = String(request.params.threadId || '').trim()
  const idempotentKey = String(request.query.idempotentKey || '').trim()

  if (!sessionId || !threadId) {
    response.status(400).json(createValidationError('sessionId and threadId are required.'))
    return
  }

  const session = getStoredInterviewSession(sessionId, threadId)
  if (!session) {
    response.status(404).json({
      code: 'SESSION_NOT_FOUND',
      message: `No interview session found for sessionId=${ sessionId } and threadId=${ threadId }.`
    })
    return
  }

  if (!canAccessSession(request, session)) {
    response.status(404).json({
      code: 'SESSION_NOT_FOUND',
      message: `No interview session found for sessionId=${ sessionId } and threadId=${ threadId }.`
    })
    return
  }

  const checkpoint = idempotentKey
    ? getStoredInterviewStreamCheckpoint(sessionId, threadId, idempotentKey)
    : getLatestStoredInterviewStreamCheckpoint(sessionId, threadId)

  if (!checkpoint) {
    response.status(404).json({
      code: 'CHECKPOINT_NOT_FOUND',
      message: `No checkpoint found for sessionId=${ sessionId } and threadId=${ threadId }.`
    })
    return
  }

  response.json({
    checkpoint: buildCheckpointDetail(checkpoint)
  })
}

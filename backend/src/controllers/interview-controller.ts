import type { Request, Response } from 'express'
import { InterviewService } from '../services/interview-service.js'
import { createInterviewProvider } from '../services/interview-provider-factory.js'
import { getStoredInterviewSession, getStoredInterviewSessions } from '../storage/interview-session-store.js'
import type {
  InterviewApiError,
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

  response.on('close', () => {
    if (!response.writableEnded) {
      clientClosedEarly = true
      streamAbortController.abort()
    }
  })

  try {
    for await (const event of interviewService.streamInterview(payload as InterviewStreamRequest, {
      signal: streamAbortController.signal
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
      return
    }

    const normalizedError: InterviewApiError = {
      code: 'INTERNAL_STREAM_ERROR',
      message: error instanceof Error ? error.message : 'Unknown stream error.'
    }
    writeSSEEvent(response, 'error', {
      ...normalizedError
    })
  } finally {
    streamAbortController.abort()

    if (!response.writableEnded) {
      response.end()
    }
  }
}

export const listInterviewSessionsController = (_request: Request, response: Response) => {
  response.json({
    sessions: getStoredInterviewSessions().map(buildSessionListItem)
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

  response.json({
    session: buildSessionDetail(session)
  })
}

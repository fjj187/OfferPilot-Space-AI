import type { InterviewMessageFormat } from '@/types/message'
import type { PersistedInterviewFeedbackStyle, PersistedTopicKey } from '@/types/workbench'

export type InterviewStreamMode = 'mock' | 'remote'
export type StreamConnectionStatus = 'idle' | 'connecting' | 'active' | 'inactive' | 'closed' | 'error' | 'aborted'

export interface InterviewApiError {
  code: string
  message: string
  retryable?: boolean
}

export interface InterviewStreamEvent {
  type: 'start' | 'activity' | 'chunk' | 'done' | 'error' | 'heartbeat' | 'checkpoint'
  messageId: string
  mode?: InterviewStreamMode
  chunk?: string
  error?: InterviewApiError
  idempotentKey?: string
  checkpointSequence?: number
  checkpointStatus?: 'streaming' | 'done' | 'error' | 'aborted'
}

// Frontend request contract for the interview streaming endpoint.
// The backend should accept this JSON payload over POST and return an SSE-like
// text streaming response whose chunks can be appended directly to the
// assistant message body.
export interface InterviewStreamRequest {
  sessionId: string
  messageId: string
  threadId: string
  idempotentKey?: string
  topic: PersistedTopicKey
  topicLabel: string
  prompt: string
  questionTitle: string
  questionPrompt: string
  answer: string
  sourceContext?: string
  sourceDocumentName?: string
  sourceDocumentSummary?: string
  sourceDocumentTags?: string[]
  sourceDocumentExcerpt?: string
  feedbackStyle?: PersistedInterviewFeedbackStyle
  format?: InterviewMessageFormat
  questionIndex?: number
  questionCount?: number
  unknownAnswerStreak?: number
  forceRevealReferenceAnswer?: boolean
  referenceAnswerHint?: string
}

export type InterviewStreamLaunchPayload = Omit<InterviewStreamRequest, 'messageId'>

export interface InterviewStreamHandlers {
  onEvent: (event: InterviewStreamEvent) => void
}

export interface StreamConnectionSnapshot {
  status: StreamConnectionStatus
  lastActivityAt: number | null
  lastErrorAt: number | null
  isAborted: boolean
}

export interface InterviewStreamTask {
  messageId: string
  abort: () => void
  getSnapshot: () => StreamConnectionSnapshot
}

export interface StreamHeartbeatState {
  status: StreamConnectionStatus
  lastActivityAt: number | null
  inactive: boolean
}

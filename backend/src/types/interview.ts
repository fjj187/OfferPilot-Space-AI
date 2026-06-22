export type InterviewFeedbackStyle = 'followup' | 'corrective' | 'guided'

export interface InterviewStreamRequest {
  sessionId: string
  messageId: string
  threadId: string
  idempotentKey?: string
  topic: string
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
  feedbackStyle?: InterviewFeedbackStyle
  format?: 'plain' | 'markdown'
  /** 当前题序号（从 1 开始），用于约束模型勿在对话中切题 */
  questionIndex?: number
  /** 本轮总题数 */
  questionCount?: number
  /** 本题内连续「不知道」次数（含当前回答） */
  unknownAnswerStreak?: number
  /** 连续不知道达阈值后，强制揭晓参考答案 */
  forceRevealReferenceAnswer?: boolean
  /** 揭晓时优先参照的资料参考答案摘要 */
  referenceAnswerHint?: string
}

export interface InterviewStreamChunkEvent {
  type: 'chunk'
  content: string
}

export interface InterviewStreamDoneEvent {
  type: 'done'
}

export interface InterviewStreamHeartbeatEvent {
  type: 'heartbeat'
  checkpointIdempotentKey: string
  checkpointSequence: number
}

export interface InterviewStreamErrorEvent {
  type: 'error'
  code: string
  message: string
}

export type InterviewProviderEvent =
  | InterviewStreamChunkEvent
  | InterviewStreamDoneEvent
  | InterviewStreamHeartbeatEvent
  | InterviewStreamErrorEvent

export interface InterviewApiError {
  code: string
  message: string
}

export interface InterviewSessionListItem {
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

export interface InterviewSessionDetail extends InterviewSessionListItem {
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    createdAt: string
  }>
}

export interface InterviewStreamCheckpointSnapshot {
  sessionId: string
  threadId: string
  messageId: string
  idempotentKey: string
  status: 'streaming' | 'done' | 'error' | 'aborted'
  content: string
  lastSequence: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  errorCode?: string
  errorMessage?: string
}

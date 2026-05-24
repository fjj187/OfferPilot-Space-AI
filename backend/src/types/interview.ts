export type InterviewFeedbackStyle = 'followup' | 'corrective' | 'guided'

export interface InterviewStreamRequest {
  sessionId: string
  messageId: string
  threadId: string
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
}

export interface InterviewStreamChunkEvent {
  type: 'chunk'
  content: string
}

export interface InterviewStreamDoneEvent {
  type: 'done'
}

export interface InterviewStreamErrorEvent {
  type: 'error'
  code: string
  message: string
}

export type InterviewProviderEvent =
  | InterviewStreamChunkEvent
  | InterviewStreamDoneEvent
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

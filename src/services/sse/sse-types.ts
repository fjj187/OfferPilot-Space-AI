import type { InterviewMessageFormat } from '@/types/message'
import type { PersistedInterviewFeedbackStyle } from '@/types/workbench'

export type InterviewStreamMode = 'mock' | 'remote'

export interface InterviewStreamEvent {
  type: 'start' | 'delta' | 'done' | 'error'
  messageId: string
  mode?: InterviewStreamMode
  delta?: string
  errorMessage?: string
}

// Frontend request contract for the mock interview streaming endpoint.
// The backend should accept this JSON payload over POST and return a text
// streaming response whose chunks can be appended directly to the assistant
// message body.
export interface InterviewStreamRequest {
  messageId: string
  prompt: string
  topicLabel: string
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
}

export interface InterviewStreamHandlers {
  onEvent: (event: InterviewStreamEvent) => void
}

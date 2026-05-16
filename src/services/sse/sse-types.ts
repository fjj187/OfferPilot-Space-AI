import type { InterviewMessageFormat } from '@/types/message'

export interface InterviewStreamEvent {
  type: 'start' | 'delta' | 'done' | 'error'
  messageId: string
  delta?: string
  errorMessage?: string
}

export interface InterviewStreamRequest {
  messageId: string
  prompt: string
  topicLabel: string
  questionTitle: string
  questionPrompt: string
  answer: string
  sourceContext?: string
  sourceDocumentName?: string
  format?: InterviewMessageFormat
}

export interface InterviewStreamHandlers {
  onEvent: (event: InterviewStreamEvent) => void
}

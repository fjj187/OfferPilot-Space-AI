export type InterviewMessageRole = 'assistant' | 'user' | 'system'
export type InterviewMessageFormat = 'plain' | 'markdown'
export type InterviewMessageStatus = 'streaming' | 'done' | 'error' | 'aborted'

export interface InterviewMessage {
  id: string
  threadId: string
  role: InterviewMessageRole
  content: string
  displayContent: string
  format: InterviewMessageFormat
  status: InterviewMessageStatus
  createdAt: string
}

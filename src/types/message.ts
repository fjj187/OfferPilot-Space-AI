export type InterviewMessageRole = 'assistant' | 'user' | 'system'
export type InterviewMessageFormat = 'plain' | 'markdown'
export type InterviewMessageStatus = 'streaming' | 'done' | 'error'

export interface InterviewMessage {
  id: string
  role: InterviewMessageRole
  content: string
  displayContent: string
  format: InterviewMessageFormat
  status: InterviewMessageStatus
  createdAt: string
}

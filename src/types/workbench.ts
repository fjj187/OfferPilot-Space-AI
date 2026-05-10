export type PersistedTopicKey =
  | 'vue3'
  | 'typescript'
  | 'engineering'
  | 'browser'
  | 'performance'
  | 'scenario'

export type PersistedDocumentType = 'md' | 'docx'
export type PersistedDocumentStatus = 'pending' | 'parsed' | 'error'
export type PersistedInterviewMode = 'standard' | 'guided'
export type PersistedInterviewStatus = 'in_progress' | 'completed' | 'aborted'

export interface PersistedLibraryDocument {
  id: string
  name: string
  type: PersistedDocumentType
  size: number
  importedAt: string
  summary: string
  tags: string[]
  status: PersistedDocumentStatus
  topicKeys: PersistedTopicKey[]
  sourceKey?: string
  recommendedReason?: string
  rawText?: string
}

export interface PersistedWorkbenchContext {
  activeTopic: PersistedTopicKey
  activeDocumentId: string
  currentMode?: PersistedInterviewMode
  sourcePage?: string
  updatedAt: string
}

export interface PersistedInterviewSession {
  id: string
  topic: PersistedTopicKey
  mode: PersistedInterviewMode
  source: string
  sourceDocumentId?: string
  docType?: PersistedDocumentType
  questionCount: number
  answeredCount: number
  currentQuestionIndex: number
  submittedQuestionIds: string[]
  weaknessTags: string[]
  followUpIndex: number
  hintVisible: boolean
  startedAt: string
  finishedAt?: string
  status: PersistedInterviewStatus
}

export interface PersistedReportSummary {
  id: string
  sessionId: string
  topic: PersistedTopicKey
  source: string
  weaknessTags: string[]
  answeredCount: number
  totalCount: number
  createdAt: string
}

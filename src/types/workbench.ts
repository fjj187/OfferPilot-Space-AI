import type { InterviewMessage } from '@/types/message'

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
export type PersistedPracticeZone = 'vue' | 'javascript' | 'typescript' | 'engineering' | 'performance'
export type PersistedPracticeQuestionType = 'concept' | 'code' | 'scenario'
export type PersistedPracticeDifficulty = 'easy' | 'medium' | 'hard'
export type PersistedPracticeFocusArea = 'structure' | 'case_detail' | 'result_metric' | 'principle_depth'
export type PersistedMockEntryMode = 'direct' | 'practice'

export interface PersistedPracticePlan {
  weaknessTag: string
  focusArea?: PersistedPracticeFocusArea
  zone: PersistedPracticeZone
  questionType: PersistedPracticeQuestionType
  questionCount: number
  difficulty: PersistedPracticeDifficulty
  reason: string
}

export interface PersistedMockSessionConfig {
  entryMode: PersistedMockEntryMode
  activeDocumentId?: string
  zone?: PersistedPracticeZone
  questionType?: PersistedPracticeQuestionType
  questionCount?: number
  difficulty?: PersistedPracticeDifficulty
}

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
  practicePlan?: PersistedPracticePlan | null
  mockEntryMode?: PersistedMockEntryMode
  mockSessionConfig?: PersistedMockSessionConfig | null
  updatedAt: string
}

export interface PersistedInterviewSession {
  id: string
  topic: PersistedTopicKey
  mode: PersistedInterviewMode
  source: string
  sessionConfigKey?: string
  sourceDocumentId?: string
  docType?: PersistedDocumentType
  questionCount: number
  answeredCount: number
  currentQuestionIndex: number
  submittedQuestionIds: string[]
  questionThreadsSnapshot?: Array<{
    id: string
    questionId?: string
    order: number
    sequence: number
    title: string
    prompt: string
    origin?: 'primary' | 'followup'
    createdAt?: string
  }>
  messagesSnapshot?: InterviewMessage[]
  activeQuestionThreadId?: string
  generatedThreadCount?: number
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
  sourceDocumentId?: string
  sourceDocumentName?: string
  weaknessTags: string[]
  weaknessFocusAreas?: PersistedPracticeFocusArea[]
  primaryWeakness?: string
  answeredCount: number
  totalCount: number
  summaryHeadline?: string
  summaryBody?: string
  answerSnapshot?: string[]
  suggestedFocus?: string[]
  practicePlan?: PersistedPracticePlan
  createdAt: string
}

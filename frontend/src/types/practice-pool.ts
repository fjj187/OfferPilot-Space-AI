import type { PersistedPracticePlan } from '@/types/workbench'
import type {
  PersistedPracticeDifficulty,
  PersistedPracticeFocusArea,
  PersistedPracticeQuestionType
} from '@/types/workbench'

export type PracticeGroupOrderMode = 'chapter' | 'random'

export interface PracticeGroupCompileOptions {
  count: number
  orderMode: PracticeGroupOrderMode
  shuffleSeed?: number
}

export interface PracticeQuestionItem {
  id: string
  sessionId: string
  order: number
  title: string
  prompt: string
  difficulty: PersistedPracticeDifficulty
  questionType: PersistedPracticeQuestionType
  generatedBy: 'llm' | 'mock'
  focusAreas?: PersistedPracticeFocusArea[]
  referenceAnswer?: string
  weaknessTag?: string
  sourceQuestionId?: string
}

export interface PracticeQuestionPool {
  sessionId: string
  reportId: string
  planSnapshot: PersistedPracticePlan
  /** 生成时冻结的报告签名；与当前报告不一致则题池视为过期 */
  reportSignature?: string
  questions: PracticeQuestionItem[]
  preparedAt: string
  status: 'idle' | 'preparing' | 'ready' | 'error'
  errorMessage?: string
}

export interface GeneratePracticePoolPayload {
  sessionId: string
  reportId?: string
  modelId?: string
  questionCount: number
  plan: PersistedPracticePlan
  questionReviews?: Array<{
    questionId?: string
    questionTitle: string
    userAnswer: string
    aiFeedback?: string
  }>
  sourceDocumentId?: string
  sourceDocumentName?: string
  sourceDocumentSummary?: string
  sourceDocumentTags?: string[]
  sourceDocumentExcerpt?: string
  reportSignature?: string
  summaryBody?: string
  weaknessTags?: string[]
}

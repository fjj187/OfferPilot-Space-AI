export type PracticePoolDifficulty = 'easy' | 'medium' | 'hard'
export type PracticePoolQuestionType = 'concept' | 'code' | 'scenario'
export type PracticePoolFocusArea = 'structure' | 'case_detail' | 'result_metric' | 'principle_depth'

export interface PracticePoolPlanInput {
  weaknessTag: string
  focusArea?: PracticePoolFocusArea
  zone: string
  questionType: PracticePoolQuestionType
  questionCount: number
  difficulty: PracticePoolDifficulty
  reason?: string
}

export interface PracticePoolQuestionReviewInput {
  questionId?: string
  questionTitle: string
  userAnswer: string
  aiFeedback?: string
}

export interface GeneratePracticePoolRequest {
  sessionId: string
  reportId?: string
  modelId?: string
  questionCount: number
  plan: PracticePoolPlanInput
  questionReviews?: PracticePoolQuestionReviewInput[]
  sourceDocumentId?: string
  sourceDocumentName?: string
  sourceDocumentSummary?: string
  sourceDocumentTags?: string[]
  sourceDocumentExcerpt?: string
  reportSignature?: string
  summaryBody?: string
  weaknessTags?: string[]
}

export interface PracticeQuestionItemDto {
  id: string
  sessionId: string
  order: number
  title: string
  prompt: string
  difficulty: PracticePoolDifficulty
  questionType: PracticePoolQuestionType
  generatedBy: 'llm' | 'mock'
  focusAreas?: PracticePoolFocusArea[]
  referenceAnswer?: string
  weaknessTag?: string
  sourceQuestionId?: string
}

export interface PracticeQuestionPoolDto {
  sessionId: string
  reportId: string
  planSnapshot: PracticePoolPlanInput
  reportSignature?: string
  questions: PracticeQuestionItemDto[]
  preparedAt: string
  status: 'idle' | 'preparing' | 'ready' | 'error'
  errorMessage?: string
}

export interface GeneratePracticePoolResponse {
  pool: PracticeQuestionPoolDto
  requestedCount: number
  actualCount: number
  isShortfall: boolean
}

export type ResourceQuestionDifficulty = 'easy' | 'medium' | 'hard'
export type ResourceQuestionType = 'concept' | 'code' | 'scenario'
export type ResourceAnalyzeStatus = 'idle' | 'analyzing' | 'ready' | 'error'
export type ResourceQuestionSequenceMode = 'by_chapter' | 'by_knowledge' | 'by_difficulty'

export interface ResourceChunkDto {
  id: string
  resourceId: string
  orderIndex: number
  content: string
  tokenCount: number
  chapterHint: string
}

export interface KnowledgePointDto {
  id: string
  resourceId: string
  name: string
  description: string
  chapterTitle: string
  difficultyLevel: ResourceQuestionDifficulty
  orderIndex: number
}

export interface QuestionSeedDto {
  id: string
  resourceId: string
  knowledgePointId: string
  chapterTitle: string
  difficulty: ResourceQuestionDifficulty
  questionType: ResourceQuestionType
  promptHint: string
  sourceChunkIds: string[]
  sequenceOrder: number
  status: 'ready'
  createdAt: string
}

export interface GeneratedResourceQuestionDto {
  questionId: string
  resourceId: string
  seedId: string
  title: string
  question: string
  answerOutline: string[]
  knowledgePoint: string
  difficulty: ResourceQuestionDifficulty
  questionType: ResourceQuestionType
  sourceRefs: string[]
  nextCursor?: string
  hasNext?: boolean
  createdAt: string
}

export interface ResourceQuestionRecord {
  resourceId: string
  title: string
  rawText: string
  summary: string
  documentVersion?: string
  analyzeStatus: ResourceAnalyzeStatus
  chunks: ResourceChunkDto[]
  knowledgePoints: KnowledgePointDto[]
  questionSeeds: QuestionSeedDto[]
  generatedQuestions: GeneratedResourceQuestionDto[]
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface AnalyzeResourceQuestionRequest {
  resourceId: string
  title?: string
  rawText?: string
  documentVersion?: string
  modelId?: string
}

export interface GenerateRandomResourceQuestionRequest {
  resourceId: string
  excludeSeedIds?: string[]
  difficulty?: ResourceQuestionDifficulty
  questionType?: ResourceQuestionType
  modelId?: string
  fastMode?: boolean
}

export interface GenerateNextResourceQuestionRequest {
  resourceId: string
  sequenceMode?: ResourceQuestionSequenceMode
  cursor?: string
  modelId?: string
  fastMode?: boolean
}

export interface ResourceQuestionMetaDto {
  resourceId: string
  seedCount: number
  analyzeStatus: ResourceAnalyzeStatus
  sequenceModes: ResourceQuestionSequenceMode[]
  summary?: string
  errorMessage?: string
  documentVersion?: string
}

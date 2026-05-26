import type {
  PersistedPracticeDifficulty,
  PersistedPracticeFocusArea,
  PersistedPracticeQuestionType
} from '@/types/workbench'

export type MaterialGroupOrderMode = 'chapter' | 'random' | 'difficulty_ladder' | 'single_difficulty'

export interface MaterialChunk {
  id: string
  documentId: string
  order: number
  heading: string
  level: number
  text: string
  charStart?: number
  charEnd?: number
}

export interface MaterialQuestionItem {
  id: string
  documentId: string
  chunkId: string
  order: number
  title: string
  prompt: string
  difficulty: PersistedPracticeDifficulty
  questionType: PersistedPracticeQuestionType
  generatedBy: 'rule' | 'llm'
  focusAreas?: PersistedPracticeFocusArea[]
  referenceAnswer?: string
  sourceHeading?: string
}

export interface MaterialQuestionPool {
  documentId: string
  documentVersion: string
  chunks: MaterialChunk[]
  questions: MaterialQuestionItem[]
  preparedAt: string
  status: 'idle' | 'preparing' | 'ready' | 'error'
  errorMessage?: string
}

export interface MaterialGroupCompileOptions {
  count: number
  difficultyFilter?: PersistedPracticeDifficulty[]
  orderMode: MaterialGroupOrderMode
  singleDifficulty?: PersistedPracticeDifficulty
  /** 随机组卷时变更以触发重新洗牌 */
  shuffleSeed?: number
}

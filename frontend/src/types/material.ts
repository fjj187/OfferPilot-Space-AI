import type {
  PersistedPracticeDifficulty,
  PersistedPracticeFocusArea,
  PersistedPracticeQuestionType,
  PersistedTopicKey
} from '@/types/workbench'

export type MaterialGroupOrderMode = 'chapter' | 'random' | 'difficulty_ladder' | 'single_difficulty'
export type ResourceQuestionSequenceMode = 'by_chapter' | 'by_knowledge' | 'by_difficulty'

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
  seedId?: string
  order: number
  title: string
  prompt: string
  difficulty: PersistedPracticeDifficulty
  questionType: PersistedPracticeQuestionType
  generatedBy: 'rule' | 'llm'
  focusAreas?: PersistedPracticeFocusArea[]
  referenceAnswer?: string
  sourceHeading?: string
  sourceRefs?: string[]
  /** 从标题/章节推断的主题，供混合资料组卷筛选 */
  topicKeys?: PersistedTopicKey[]
}

export interface MaterialResourceQuestion {
  summary: string
  seedCount: number
  knowledgePoints: Array<{
    id: string
    name: string
    description: string
    chapterTitle: string
    difficultyLevel: PersistedPracticeDifficulty
  }>
}

export interface MaterialQuestionPool {
  documentId: string
  documentVersion: string
  chunks: MaterialChunk[]
  questions: MaterialQuestionItem[]
  resourceQuestionMeta?: MaterialResourceQuestion
  preparedAt: string
  status: 'idle' | 'preparing' | 'ready' | 'error'
  errorMessage?: string
}

export interface MaterialGroupCompileOptions {
  count: number
  difficultyFilter?: PersistedPracticeDifficulty[]
  /** 题目级主题筛选；空或未设表示不过滤 */
  topicFilter?: PersistedTopicKey[]
  orderMode: MaterialGroupOrderMode
  singleDifficulty?: PersistedPracticeDifficulty
  /** 随机组卷时变更以触发重新洗牌 */
  shuffleSeed?: number
}

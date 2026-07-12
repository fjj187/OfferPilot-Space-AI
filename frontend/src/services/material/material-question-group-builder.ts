import type {
  MaterialGroupCompileOptions,
  MaterialQuestionItem,
  MaterialQuestionPool
} from '@/types/material'
import { matchesMaterialTopicFilter } from '@/services/material/material-question-topics'
import type {
  PersistedPracticeDifficulty,
  PersistedPracticeQuestionGroup,
  PersistedPracticeQuestionGroupItem
} from '@/types/workbench'

export interface MaterialQuestionGroupBuildResult {
  group: PersistedPracticeQuestionGroup
  requestedCount: number
  actualCount: number
  isShortfall: boolean
}

const difficultyRank: Record<PersistedPracticeDifficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2
}

const resolveChunkOrder = (pool: MaterialQuestionPool, question: MaterialQuestionItem) => {
  return pool.chunks.find(chunk => chunk.id === question.chunkId)?.order ?? question.order
}

const resolveChunkHeading = (pool: MaterialQuestionPool, question: MaterialQuestionItem) => {
  return question.sourceHeading || pool.chunks.find(chunk => chunk.id === question.chunkId)?.heading || '资料章节'
}

/** 用 shuffleSeed（洗牌种子）做可复现的 Fisher-Yates 洗牌，避免 computed（计算属性）里 Math.random 导致预览不刷新 */
const shuffleQuestionsWithSeed = (questions: MaterialQuestionItem[], seed: number) => {
  const copy = [...questions]
  let state = (seed || 1) >>> 0

  const nextUnit = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextUnit() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swapIndex]
    copy[swapIndex] = current
  }
  return copy
}

const sortQuestions = (
  questions: MaterialQuestionItem[],
  pool: MaterialQuestionPool,
  options: MaterialGroupCompileOptions
) => {
  const sorted = [...questions]

  if (options.orderMode === 'difficulty_ladder') {
    return sorted.sort((prev, next) => {
      const difficultyGap = difficultyRank[prev.difficulty] - difficultyRank[next.difficulty]
      if (difficultyGap !== 0) return difficultyGap
      return resolveChunkOrder(pool, prev) - resolveChunkOrder(pool, next)
        || prev.order - next.order
        || prev.id.localeCompare(next.id)
    })
  }

  if (options.orderMode === 'single_difficulty' && options.singleDifficulty) {
    return sorted
      .filter(item => item.difficulty === options.singleDifficulty)
      .sort((prev, next) => (
        resolveChunkOrder(pool, prev) - resolveChunkOrder(pool, next)
        || prev.order - next.order
        || prev.id.localeCompare(next.id)
      ))
  }

  return sorted.sort((prev, next) => (
    resolveChunkOrder(pool, prev) - resolveChunkOrder(pool, next)
    || prev.order - next.order
    || prev.id.localeCompare(next.id)
  ))
}

const toGroupItem = (
  pool: MaterialQuestionPool,
  question: MaterialQuestionItem,
  order: number
): PersistedPracticeQuestionGroupItem => ({
  questionId: question.id,
  order,
  title: question.title,
  prompt: question.prompt,
  difficulty: question.difficulty,
  questionType: question.questionType,
  focusArea: question.focusAreas?.[0],
  matchReason: `来自资料 · ${ resolveChunkHeading(pool, question) }`,
  sourceChunkId: question.chunkId,
  sourceDocumentId: question.documentId,
  referenceAnswer: question.referenceAnswer
})

export function buildMaterialQuestionGroup(
  pool: MaterialQuestionPool,
  options: MaterialGroupCompileOptions,
  documentName: string
): MaterialQuestionGroupBuildResult {
  const filtered = pool.questions.filter((question) => {
    if (!matchesMaterialTopicFilter(question, options.topicFilter)) return false
    if (!options.difficultyFilter?.length) return true
    return options.difficultyFilter.includes(question.difficulty)
  })
  const ranked = sortQuestions(filtered, pool, options)
  const ordered = options.orderMode === 'random'
    ? shuffleQuestionsWithSeed(ranked, options.shuffleSeed ?? 1)
    : ranked
  const selected: MaterialQuestionItem[] = []
  const usedIds = new Set<string>()

  for (const question of ordered) {
    if (selected.length >= options.count) break
    if (usedIds.has(question.id)) continue
    usedIds.add(question.id)
    selected.push(question)
  }

  const now = new Date().toISOString()
  const items = selected.map((question, index) => toGroupItem(pool, question, index))
  const group: PersistedPracticeQuestionGroup = {
    id: `material-group-${ Date.now() }`,
    source: 'material_document',
    documentSnapshot: {
      documentId: pool.documentId,
      name: documentName
    },
    compileOptions: {
      ...options
    },
    items,
    currentIndex: 0,
    status: items.length ? 'pending' : 'completed',
    createdAt: now,
    updatedAt: now
  }

  return {
    group,
    requestedCount: options.count,
    actualCount: items.length,
    isShortfall: items.length < options.count
  }
}

export const defaultMaterialGroupCompileOptions = (): MaterialGroupCompileOptions => ({
  count: 5,
  orderMode: 'chapter'
})

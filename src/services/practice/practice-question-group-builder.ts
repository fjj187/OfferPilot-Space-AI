import type {
  PracticeGroupCompileOptions,
  PracticeQuestionItem,
  PracticeQuestionPool
} from '@/types/practice-pool'
import { shufflePracticeQuestionsWithSeed } from '@/services/practice/practice-shuffle'
import type {
  PersistedPracticeFocusArea,
  PersistedPracticePlan,
  PersistedPracticeQuestionGroup,
  PersistedPracticeQuestionGroupItem,
  PersistedPracticeZone,
  PersistedReportSummary,
  PersistedTopicKey
} from '@/types/workbench'

export interface BuildPracticeQuestionGroupOptions {
  reportSummary?: PersistedReportSummary | null
  sourceSessionId?: string
  pool?: PracticeQuestionPool | null
  compileOptions?: PracticeGroupCompileOptions
}

export interface PracticeQuestionGroupBuildResult {
  group: PersistedPracticeQuestionGroup
  requestedCount: number
  actualCount: number
  isShortfall: boolean
}

const topicByPracticeZone: Record<PersistedPracticeZone, PersistedTopicKey> = {
  vue: 'vue3',
  javascript: 'browser',
  typescript: 'typescript',
  engineering: 'engineering',
  performance: 'performance'
}

export const defaultPracticeGroupCompileOptions = (): PracticeGroupCompileOptions => ({
  count: 5,
  orderMode: 'random',
  shuffleSeed: Date.now()
})

const toGroupItemFromPool = (question: PracticeQuestionItem, order: number): PersistedPracticeQuestionGroupItem => ({
  questionId: question.id,
  order,
  title: question.title,
  prompt: question.prompt,
  difficulty: question.difficulty,
  questionType: question.questionType,
  focusArea: question.focusAreas?.[0],
  matchReason: question.generatedBy === 'llm' ? '报告题池' : '报告题池（复盘规则）',
  referenceAnswer: question.referenceAnswer
})

const sortPoolQuestions = (questions: PracticeQuestionItem[]) => (
  [...questions].sort((prev, next) => prev.order - next.order || prev.id.localeCompare(next.id))
)

const buildEmptyGroup = (
  plan: PersistedPracticePlan,
  options: BuildPracticeQuestionGroupOptions,
  requestedCount: number
): PracticeQuestionGroupBuildResult => {
  const now = new Date().toISOString()
  return {
    group: {
      id: `practice-group-${ Date.now() }`,
      source: 'practice_report_pool',
      sourceSessionId: options.sourceSessionId || options.reportSummary?.sessionId,
      planSnapshot: { ...plan },
      practiceCompileOptions: options.compileOptions
        ? { ...options.compileOptions }
        : defaultPracticeGroupCompileOptions(),
      items: [],
      currentIndex: 0,
      status: 'completed',
      createdAt: now,
      updatedAt: now
    },
    requestedCount,
    actualCount: 0,
    isShortfall: true
  }
}

const buildFromReportPool = (
  plan: PersistedPracticePlan,
  pool: PracticeQuestionPool,
  options: BuildPracticeQuestionGroupOptions
): PracticeQuestionGroupBuildResult => {
  const compileOptions = options.compileOptions || defaultPracticeGroupCompileOptions()
  const ranked = sortPoolQuestions(pool.questions)
  // 报告题池由 LLM 按弱项生成，无章节顺序；组卷时固定洗牌
  const ordered = shufflePracticeQuestionsWithSeed(
    ranked,
    compileOptions.shuffleSeed ?? Date.now()
  )

  const selected: PracticeQuestionItem[] = []
  const usedIds = new Set<string>()

  for (const question of ordered) {
    if (selected.length >= compileOptions.count) break
    if (usedIds.has(question.id)) continue
    usedIds.add(question.id)
    selected.push(question)
  }

  const now = new Date().toISOString()
  const items = selected.map((question, index) => toGroupItemFromPool(question, index))
  const group: PersistedPracticeQuestionGroup = {
    id: `practice-group-${ Date.now() }`,
    source: 'practice_report_pool',
    sourceSessionId: options.sourceSessionId || pool.sessionId,
    planSnapshot: { ...plan },
    practiceCompileOptions: { ...compileOptions },
    items,
    currentIndex: 0,
    status: items.length ? 'pending' : 'completed',
    createdAt: now,
    updatedAt: now
  }

  return {
    group,
    requestedCount: compileOptions.count,
    actualCount: items.length,
    isShortfall: items.length < compileOptions.count
  }
}

/** 专项补练仅允许从报告题池组卷；无题池时返回空组 */
export function buildPracticeQuestionGroup(
  plan: PersistedPracticePlan,
  options: BuildPracticeQuestionGroupOptions = {}
): PracticeQuestionGroupBuildResult {
  const pool = options.pool
  const requestedCount = options.compileOptions?.count || plan.questionCount

  if (pool?.status === 'ready' && pool.questions.length > 0) {
    return buildFromReportPool(plan, pool, options)
  }

  return buildEmptyGroup(plan, options, requestedCount)
}

export const practiceFocusAreaLabelMap: Record<PersistedPracticeFocusArea, string> = {
  structure: '结构表达',
  case_detail: '案例细节',
  result_metric: '结果指标',
  principle_depth: '原理追问'
}

export const practiceQuestionMatchReasonLabelMap: Record<string, string> = {
  focus_area: '弱项维度命中',
  weakness_tag: '弱项标签命中',
  type_zone: '题型专区命中',
  fallback: '规则兜底',
  '报告题池': '报告题池',
  '报告题池（复盘规则）': '报告题池（复盘规则）'
}

export function resolveTopicKeyForPracticeZone(zone: PersistedPracticeZone): PersistedTopicKey {
  return topicByPracticeZone[zone] || 'vue3'
}

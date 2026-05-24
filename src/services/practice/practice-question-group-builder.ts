import type { InterviewQuestion, InterviewTopicKey } from '@/views/workbench/mock-interview.data'
import { questionBank } from '@/views/workbench/mock-interview.data'
import type {
  PersistedPracticeFocusArea,
  PersistedPracticePlan,
  PersistedPracticeQuestionGroup,
  PersistedPracticeQuestionGroupItem,
  PersistedPracticeQuestionMatchReason,
  PersistedPracticeQuestionType,
  PersistedPracticeZone,
  PersistedReportSummary,
  PersistedTopicKey
} from '@/types/workbench'

export interface BuildPracticeQuestionGroupOptions {
  reportSummary?: PersistedReportSummary | null
  sourceSessionId?: string
}

export interface PracticeQuestionGroupBuildResult {
  group: PersistedPracticeQuestionGroup
  requestedCount: number
  actualCount: number
  isShortfall: boolean
}

const practiceZoneByTopic: Record<InterviewTopicKey, PersistedPracticeZone> = {
  vue3: 'vue',
  typescript: 'typescript',
  engineering: 'engineering',
  browser: 'javascript',
  performance: 'performance',
  scenario: 'javascript'
}

const topicByPracticeZone: Record<PersistedPracticeZone, InterviewTopicKey> = {
  vue: 'vue3',
  javascript: 'browser',
  typescript: 'typescript',
  engineering: 'engineering',
  performance: 'performance'
}

const difficultyRank: Record<InterviewQuestion['difficulty'], number> = {
  easy: 0,
  medium: 1,
  hard: 2
}

const resolveQuestionTypeByHeuristic = (question: InterviewQuestion): PersistedPracticeQuestionType => {
  if (question.questionType) return question.questionType
  const subject = `${ question.stageLabel } ${ question.title } ${ question.prompt } ${ question.tags.join(' ') }`
  if (/场景|项目|追问|表达|沟通/.test(subject)) return 'scenario'
  if (/源码|代码|实现|类型|泛型|响应式|性能|缓存/.test(subject)) return 'code'
  return 'concept'
}

const matchesPracticeQuestionType = (question: InterviewQuestion, type: PersistedPracticeQuestionType) => {
  const resolvedType = resolveQuestionTypeByHeuristic(question)
  return resolvedType === type
}

const matchesWeaknessTag = (question: InterviewQuestion, weaknessTag: string) => {
  const normalizedTag = weaknessTag.trim().toLowerCase()
  if (!normalizedTag) return false

  const keywordPool = [
    question.weaknessSignal,
    question.title,
    question.prompt,
    ...(question.weaknessKeywords || []),
    ...question.tags
  ].join(' ').toLowerCase()

  if (keywordPool.includes(normalizedTag)) return true

  return normalizedTag.split(/[\s/、,，]+/).filter(Boolean).some(token => keywordPool.includes(token))
}

const resolveFocusArea = (
  question: InterviewQuestion,
  plan: PersistedPracticePlan
): PersistedPracticeFocusArea | undefined => {
  if (plan.focusArea && question.focusAreas?.includes(plan.focusArea)) {
    return plan.focusArea
  }
  return question.focusAreas?.[0]
}

interface ScoredQuestion {
  question: InterviewQuestion
  score: number
  matchReason: PersistedPracticeQuestionMatchReason
  focusArea?: PersistedPracticeFocusArea
}

const scoreQuestion = (
  question: InterviewQuestion,
  plan: PersistedPracticePlan,
  topicKey: InterviewTopicKey
): ScoredQuestion => {
  let score = 0
  let matchReason: PersistedPracticeQuestionMatchReason = 'fallback'

  if (question.topic === topicKey) {
    score += 40
    matchReason = 'type_zone'
  }

  if (plan.focusArea && question.focusAreas?.includes(plan.focusArea)) {
    score += 120
    matchReason = 'focus_area'
  }

  if (matchesPracticeQuestionType(question, plan.questionType)) {
    score += 60
    if (matchReason === 'type_zone') matchReason = 'type_zone'
  }

  if (question.difficulty === plan.difficulty) {
    score += 30
  } else {
    score -= Math.abs(difficultyRank[question.difficulty] - difficultyRank[plan.difficulty]) * 8
  }

  if (matchesWeaknessTag(question, plan.weaknessTag)) {
    score += 90
    if (matchReason !== 'focus_area') matchReason = 'weakness_tag'
  }

  if (question.practiceZones?.includes(plan.zone)) {
    score += 20
  } else if (practiceZoneByTopic[question.topic] === plan.zone) {
    score += 10
  }

  return {
    question,
    score,
    matchReason,
    focusArea: resolveFocusArea(question, plan)
  }
}

const toGroupItem = (entry: ScoredQuestion, order: number): PersistedPracticeQuestionGroupItem => ({
  questionId: entry.question.id,
  order,
  title: entry.question.title,
  prompt: entry.question.prompt,
  focusArea: entry.focusArea,
  matchReason: entry.matchReason
})

export function buildPracticeQuestionGroup(
  plan: PersistedPracticePlan,
  options: BuildPracticeQuestionGroupOptions = {}
): PracticeQuestionGroupBuildResult {
  const topicKey = topicByPracticeZone[plan.zone] || 'vue3'
  const topicMatched = questionBank.filter(item => item.topic === topicKey)
  const candidatePool = topicMatched.length ? topicMatched : questionBank

  const ranked = candidatePool
    .map(question => scoreQuestion(question, plan, topicKey))
    .sort((prev, next) => {
      if (next.score !== prev.score) return next.score - prev.score
      if (prev.question.difficulty !== next.question.difficulty) {
        return difficultyRank[prev.question.difficulty] - difficultyRank[next.question.difficulty]
      }
      return prev.question.id.localeCompare(next.question.id)
    })

  const selected: ScoredQuestion[] = []
  const usedIds = new Set<string>()

  for (const entry of ranked) {
    if (selected.length >= plan.questionCount) break
    if (usedIds.has(entry.question.id)) continue
    usedIds.add(entry.question.id)
    selected.push(entry)
  }

  const now = new Date().toISOString()
  const items = selected.map((entry, index) => toGroupItem(entry, index))
  const group: PersistedPracticeQuestionGroup = {
    id: `practice-group-${ Date.now() }`,
    sourceSessionId: options.sourceSessionId || options.reportSummary?.sessionId,
    planSnapshot: { ...plan },
    items,
    currentIndex: 0,
    status: items.length ? 'pending' : 'completed',
    createdAt: now,
    updatedAt: now
  }

  return {
    group,
    requestedCount: plan.questionCount,
    actualCount: items.length,
    isShortfall: items.length < plan.questionCount
  }
}

export const practiceQuestionMatchReasonLabelMap: Record<PersistedPracticeQuestionMatchReason, string> = {
  focus_area: '弱项维度命中',
  weakness_tag: '弱项标签命中',
  type_zone: '题型专区命中',
  fallback: '规则兜底'
}

export const practiceFocusAreaLabelMap: Record<PersistedPracticeFocusArea, string> = {
  structure: '结构表达',
  case_detail: '案例细节',
  result_metric: '结果指标',
  principle_depth: '原理追问'
}

export function resolveTopicKeyForPracticeZone(zone: PersistedPracticeZone): PersistedTopicKey {
  return topicByPracticeZone[zone] || 'vue3'
}

import { describe, expect, it } from 'vitest'
import {
  buildPracticeQuestionGroup,
  defaultPracticeGroupCompileOptions
} from '@/services/practice/practice-question-group-builder'
import { shufflePracticeQuestionsWithSeed } from '@/services/practice/practice-shuffle'
import type { PracticeQuestionPool } from '@/types/practice-pool'
import type { PersistedPracticePlan } from '@/types/workbench'

const basePlan: PersistedPracticePlan = {
  weaknessTag: '结构化表达',
  focusArea: 'structure',
  zone: 'vue',
  questionType: 'scenario',
  questionCount: 5,
  difficulty: 'medium',
  reason: '复盘建议补练'
}

const createPool = (questionsCount = 6): PracticeQuestionPool => ({
  sessionId: 'session-test-1',
  reportId: 'report-test-1',
  planSnapshot: basePlan,
  preparedAt: '2026-05-25T00:00:00.000Z',
  status: 'ready',
  questions: Array.from({ length: questionsCount }, (_, index) => ({
    id: `practice-pool-session-test-1-${ index + 1 }`,
    sessionId: 'session-test-1',
    order: index,
    title: `补练题 ${ index + 1 }`,
    prompt: `请说明弱项 ${ index + 1 } 的改进方式`,
    difficulty: 'medium',
    questionType: 'scenario',
    generatedBy: 'mock'
  }))
})

describe('practice question pipeline', () => {
  it('报告题池组卷支持 count 与 shuffleSeed', () => {
    const pool = createPool(8)
    const chapterResult = buildPracticeQuestionGroup(basePlan, {
      pool,
      compileOptions: { count: 5, orderMode: 'chapter' }
    })
    expect(chapterResult.actualCount).toBe(5)
    expect(chapterResult.group.source).toBe('practice_report_pool')
    expect(chapterResult.group.items[0]?.title).toBe('补练题 1')

    const ordered = shufflePracticeQuestionsWithSeed(pool.questions, 42)
    const shuffledResult = buildPracticeQuestionGroup(basePlan, {
      pool: { ...pool, questions: ordered },
      compileOptions: { count: 5, orderMode: 'random', shuffleSeed: 42 }
    })
    expect(shuffledResult.actualCount).toBe(5)

    const again = buildPracticeQuestionGroup(basePlan, {
      pool: { ...pool, questions: shufflePracticeQuestionsWithSeed(pool.questions, 42) },
      compileOptions: { count: 5, orderMode: 'random', shuffleSeed: 42 }
    })
    expect(again.group.items.map(item => item.questionId)).toEqual(
      shuffledResult.group.items.map(item => item.questionId)
    )
  })

  it('无题池时返回空组且标记 shortfall', () => {
    const result = buildPracticeQuestionGroup(basePlan, {
      compileOptions: defaultPracticeGroupCompileOptions()
    })
    expect(result.actualCount).toBe(0)
    expect(result.isShortfall).toBe(true)
    expect(result.group.items).toEqual([])
  })
})

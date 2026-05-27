import { describe, expect, it } from 'vitest'
import { enrichReportQuestionReview, resolveReportReferenceAnswer } from '@/utils/report/resolve-report-reference-answer'
import type { PersistedPracticeQuestionGroupItem } from '@/types/workbench'

describe('resolveReportReferenceAnswer', () => {
  it('returns group item reference with newlines preserved', () => {
    const item: PersistedPracticeQuestionGroupItem = {
      questionId: 'q1',
      order: 0,
      title: '测试题',
      prompt: '题干',
      matchReason: 'test',
      referenceAnswer: '- 要点一\n- 要点二'
    }
    expect(resolveReportReferenceAnswer(item)).toContain('要点一')
    expect(resolveReportReferenceAnswer(item)).toContain('\n')
  })

  it('enriches saved review from pool when reference missing', () => {
    const enriched = enrichReportQuestionReview({
      questionId: 'missing',
      questionTitle: '不存在的题',
      userAnswer: '未作答'
    }, 'doc-x')
    expect(enriched.referenceAnswer).toBeUndefined()
  })
})

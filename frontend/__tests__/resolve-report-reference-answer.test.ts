import { describe, expect, it } from 'vitest'
import type { InterviewMessage } from '@/types/message'
import {
  enrichReportQuestionReview,
  resolveReportQuestionReferenceAnswer,
  resolveReportReferenceAnswer
} from '@/utils/report/resolve-report-reference-answer'
import type { PersistedPracticeQuestionGroupItem } from '@/types/workbench'

const message = (
  partial: Pick<InterviewMessage, 'id' | 'role' | 'threadId' | 'displayContent'>
): InterviewMessage => ({
  format: 'markdown',
  status: 'done',
  content: partial.displayContent,
  createdAt: '2026-05-19T00:00:00.000Z',
  ...partial
})

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

  it('prefers latest AI revealed correct answer over material reference', () => {
    const threadId = 'thread-a'
    const item: PersistedPracticeQuestionGroupItem = {
      questionId: 'q1',
      order: 0,
      title: 'position定位',
      prompt: '请讲解 position 定位',
      matchReason: 'test',
      referenceAnswer: '资料里的旧答案'
    }
    const messages: InterviewMessage[] = [
      message({
        id: 'u1',
        role: 'user',
        threadId,
        displayContent: '不知道'
      }),
      message({
        id: 'a1',
        role: 'assistant',
        threadId,
        displayContent: '#### 正确答案\nposition 包含 static、relative、absolute、fixed、sticky。\n\n#### 简要说明\n先掌握定位上下文。'
      })
    ]

    expect(resolveReportQuestionReferenceAnswer(item, messages, threadId)).toContain('position 包含')
    expect(resolveReportQuestionReferenceAnswer(item, messages, threadId)).not.toContain('资料里的旧答案')
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

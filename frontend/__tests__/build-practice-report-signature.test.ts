import { describe, expect, it } from 'vitest'
import { buildPracticeReportSignature } from '@/utils/practice/build-practice-report-signature'
import type { PersistedReportSummary } from '@/types/workbench'

const baseReport = (): PersistedReportSummary => ({
  id: 'report-session-1',
  sessionId: 'session-1',
  topic: 'vue3',
  source: 'mock-interview-space',
  weaknessTags: ['结构化表达'],
  primaryWeakness: '结构化表达',
  answeredCount: 2,
  totalCount: 3,
  practicePlan: {
    weaknessTag: '结构化表达',
    focusArea: 'structure',
    zone: 'vue',
    questionType: 'scenario',
    questionCount: 5,
    difficulty: 'medium',
    reason: '复盘建议'
  },
  questionReviews: [{
    questionId: 'q-1',
    questionTitle: '题一',
    userAnswer: '回答一'
  }],
  createdAt: '2026-05-26T00:00:00.000Z'
})

describe('buildPracticeReportSignature', () => {
  it('弱项或复盘变化时签名不同', () => {
    const first = buildPracticeReportSignature(baseReport())
    const second = buildPracticeReportSignature({
      ...baseReport(),
      weaknessTags: ['追问应对']
    })
    expect(first).not.toBe(second)
  })

  it('相同报告签名稳定', () => {
    const report = baseReport()
    expect(buildPracticeReportSignature(report)).toBe(buildPracticeReportSignature(report))
  })
})

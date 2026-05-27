import { describe, expect, it } from 'vitest'
import { cleanReportQuestionTitle } from '@/utils/report/clean-report-question-title'

describe('cleanReportQuestionTitle', () => {
  it('removes duplicate question index prefix', () => {
    const title = '第 2 题 · 第 2 / 5 题 · DOCTYPE 的作用是什么？'
    expect(cleanReportQuestionTitle(title)).toBe('DOCTYPE 的作用是什么？')
  })
})

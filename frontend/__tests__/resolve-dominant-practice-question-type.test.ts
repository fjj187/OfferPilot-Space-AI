import { describe, expect, it } from 'vitest'
import { resolveDominantPracticeQuestionType } from '@/utils/practice/resolve-dominant-practice-question-type'

describe('resolveDominantPracticeQuestionType', () => {
  it('按出现次数取众数', () => {
    expect(resolveDominantPracticeQuestionType([
      'concept',
      'code',
      'code',
      'scenario'
    ])).toBe('code')
  })

  it('无题型时回退', () => {
    expect(resolveDominantPracticeQuestionType([], 'scenario')).toBe('scenario')
  })
})

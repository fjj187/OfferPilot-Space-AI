import { describe, expect, it } from 'vitest'
import {
  buildFeedbackStyleRules,
  buildInterviewSystemPrompt
} from '../backend/src/utils/build-interview-llm-messages.js'
import type { InterviewStreamRequest } from '../backend/src/types/interview.js'

const baseRequest = (): InterviewStreamRequest => ({
  sessionId: 's1',
  messageId: 'm1',
  threadId: 't1',
  topic: 'vue',
  topicLabel: 'Vue 3',
  prompt: 'p',
  questionTitle: '语义化标签有哪些？',
  questionPrompt: '请说明语义化标签及原因',
  answer: '怎么回答？',
  feedbackStyle: 'corrective',
  format: 'markdown',
  questionIndex: 1,
  questionCount: 5
})

describe('buildInterviewSystemPrompt', () => {
  it('includes navigation rules and current question index', () => {
    const prompt = buildInterviewSystemPrompt(baseRequest())

    expect(prompt).toContain('第 1 / 5 题')
    expect(prompt).toContain('下一题')
    expect(prompt).toContain('禁止输出下一题')
  })

  it('corrective style requires misalignment before guidance', () => {
    const prompt = buildInterviewSystemPrompt({ ...baseRequest(), feedbackStyle: 'corrective' })

    expect(prompt).toContain('纠偏型')
    expect(prompt).toContain('❌ 偏差点')
    expect(prompt).toContain('禁止')
    expect(prompt).toContain('完整答题提纲')
  })

  it('guided style allows structure hints', () => {
    const rules = buildFeedbackStyleRules('guided')

    expect(rules.join('\n')).toContain('引导反馈')
    expect(rules.join('\n')).toContain('作答结构')
  })

  it('followup style prioritizes questions over teaching', () => {
    const rules = buildFeedbackStyleRules('followup')

    expect(rules.join('\n')).toContain('继续追问')
    expect(rules.join('\n')).toContain('少给标准答案')
  })

  it('styles are mutually exclusive in prompt text', () => {
    const corrective = buildInterviewSystemPrompt({ ...baseRequest(), feedbackStyle: 'corrective' })
    const guided = buildInterviewSystemPrompt({ ...baseRequest(), feedbackStyle: 'guided' })

    expect(corrective).toContain('纠偏型')
    expect(guided).toContain('引导型')
    expect(corrective).not.toContain('【引导型 · 必须遵守】')
    expect(guided).not.toContain('【纠偏型 · 必须遵守】')
  })
})

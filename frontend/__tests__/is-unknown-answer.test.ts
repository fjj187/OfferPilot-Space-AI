import { describe, expect, it } from 'vitest'
import { isReferenceAnswerRequest, isUnknownAnswer } from '@/utils/interview/is-unknown-answer'

describe('isReferenceAnswerRequest', () => {
  it('识别主动索要参考答案的口语', () => {
    const shouldMatch = [
      '给出答案',
      '给我参考答案',
      '直接告诉我答案吧',
      '直接说答案',
      '说答案',
      '给答案',
      '告诉我答案',
      '答案',
      '来个答案',
      '把答案给我',
      '可以说一下答案吗',
      '请直接给参考答案',
      '标准答案是什么'
    ]

    shouldMatch.forEach((text) => {
      expect(isReferenceAnswerRequest(text), text).toBe(true)
    })
  })

  it('不把正常作答误判为索要答案', () => {
    expect(isReferenceAnswerRequest('作用域插槽通过 slot props 把数据传给父组件')).toBe(false)
    expect(isReferenceAnswerRequest('我的答案是作用域插槽把数据传给父组件')).toBe(false)
    expect(isReferenceAnswerRequest('我认为这道题的答案应该包含 slot props')).toBe(false)
    expect(isUnknownAnswer('不知道')).toBe(true)
  })
})

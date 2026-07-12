import { describe, expect, it } from 'vitest'
import type { InterviewMessage } from '@/types/message'
import {
  extractReferenceAnswerFromAssistantContent,
  stripReferenceAnswerSection
} from '@/utils/report/extract-interview-reference-answer'
import {
  extractReferenceAnswerFromThreadMessages,
  formatReportThreadLatestAiFeedback,
  formatReportThreadUserAnswer,
  isReportQuestionUnanswered
} from '@/utils/report/format-report-thread-dialogue'

const message = (
  partial: Pick<InterviewMessage, 'id' | 'role' | 'threadId' | 'displayContent'>
): InterviewMessage => ({
  format: 'plain',
  status: 'done',
  content: partial.displayContent,
  createdAt: '2026-05-19T00:00:00.000Z',
  ...partial
})

describe('format-report-thread-dialogue', () => {
  const threadId = 'thread-a'
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
      displayContent: '#### 引导反馈\n先想块级元素'
    }),
    message({
      id: 'u2',
      role: 'user',
      threadId,
      displayContent: '还是不知道'
    }),
    message({
      id: 'a2',
      role: 'assistant',
      threadId,
      displayContent: '#### 参考答案\n块级独占一行\n\n#### 简要说明\n你已连续两次不知道'
    })
  ]

  it('formats all user rounds', () => {
    const text = formatReportThreadUserAnswer(messages, threadId)
    expect(text).toContain('第 1 轮回答')
    expect(text).toContain('不知道')
    expect(text).toContain('第 2 轮回答')
    expect(text).toContain('还是不知道')
  })

  it('keeps only latest ai feedback without reference section', () => {
    const text = formatReportThreadLatestAiFeedback(messages, threadId)
    expect(text).not.toContain('第 1 轮反馈')
    expect(text).not.toContain('块级独占一行')
    expect(text).toContain('简要说明')
  })

  it('extracts reference answer from thread messages', () => {
    expect(extractReferenceAnswerFromThreadMessages(messages, threadId)).toBe('块级独占一行')
  })

  it('detects unanswered', () => {
    expect(isReportQuestionUnanswered('')).toBe(true)
    expect(isReportQuestionUnanswered('未作答')).toBe(true)
    expect(isReportQuestionUnanswered('第 1 轮回答：\n有内容')).toBe(false)
  })
})

describe('extract-interview-reference-answer', () => {
  it('extracts and strips reference section', () => {
    const content = '#### 参考答案\n- 要点\n\n#### 简要说明\n说明文字'
    expect(extractReferenceAnswerFromAssistantContent(content)).toBe('- 要点')
    expect(stripReferenceAnswerSection(content)).toContain('简要说明')
    expect(stripReferenceAnswerSection(content)).not.toContain('要点')
  })

  it('extracts non-heading correct answer labels', () => {
    const content = '正确答案：\n语义化标签是有含义的 HTML 标签，例如 header、main、article。\n\n简要说明：以上是完整的参考答案。'
    expect(extractReferenceAnswerFromAssistantContent(content)).toContain('语义化标签')
    expect(stripReferenceAnswerSection(content)).toContain('简要说明')
    expect(stripReferenceAnswerSection(content)).not.toContain('语义化标签')
  })
})

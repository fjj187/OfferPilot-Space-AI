import type { InterviewMessage } from '@/types/message'
import {
  extractReferenceAnswerFromAssistantContent,
  stripReferenceAnswerSection
} from '@/utils/report/extract-interview-reference-answer'

const toMessageText = (message: InterviewMessage) => (message.displayContent || message.content || '').trim()

/** 按时间顺序收集本题 thread 下全部用户作答 */
export const collectThreadUserAnswers = (messages: InterviewMessage[], threadId: string) => (
  messages
    .filter(item => item.threadId === threadId && item.role === 'user')
    .map(toMessageText)
    .filter(Boolean)
)

/** 按时间顺序收集本题 thread 下全部面试官反馈（assistant / system） */
export const collectThreadAssistantFeedback = (messages: InterviewMessage[], threadId: string) => (
  messages
    .filter(item => item.threadId === threadId && (item.role === 'assistant' || item.role === 'system'))
    .map(toMessageText)
    .filter(Boolean)
)

const formatRoundBlocks = (roundLabel: string, parts: string[]) => {
  if (!parts.length) return ''
  return parts
    .map((text, index) => `第 ${ index + 1 } 轮${ roundLabel }：\n${ text }`)
    .join('\n\n')
}

/** 报告「我的答案」：多轮时按轮次全文摘录 */
export const formatReportThreadUserAnswer = (messages: InterviewMessage[], threadId: string) => (
  formatRoundBlocks('回答', collectThreadUserAnswers(messages, threadId))
)

/** 报告「缺点和改进方向」：只保留最后一轮 AI 反馈；若含「参考答案」段落则剥离（归入正确答案） */
export const formatReportThreadLatestAiFeedback = (messages: InterviewMessage[], threadId: string) => {
  const feedbacks = collectThreadAssistantFeedback(messages, threadId)
  const latest = feedbacks[feedbacks.length - 1] || ''
  if (!latest) return ''
  return stripReferenceAnswerSection(latest) || latest
}

/** 从对话 AI 反馈中倒序提取「参考答案」段落（强制揭晓等场景） */
export const extractReferenceAnswerFromThreadMessages = (
  messages: InterviewMessage[],
  threadId: string
) => {
  const feedbacks = collectThreadAssistantFeedback(messages, threadId)
  for (let index = feedbacks.length - 1; index >= 0; index -= 1) {
    const extracted = extractReferenceAnswerFromAssistantContent(feedbacks[index] || '')
    if (extracted) return extracted
  }
  return ''
}

export const isReportQuestionUnanswered = (userAnswer: string) => {
  const normalized = userAnswer.trim()
  return !normalized || normalized === '未作答'
}

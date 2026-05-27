import type {
  PersistedPracticeQuestionGroupItem,
  PersistedReportQuestionReviewItem
} from '@/types/workbench'
import type { InterviewMessage } from '@/types/message'
import { extractReferenceAnswerFromThreadMessages } from '@/utils/report/format-report-thread-dialogue'
import { getMaterialQuestionPool } from '@/services/storage/material-pool-storage'
import {
  looksLikeAnswerBody,
  normalizeQuestionHeading,
  splitMaterialPrompt
} from '@/services/material/material-prompt'
import { extractReferenceAnswerFromAssistantContent } from '@/utils/report/extract-interview-reference-answer'

const normalizeReferenceBody = (text: string) => text.replace(/-{3,}/g, '').trim()

/** 报告「正确答案」：优先组卷项，再查资料题池 chunk，保留换行便于 Markdown 展示 */
export const resolveReportReferenceAnswer = (
  groupItem: PersistedPracticeQuestionGroupItem | null | undefined
) => {
  if (!groupItem) return ''

  const fromItem = groupItem.referenceAnswer?.trim()
  if (fromItem) return normalizeReferenceBody(fromItem)

  const documentId = groupItem.sourceDocumentId
  if (documentId) {
    const pool = getMaterialQuestionPool(documentId)
    const poolQuestion = pool?.questions.find(item => item.id === groupItem.questionId)
    if (poolQuestion?.referenceAnswer?.trim()) {
      return normalizeReferenceBody(poolQuestion.referenceAnswer)
    }

    const chunkId = groupItem.sourceChunkId || poolQuestion?.chunkId
    const chunk = pool?.chunks.find(item => item.id === chunkId)
    if (chunk?.text?.trim()) {
      const body = normalizeReferenceBody(chunk.text)
      if (body && (looksLikeAnswerBody(chunk.text) || body.length >= 24)) {
        const heading = normalizeQuestionHeading(chunk.heading)
        return heading && heading !== '资料正文'
          ? `**${ heading }**\n\n${ body }`
          : body
      }
    }
  }

  if (groupItem.prompt) {
    const { reference } = splitMaterialPrompt(groupItem.prompt)
    if (reference?.trim()) return reference.trim()
  }

  return ''
}

/** 报告「正确答案」：资料/题池优先，再从对话 AI 揭晓段落补全 */
export const resolveReportQuestionReferenceAnswer = (
  groupItem: PersistedPracticeQuestionGroupItem | null | undefined,
  messages: InterviewMessage[] = [],
  threadId = ''
) => {
  const fromMaterial = resolveReportReferenceAnswer(groupItem)
  if (fromMaterial) return fromMaterial
  if (threadId) {
    return extractReferenceAnswerFromThreadMessages(messages, threadId)
  }
  return ''
}

/** 已保存报告缺 referenceAnswer 时，按资料题池或 AI 反馈补全（便于回看历史报告） */
export const enrichReportQuestionReview = (
  review: PersistedReportQuestionReviewItem,
  sourceDocumentId?: string
): PersistedReportQuestionReviewItem => {
  if (review.referenceAnswer?.trim()) return review

  const fromFeedback = review.aiFeedback
    ? extractReferenceAnswerFromAssistantContent(review.aiFeedback)
    : ''
  if (fromFeedback) {
    return { ...review, referenceAnswer: fromFeedback }
  }

  const pool = sourceDocumentId ? getMaterialQuestionPool(sourceDocumentId) : null
  const titleKey = normalizeQuestionHeading(review.questionTitle)
  const poolQuestion = pool?.questions.find((item) => {
    if (item.id === review.questionId) return true
    return normalizeQuestionHeading(item.title) === titleKey
  })

  const referenceAnswer = resolveReportReferenceAnswer({
    questionId: review.questionId,
    order: poolQuestion?.order ?? 0,
    title: review.questionTitle,
    prompt: poolQuestion?.prompt || '',
    matchReason: 'report',
    sourceDocumentId: sourceDocumentId || pool?.documentId,
    sourceChunkId: poolQuestion?.chunkId,
    referenceAnswer: poolQuestion?.referenceAnswer
  })

  if (!referenceAnswer) return review
  return { ...review, referenceAnswer }
}

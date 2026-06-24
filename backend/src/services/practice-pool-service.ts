import { buildPracticePoolLlmMessages } from '../utils/build-practice-pool-llm-messages.js'
import { completeRemoteLlmJson, isRemoteLlmConfigured } from '../utils/complete-remote-llm-json.js'
import { parsePracticePoolLlmJson } from '../utils/parse-practice-pool-llm-json.js'
import type {
  GeneratePracticePoolRequest,
  GeneratePracticePoolResponse,
  PracticeQuestionItemDto,
  PracticeQuestionPoolDto
} from '../types/practice-pool.js'

const buildMockPracticeQuestions = (
  request: GeneratePracticePoolRequest
): PracticeQuestionItemDto[] => {
  const reviews = request.questionReviews || []
  const plan = request.plan
  const count = Math.max(1, request.questionCount)
  const questions: PracticeQuestionItemDto[] = []

  for (let index = 0; index < count; index += 1) {
    const review = reviews[index % Math.max(reviews.length, 1)]
    const titleBase = review?.questionTitle || plan.weaknessTag || '弱项补练'
    const userSnippet = (review?.userAnswer || '').slice(0, 280)
    const feedbackSnippet = (review?.aiFeedback || plan.reason || '').slice(0, 280)

    questions.push({
      id: `practice-pool-${ request.sessionId }-${ index + 1 }`,
      sessionId: request.sessionId,
      order: index,
      title: `【补练 ${ index + 1 }】${ titleBase }`,
      prompt: [
        `针对弱项「${ plan.weaknessTag }」进行专项补练。`,
        review ? `原题：${ review.questionTitle }。` : '',
        userSnippet ? `你上一轮回答要点：${ userSnippet }` : '',
        feedbackSnippet ? `面试官反馈摘要：${ feedbackSnippet }` : '',
        '请用结构化方式重新作答，并补充案例细节与可量化结果。'
      ].filter(Boolean).join('\n'),
      difficulty: plan.difficulty,
      questionType: plan.questionType,
      generatedBy: 'mock',
      focusAreas: plan.focusArea ? [plan.focusArea] : undefined,
      weaknessTag: plan.weaknessTag,
      sourceQuestionId: review?.questionId
    })
  }

  return questions
}

const buildPoolDto = (
  request: GeneratePracticePoolRequest,
  questions: PracticeQuestionItemDto[]
): PracticeQuestionPoolDto => ({
  sessionId: request.sessionId,
  reportId: request.reportId || request.sessionId,
  planSnapshot: { ...request.plan },
  reportSignature: request.reportSignature,
  questions,
  preparedAt: new Date().toISOString(),
  status: questions.length ? 'ready' : 'error',
  errorMessage: questions.length ? undefined : '未能生成任何补练题'
})

export class PracticePoolService {
  async generatePool(request: GeneratePracticePoolRequest): Promise<GeneratePracticePoolResponse> {
    const sessionId = String(request.sessionId || '').trim()
    if (!sessionId) {
      throw Object.assign(new Error('sessionId is required.'), { code: 'SESSION_ID_REQUIRED' })
    }

    const questionCount = Math.max(1, Number(request.questionCount) || request.plan.questionCount || 5)
    const normalizedRequest: GeneratePracticePoolRequest = {
      ...request,
      sessionId,
      questionCount
    }

    let questions: PracticeQuestionItemDto[] = []

    if (isRemoteLlmConfigured(normalizedRequest.modelId)) {
      const messages = buildPracticePoolLlmMessages(normalizedRequest)
      let lastError: Error | null = null

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const raw = await completeRemoteLlmJson(messages, {
            modelId: normalizedRequest.modelId
          })
          questions = parsePracticePoolLlmJson(raw, sessionId, questionCount)
          if (questions.length) break
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('LLM parse failed')
        }
      }

      if (!questions.length && lastError) {
        throw Object.assign(lastError, { code: 'LLM_PARSE_FAILED' })
      }
    } else {
      questions = buildMockPracticeQuestions(normalizedRequest)
    }

    if (!questions.length) {
      questions = buildMockPracticeQuestions(normalizedRequest)
    }

    const pool = buildPoolDto(normalizedRequest, questions)
    const actualCount = pool.questions.length

    return {
      pool,
      requestedCount: questionCount,
      actualCount,
      isShortfall: actualCount < questionCount
    }
  }
}

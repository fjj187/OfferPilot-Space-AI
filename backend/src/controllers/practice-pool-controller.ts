import type { Request, Response } from 'express'
import { PracticePoolService } from '../services/practice-pool-service.js'
import type { GeneratePracticePoolRequest } from '../types/practice-pool.js'

const practicePoolService = new PracticePoolService()

export const generatePracticePoolController = async (request: Request, response: Response) => {
  const payload = request.body as Partial<GeneratePracticePoolRequest>
  const sessionId = String(payload.sessionId || '').trim()

  if (!sessionId) {
    response.status(400).json({
      code: 'SESSION_ID_REQUIRED',
      message: 'sessionId is required.'
    })
    return
  }

  if (!payload.plan?.weaknessTag) {
    response.status(400).json({
      code: 'INVALID_REQUEST',
      message: 'plan.weaknessTag is required.'
    })
    return
  }

  try {
    const result = await practicePoolService.generatePool({
      sessionId,
      reportId: payload.reportId,
      questionCount: Number(payload.questionCount) || Number(payload.plan?.questionCount) || 5,
      plan: payload.plan as GeneratePracticePoolRequest['plan'],
      questionReviews: payload.questionReviews,
      sourceDocumentId: payload.sourceDocumentId,
      sourceDocumentName: payload.sourceDocumentName,
      sourceDocumentSummary: payload.sourceDocumentSummary,
      sourceDocumentTags: payload.sourceDocumentTags,
      sourceDocumentExcerpt: payload.sourceDocumentExcerpt,
      summaryBody: payload.summaryBody,
      weaknessTags: payload.weaknessTags
    })
    response.json(result)
  } catch (error) {
    const code = (error as { code?: string }).code || 'PRACTICE_POOL_FAILED'
    const message = error instanceof Error ? error.message : 'Practice pool generation failed.'
    const status = code === 'SESSION_ID_REQUIRED' ? 400 : 502
    response.status(status).json({ code, message })
  }
}

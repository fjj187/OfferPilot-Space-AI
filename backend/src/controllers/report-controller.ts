import type { Request, Response } from 'express'
import { ReportService } from '../services/report-service.js'
import { getStoredInterviewSessionsBySessionId } from '../storage/interview-session-store.js'
import type { InterviewApiError } from '../types/interview.js'
import type { GenerateInterviewReportRequest } from '../types/report.js'

const reportService = new ReportService()

const createValidationError = (message: string): InterviewApiError => ({
  code: 'INVALID_REQUEST',
  message
})

const resolveReportOwnerScope = (request: Request) => (
  request.authUser?.role === 'user' ? request.authUser.username : undefined
)

export const listInterviewReportsController = (request: Request, response: Response) => {
  response.json({
    reports: reportService.listReports(resolveReportOwnerScope(request))
  })
}

export const getInterviewReportBySessionIdController = (request: Request, response: Response) => {
  const sessionId = String(request.params.sessionId || '').trim()

  if (!sessionId) {
    response.status(400).json(createValidationError('sessionId is required.'))
    return
  }

  const report = reportService.getReportBySessionId(sessionId, resolveReportOwnerScope(request))

  if (!report) {
    response.status(404).json({
      code: 'REPORT_NOT_FOUND',
      message: `No interview report found for sessionId=${ sessionId }.`
    })
    return
  }

  response.json({
    report
  })
}

export const generateInterviewReportController = async (request: Request, response: Response) => {
  const payload = request.body as Partial<GenerateInterviewReportRequest>
  const sessionId = String(payload.sessionId || '').trim()

  if (!sessionId) {
    response.status(400).json(createValidationError('sessionId is required.'))
    return
  }

  const sessions = getStoredInterviewSessionsBySessionId(sessionId)
  const scopedOwner = resolveReportOwnerScope(request)
  const hasOwnedSession = sessions.some(session => Boolean(session.owner))
  const isAdmin = request.authUser?.role === 'admin'

  if (!sessions.length) {
    response.status(404).json({
      code: 'SESSION_NOT_FOUND',
      message: `No interview session found for sessionId=${ sessionId }.`
    })
    return
  }

  if (!isAdmin) {
    if (scopedOwner) {
      const hasAccess = sessions.some(session => session.owner === scopedOwner)
      if (!hasAccess) {
        response.status(404).json({
          code: 'SESSION_NOT_FOUND',
          message: `No interview session found for sessionId=${ sessionId }.`
        })
        return
      }
    } else if (hasOwnedSession) {
      response.status(404).json({
        code: 'SESSION_NOT_FOUND',
        message: `No interview session found for sessionId=${ sessionId }.`
      })
      return
    }
  }

  try {
    const result = await reportService.generateReport({
      sessionId,
      modelId: payload.modelId,
      topic: payload.topic,
      source: payload.source,
      sourceDocumentId: payload.sourceDocumentId,
      sourceDocumentName: payload.sourceDocumentName,
      sourceDocumentExcerpt: payload.sourceDocumentExcerpt,
      answeredCount: payload.answeredCount,
      totalCount: payload.totalCount,
      summaryBody: payload.summaryBody,
      weaknessTags: payload.weaknessTags,
      weaknessFocusAreas: payload.weaknessFocusAreas,
      primaryWeakness: payload.primaryWeakness,
      questionReviews: payload.questionReviews,
      suggestedFocus: payload.suggestedFocus
    })

    response.json(result)
  } catch (error) {
    response.status(500).json({
      code: 'REPORT_GENERATE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to generate report.'
    })
  }
}

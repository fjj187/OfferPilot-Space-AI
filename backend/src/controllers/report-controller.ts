import type { Request, Response } from 'express'
import { ReportService } from '../services/report-service.js'
import type { InterviewApiError } from '../types/interview.js'
import type { GenerateInterviewReportRequest } from '../types/report.js'

const reportService = new ReportService()

const createValidationError = (message: string): InterviewApiError => ({
  code: 'INVALID_REQUEST',
  message
})

export const listInterviewReportsController = (_request: Request, response: Response) => {
  response.json({
    reports: reportService.listReports()
  })
}

export const getInterviewReportBySessionIdController = (request: Request, response: Response) => {
  const sessionId = String(request.params.sessionId || '').trim()

  if (!sessionId) {
    response.status(400).json(createValidationError('sessionId is required.'))
    return
  }

  const report = reportService.getReportBySessionId(sessionId)

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

export const generateInterviewReportController = (request: Request, response: Response) => {
  const payload = request.body as Partial<GenerateInterviewReportRequest>
  const sessionId = String(payload.sessionId || '').trim()

  if (!sessionId) {
    response.status(400).json(createValidationError('sessionId is required.'))
    return
  }

  try {
    const result = reportService.generateReport({
      sessionId,
      topic: payload.topic,
      source: payload.source,
      sourceDocumentId: payload.sourceDocumentId,
      sourceDocumentName: payload.sourceDocumentName,
      answeredCount: payload.answeredCount,
      totalCount: payload.totalCount,
      weaknessTags: payload.weaknessTags,
      primaryWeakness: payload.primaryWeakness
    })

    response.json(result)
  } catch (error) {
    response.status(500).json({
      code: 'REPORT_GENERATE_FAILED',
      message: error instanceof Error ? error.message : 'Failed to generate report.'
    })
  }
}

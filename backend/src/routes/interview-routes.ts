import { Router } from 'express'
import {
  getInterviewSessionDetailController,
  listInterviewSessionsController,
  streamInterviewController
} from '../controllers/interview-controller.js'
import {
  clearInterviewHistoryController
} from '../controllers/interview-history-controller.js'
import {
  generateInterviewReportController,
  getInterviewReportBySessionIdController,
  listInterviewReportsController
} from '../controllers/report-controller.js'

export const interviewRouter = Router()

interviewRouter.post('/history/clear', clearInterviewHistoryController)
interviewRouter.get('/sessions', listInterviewSessionsController)
interviewRouter.get('/sessions/:sessionId/:threadId', getInterviewSessionDetailController)
interviewRouter.post('/stream', streamInterviewController)
interviewRouter.get('/reports', listInterviewReportsController)
interviewRouter.get('/reports/:sessionId', getInterviewReportBySessionIdController)
interviewRouter.post('/reports/generate', generateInterviewReportController)

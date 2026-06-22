import { Router } from 'express'
import {
  getInterviewStreamCheckpointController,
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
import { generatePracticePoolController } from '../controllers/practice-pool-controller.js'
import { attachOptionalAuth } from '../middlewares/auth-middleware.js'

export const interviewRouter = Router()

interviewRouter.post('/history/clear', clearInterviewHistoryController)
interviewRouter.get('/sessions', attachOptionalAuth, listInterviewSessionsController)
interviewRouter.get('/sessions/:sessionId/:threadId', attachOptionalAuth, getInterviewSessionDetailController)
interviewRouter.get('/sessions/:sessionId/:threadId/checkpoint', attachOptionalAuth, getInterviewStreamCheckpointController)
interviewRouter.post('/stream', attachOptionalAuth, streamInterviewController)
interviewRouter.get('/reports', attachOptionalAuth, listInterviewReportsController)
interviewRouter.get('/reports/:sessionId', attachOptionalAuth, getInterviewReportBySessionIdController)
interviewRouter.post('/reports/generate', attachOptionalAuth, generateInterviewReportController)
interviewRouter.post('/practice-pool/generate', generatePracticePoolController)

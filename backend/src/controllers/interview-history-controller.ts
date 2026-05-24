import type { Request, Response } from 'express'
import { InterviewHistoryService } from '../services/interview-history-service.js'

const interviewHistoryService = new InterviewHistoryService()

export const clearInterviewHistoryController = (_request: Request, response: Response) => {
  interviewHistoryService.clearAll()
  response.json({
    ok: true
  })
}

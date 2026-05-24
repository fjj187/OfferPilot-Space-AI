import { clearAllStoredInterviewReports } from '../storage/interview-report-store.js'
import { clearAllStoredInterviewSessions } from '../storage/interview-session-store.js'

export class InterviewHistoryService {
  clearAll() {
    clearAllStoredInterviewSessions()
    clearAllStoredInterviewReports()
  }
}

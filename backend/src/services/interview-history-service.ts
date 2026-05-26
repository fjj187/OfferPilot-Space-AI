import { clearAllStoredInterviewSessions } from '../storage/interview-session-store.js'

export class InterviewHistoryService {
  /** 仅清空对话 session；复盘报告单独持久化，不受「清空对话历史」影响 */
  clearAll() {
    clearAllStoredInterviewSessions()
  }
}

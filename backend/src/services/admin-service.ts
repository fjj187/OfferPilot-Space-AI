import { getStoredInterviewReports } from '../storage/interview-report-store.js'
import { getStoredInterviewSessions } from '../storage/interview-session-store.js'

type StoredSession = ReturnType<typeof getStoredInterviewSessions>[number]
type StoredReport = ReturnType<typeof getStoredInterviewReports>[number]

const isToday = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date.toDateString() === new Date().toDateString()
}

const buildRecentTrend = (values: string[]) => {
  const today = new Date()

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(today)
    current.setDate(today.getDate() - (6 - index))
    const label = `${ current.getMonth() + 1 }-${ current.getDate() }`
    const count = values.filter((value) => {
      const date = new Date(value)
      return !Number.isNaN(date.getTime()) && date.toDateString() === current.toDateString()
    }).length

    return {
      label,
      count
    }
  })
}

const deriveSessionStatus = (session: StoredSession) => {
  if (session.messages.length <= 0) return 'aborted' as const
  if ([...session.messages].reverse().find(item => item.role === 'assistant')?.content?.trim()) return 'completed' as const
  if ([...session.messages].reverse().find(item => item.role === 'user')?.content?.trim()) return 'in_progress' as const
  return 'aborted' as const
}

const deriveReportScore = (report: StoredReport) => {
  if (!report.totalCount) return 0
  return Math.round((report.answeredCount / report.totalCount) * 100)
}

const deriveReportGenerateStatus = (report: StoredReport) => {
  return report.summaryHeadline?.trim() || report.summaryBody?.trim()
    ? 'generated' as const
    : 'incomplete' as const
}

export class AdminService {
  getDashboard() {
    const sessions = getStoredInterviewSessions()
    const reports = getStoredInterviewReports()
    const generatedReports = reports.filter(report => deriveReportGenerateStatus(report) === 'generated')

    return {
      metrics: {
        totalSessions: sessions.length,
        todaySessions: sessions.filter(session => isToday(session.updatedAt)).length,
        totalReports: reports.length,
        todayReports: reports.filter(report => isToday(report.createdAt)).length,
        abnormalSessions: sessions.filter(session => deriveSessionStatus(session) === 'aborted').length,
        reportSuccessRate: reports.length ? Math.round((generatedReports.length / reports.length) * 100) : 0
      },
      trends: {
        sessions7d: buildRecentTrend(sessions.map(item => item.updatedAt)),
        reports7d: buildRecentTrend(reports.map(item => item.createdAt))
      },
      recentSessions: sessions.slice(0, 5).map(session => ({
        sessionId: session.sessionId,
        threadId: session.threadId,
        topic: session.topic,
        questionTitle: session.questionTitle,
        messageCount: session.messages.length,
        status: deriveSessionStatus(session),
        updatedAt: session.updatedAt
      })),
      recentReports: reports.slice(0, 5).map(report => ({
        id: report.id,
        sessionId: report.sessionId,
        topic: report.topic,
        summaryHeadline: report.summaryHeadline,
        score: deriveReportScore(report),
        generateStatus: deriveReportGenerateStatus(report),
        createdAt: report.createdAt
      }))
    }
  }

  listSessions() {
    return getStoredInterviewSessions().map(session => ({
      sessionId: session.sessionId,
      threadId: session.threadId,
      topic: session.topic,
      questionTitle: session.questionTitle,
      messageCount: session.messages.length,
      latestUserMessage: [...session.messages].reverse().find(item => item.role === 'user')?.content || '',
      latestAssistantMessage: [...session.messages].reverse().find(item => item.role === 'assistant')?.content || '',
      updatedAt: session.updatedAt,
      status: deriveSessionStatus(session)
    }))
  }

  listReports() {
    return getStoredInterviewReports().map(report => ({
      id: report.id,
      sessionId: report.sessionId,
      threadId: report.threadId,
      topic: report.topic,
      questionTitle: report.questionTitle,
      summaryHeadline: report.summaryHeadline,
      summaryBody: report.summaryBody,
      primaryWeakness: report.primaryWeakness,
      weaknessTags: report.weaknessTags,
      answeredCount: report.answeredCount,
      totalCount: report.totalCount,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      score: deriveReportScore(report),
      generateStatus: deriveReportGenerateStatus(report)
    }))
  }
}

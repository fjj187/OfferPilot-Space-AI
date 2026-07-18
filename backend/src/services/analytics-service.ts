import { getStoredInterviewReports } from '../storage/interview-report-store.js'
import { getStoredInterviewSessions } from '../storage/interview-session-store.js'
import type {
  AnalyticsActivityDto,
  AnalyticsDistributionDto,
  AnalyticsMetricTone,
  AnalyticsOverviewResponse,
  AnalyticsTimeRange,
  AnalyticsHeatmapDayDto,
  AnalyticsWeaknessRankDto
} from '../types/analytics.js'

type StoredSession = ReturnType<typeof getStoredInterviewSessions>[number]
type StoredReport = ReturnType<typeof getStoredInterviewReports>[number]

type AnalyticsOwnerScope = {
  role?: 'admin' | 'user'
  username?: string
}

const dayMs = 24 * 60 * 60 * 1000

const topicLabelMap: Record<string, string> = {
  vue3: 'Vue 3',
  typescript: 'TypeScript',
  engineering: '工程化',
  browser: '浏览器',
  performance: '性能优化',
  scenario: '场景题'
}

const focusAreaLabelMap: Record<string, string> = {
  structure: '结构表达',
  case_detail: '案例细节',
  result_metric: '结果指标',
  principle_depth: '原理追问'
}

const practiceQuestionTypeLabelMap: Record<string, string> = {
  concept: '概念理解',
  code: '代码分析',
  scenario: '场景追问'
}

const toTimestamp = (value?: string) => {
  if (!value) return 0

  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)))

const isInTimeRange = (timestamp: number, range: AnalyticsTimeRange, now: number) => {
  if (range === 'all') return true
  if (!timestamp) return false

  const days = range === '7d' ? 7 : 30
  return timestamp >= now - days * dayMs
}

const filterSessionsByRange = (sessions: StoredSession[], range: AnalyticsTimeRange, now: number) => {
  return sessions.filter(session => isInTimeRange(toTimestamp(session.updatedAt), range, now))
}

const filterReportsByRange = (reports: StoredReport[], range: AnalyticsTimeRange, now: number) => {
  return reports.filter(report => isInTimeRange(toTimestamp(report.createdAt), range, now))
}

const canReadByOwnerScope = (owner: string | undefined, scope?: AnalyticsOwnerScope) => {
  if (scope?.role === 'admin') return true
  if (scope?.role === 'user') return owner === scope.username
  return !owner
}

const isCompletedSession = (session: StoredSession) => {
  return Boolean([...session.messages].reverse().find(item => item.role === 'assistant')?.content.trim())
}

const formatDurationHours = (sessions: StoredSession[]) => {
  const totalMs = sessions.reduce((sum, session) => {
    const timestamps = session.messages.map(item => toTimestamp(item.createdAt)).filter(Boolean)
    const start = Math.min(...timestamps)
    const end = Math.max(...timestamps)

    return timestamps.length > 1 && end > start ? sum + end - start : sum
  }, 0)
  const hours = totalMs / 1000 / 60 / 60

  if (hours >= 1) return `${ hours.toFixed(1) } h`
  return `${ Math.round(hours * 60) } min`
}

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = `${ date.getMonth() + 1 }`.padStart(2, '0')
  const day = `${ date.getDate() }`.padStart(2, '0')

  return `${ year }-${ month }-${ day }`
}

const formatDateLabel = (date: Date) => {
  const month = `${ date.getMonth() + 1 }`.padStart(2, '0')
  const day = `${ date.getDate() }`.padStart(2, '0')

  return `${ month }-${ day }`
}

const formatActivityTimeText = (timestamp: number, now: number) => {
  if (!timestamp) return '时间未知'

  const diffMs = Math.max(0, now - timestamp)
  const diffMinutes = Math.floor(diffMs / 1000 / 60)

  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${ diffMinutes } 分钟前`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${ diffHours } 小时前`

  const diffDays = Math.floor(diffHours / 24)
  return `${ diffDays } 天前`
}

const resolveCompletionScore = (answeredCount: number, totalCount: number, weaknessCount: number) => {
  const completionRate = totalCount > 0 ? answeredCount / totalCount : 0
  return clampScore(64 + completionRate * 28 - Math.min(weaknessCount, 6) * 2)
}

const countByName = (items: string[]): AnalyticsDistributionDto[] => {
  const map = new Map<string, number>()

  items.forEach((name) => {
    map.set(name, (map.get(name) || 0) + 1)
  })

  return [...map.entries()]
    .map(([name, value]) => ({
      name,
      value
    }))
    .sort((left, right) => right.value - left.value)
}

const buildTopicDistribution = (sessions: StoredSession[], reports: StoredReport[]) => {
  const sessionTopics = sessions.map(session => topicLabelMap[session.topic] || session.topic)
  if (sessionTopics.length) return countByName(sessionTopics)

  return countByName(reports.map(report => topicLabelMap[report.topic] || report.topic))
}

const buildPracticeQuestionTypeDistribution = (reports: StoredReport[]) => {
  const labels = reports.flatMap((report) => {
    const questionType = report.practicePlan?.questionType
    if (!questionType) return []

    const label = practiceQuestionTypeLabelMap[questionType]
    return label ? [label] : []
  })

  return countByName(labels)
}

const buildAbilityRadar = (reports: StoredReport[], sessions: StoredSession[]) => {
  const completedSessions = sessions.filter(isCompletedSession)
  const answeredTotal = reports.reduce((sum, item) => sum + item.answeredCount, 0)
  const questionTotal = reports.reduce((sum, item) => sum + item.totalCount, 0)
  const completionScore = questionTotal > 0
    ? clampScore((answeredTotal / questionTotal) * 100)
    : clampScore(68 + Math.min(completedSessions.length * 4, 20))
  const weaknessCount = reports.flatMap(item => item.weaknessTags).length

  return [
    {
      name: '表达能力',
      value: clampScore(completionScore - Math.min(weaknessCount, 12)),
      max: 100
    },
    {
      name: '逻辑结构',
      value: clampScore(completionScore - Math.min(reports.length * 2, 10)),
      max: 100
    },
    {
      name: '专业知识',
      value: clampScore(completionScore + Math.min(completedSessions.length, 8)),
      max: 100
    },
    {
      name: '岗位匹配',
      value: clampScore(completionScore - Math.min(reports.length, 6)),
      max: 100
    },
    {
      name: '抗压能力',
      value: clampScore(completionScore - Math.min(weaknessCount, 14)),
      max: 100
    },
    {
      name: '复盘吸收',
      value: clampScore(70 + Math.min(reports.length * 6, 24)),
      max: 100
    }
  ]
}

const buildScoreTrend = (reports: StoredReport[], sessions: StoredSession[]) => {
  const reportPoints = reports
    .slice()
    .sort((left, right) => toTimestamp(left.createdAt) - toTimestamp(right.createdAt))
    .slice(-14)
    .map((report, index) => ({
      label: `第 ${ index + 1 } 次`,
      score: resolveCompletionScore(report.answeredCount, report.totalCount, report.weaknessTags.length),
      completedAt: report.createdAt
    }))

  if (reportPoints.length) return reportPoints

  return sessions
    .filter(isCompletedSession)
    .sort((left, right) => toTimestamp(left.updatedAt) - toTimestamp(right.updatedAt))
    .slice(-14)
    .map((session, index) => ({
      label: `第 ${ index + 1 } 次`,
      score: resolveCompletionScore(1, 1, 0),
      completedAt: session.updatedAt
    }))
}

const buildWeaknessRanking = (reports: StoredReport[]): AnalyticsWeaknessRankDto[] => {
  const weaknessCounts = new Map<string, {
    value: number
    details: Set<string>
  }>()

  const collect = (name: string, detail?: string) => {
    const normalizedName = name.trim()
    if (!normalizedName) return

    const current = weaknessCounts.get(normalizedName) ?? {
      value: 0,
      details: new Set<string>()
    }

    current.value += 1
    if (detail) current.details.add(detail)
    weaknessCounts.set(normalizedName, current)
  }

  reports.forEach((report) => {
    const focusText = report.weaknessFocusAreas
      ?.map(area => focusAreaLabelMap[area] || area)
      .filter(Boolean)
      .join(' / ')

    report.weaknessTags.forEach(tag => collect(tag, focusText || report.primaryWeakness))
    if (report.primaryWeakness) collect(report.primaryWeakness, focusText)
  })

  const tones: AnalyticsMetricTone[] = ['red', 'orange', 'blue', 'green']

  return [...weaknessCounts.entries()]
    .sort((left, right) => right[1].value - left[1].value)
    .slice(0, 5)
    .map(([name, payload], index) => ({
      name,
      value: payload.value,
      detail: [...payload.details][0] || '来自后端训练记录',
      tone: tones[index] ?? 'blue'
    }))
}

const buildTrainingHeatmap = (
  sessions: StoredSession[],
  reports: StoredReport[],
  now: number
): AnalyticsHeatmapDayDto[] => {
  const dayCounts = new Map<string, number>()

  const collect = (value?: string) => {
    const timestamp = toTimestamp(value)
    if (!timestamp) return

    const dateKey = formatDateKey(new Date(timestamp))
    dayCounts.set(dateKey, (dayCounts.get(dateKey) || 0) + 1)
  }

  sessions.forEach(session => collect(session.updatedAt))
  reports.forEach(report => collect(report.createdAt))

  return Array.from({
    length: 14
  }, (_, index) => {
    const date = new Date(now - (13 - index) * dayMs)
    const dateKey = formatDateKey(date)

    return {
      date: dateKey,
      label: formatDateLabel(date),
      value: dayCounts.get(dateKey) || 0
    }
  })
}

const buildActivityFeed = (reports: StoredReport[], sessions: StoredSession[], now: number): AnalyticsActivityDto[] => {
  const reportActivities = reports.map(report => ({
    id: `report-${ report.id }`,
    title: '生成复盘报告',
    description: report.primaryWeakness || report.summaryHeadline || '完成一次训练复盘',
    timeText: formatActivityTimeText(toTimestamp(report.createdAt), now),
    type: 'report' as const,
    timestamp: toTimestamp(report.createdAt)
  }))
  const sessionActivities = sessions.map(session => ({
    id: `session-${ session.sessionId }-${ session.threadId }`,
    title: isCompletedSession(session) ? '完成一场模拟面试' : '保存一场模拟面试',
    description: `${ topicLabelMap[session.topic] || session.topic } · ${ session.questionTitle }`,
    timeText: formatActivityTimeText(toTimestamp(session.updatedAt), now),
    type: 'mock' as const,
    timestamp: toTimestamp(session.updatedAt)
  }))

  return [...reportActivities, ...sessionActivities]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 5)
    .map((activity) => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      timeText: activity.timeText,
      type: activity.type
    }))
}

export class AnalyticsService {
  getOverview(range: AnalyticsTimeRange, ownerScope?: AnalyticsOwnerScope): AnalyticsOverviewResponse {
    const now = Date.now()
    const sessions = filterSessionsByRange(
      getStoredInterviewSessions().filter(session => canReadByOwnerScope(session.owner, ownerScope)),
      range,
      now
    )
    const reports = filterReportsByRange(
      getStoredInterviewReports().filter(report => canReadByOwnerScope(report.owner, ownerScope)),
      range,
      now
    )

    if (!sessions.length && !reports.length) {
      return {
        summary: [],
        scoreTrend: [],
        abilityRadar: [],
        topicDistribution: [],
        practiceQuestionTypeDistribution: [],
        weaknessRanking: [],
        trainingHeatmap: [],
        activityFeed: [],
        generatedAt: new Date(now).toISOString()
      }
    }

    const completedSessions = sessions.filter(isCompletedSession)
    const scoreTrend = buildScoreTrend(reports, sessions)
    const averageScore = scoreTrend.length
      ? Math.round(scoreTrend.reduce((sum, item) => sum + item.score, 0) / scoreTrend.length)
      : 0
    const weaknessCount = new Set(reports.flatMap(item => item.weaknessTags)).size

    return {
      summary: [
        {
          key: 'mock-count',
          label: '累计面试',
          value: `${ sessions.length } 场`,
          trendText: `${ completedSessions.length } 场已完成`,
          tone: 'blue'
        },
        {
          key: 'practice-time',
          label: '训练时长',
          value: formatDurationHours(completedSessions),
          trendText: '按后端会话估算',
          tone: 'green'
        },
        {
          key: 'average-score',
          label: '平均评分',
          value: averageScore ? `${ averageScore } 分` : '暂无',
          trendText: scoreTrend.length ? `基于 ${ scoreTrend.length } 次记录` : '等待完成训练',
          tone: 'orange'
        },
        {
          key: 'weakness-tags',
          label: '弱项标签',
          value: `${ weaknessCount } 个`,
          trendText: reports.length ? '来自复盘报告' : '暂无复盘报告',
          tone: 'red'
        }
      ],
      scoreTrend,
      abilityRadar: buildAbilityRadar(reports, sessions),
      topicDistribution: buildTopicDistribution(sessions, reports),
      practiceQuestionTypeDistribution: buildPracticeQuestionTypeDistribution(reports),
      weaknessRanking: buildWeaknessRanking(reports),
      trainingHeatmap: buildTrainingHeatmap(sessions, reports, now),
      activityFeed: buildActivityFeed(reports, sessions, now),
      generatedAt: new Date(now).toISOString()
    }
  }
}

import { computed, ref } from 'vue'

import { interviewAnalyticsDemoData } from '@/components/analytics/interviewAnalyticsDemoData'
import { useWorkbenchPersistence } from '@/composables/workspace/useWorkbenchPersistence'
import type {
  InterviewAnalyticsDashboardData,
  InterviewAnalyticsTimeRange,
  InterviewAnalyticsTimeRangeOption,
  InterviewDistributionItem,
  InterviewMetricTone,
  InterviewTrainingHeatmapDay,
  InterviewWeaknessRankItem
} from '@/types/interview-analytics'
import type {
  PersistedInterviewSession,
  PersistedPracticeFocusArea,
  PersistedReportSummary,
  PersistedTopicKey
} from '@/types/workbench'

const topicLabelMap: Record<PersistedTopicKey, string> = {
  vue3: 'Vue 3',
  typescript: 'TypeScript',
  engineering: '工程化',
  browser: '浏览器',
  performance: '性能优化',
  scenario: '场景题'
}

const focusAreaLabelMap: Record<PersistedPracticeFocusArea, string> = {
  structure: '结构表达',
  case_detail: '案例细节',
  result_metric: '结果指标',
  principle_depth: '原理追问'
}

const questionTypeKeywordMap: Array<{
  name: string
  patterns: RegExp[]
}> = [
  {
    name: '技术题',
    patterns: [/原理|源码|响应式|类型|泛型|工程化|性能|浏览器|缓存|网络/]
  },
  {
    name: '项目题',
    patterns: [/项目|实践|方案|落地|复盘|指标|协作/]
  },
  {
    name: '行为题',
    patterns: [/沟通|协作|冲突|推进|复盘|成长/]
  },
  {
    name: '开放题',
    patterns: [/设计|取舍|方案|架构|开放/]
  },
  {
    name: '压力题',
    patterns: [/追问|压力|高压|卡顿|不足|薄弱/]
  }
]

type AbilityFocusArea = 'structure' | 'case_detail' | 'result_metric' | 'principle_depth'

const dayMs = 24 * 60 * 60 * 1000

const timeRangeOptions: InterviewAnalyticsTimeRangeOption[] = [
  {
    value: '7d',
    label: '近 7 天'
  },
  {
    value: '30d',
    label: '近 30 天'
  },
  {
    value: 'all',
    label: '全部'
  }
]

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)))

const toTimestamp = (value?: string) => {
  if (!value) return 0

  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

const formatDurationHours = (sessions: PersistedInterviewSession[]) => {
  const totalMs = sessions.reduce((sum, session) => {
    const start = toTimestamp(session.startedAt)
    const end = toTimestamp(session.finishedAt)
    return start && end && end > start ? sum + end - start : sum
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

const resolveCompletionScore = (answeredCount: number, totalCount: number, weaknessCount: number) => {
  const completionRate = totalCount > 0 ? answeredCount / totalCount : 0
  return clampScore(64 + completionRate * 28 - Math.min(weaknessCount, 6) * 2)
}

const countByName = (items: string[]) => {
  const map = new Map<string, number>()

  items.forEach((name) => {
    map.set(name, (map.get(name) || 0) + 1)
  })

  return [...map.entries()]
    .map(([name, value]) => ({
      name,
      value
    }))
    .sort((a, b) => b.value - a.value)
}

const ensureDistribution = (items: InterviewDistributionItem[], fallback: InterviewDistributionItem[]) => {
  return items.length ? items : fallback
}

const isInTimeRange = (timestamp: number, range: InterviewAnalyticsTimeRange, now: number) => {
  if (range === 'all') return true
  if (!timestamp) return false

  const days = range === '7d' ? 7 : 30
  return timestamp >= now - days * dayMs
}

const filterSessionsByRange = (
  sessions: PersistedInterviewSession[],
  range: InterviewAnalyticsTimeRange,
  now: number
) => sessions.filter((session) => {
  const timestamp = toTimestamp(session.finishedAt || session.startedAt)
  return isInTimeRange(timestamp, range, now)
})

const filterReportsByRange = (
  reports: PersistedReportSummary[],
  range: InterviewAnalyticsTimeRange,
  now: number
) => reports.filter((report) => {
  const timestamp = toTimestamp(report.createdAt)
  return isInTimeRange(timestamp, range, now)
})

const resolveQuestionTypeName = (text: string) => {
  const matched = questionTypeKeywordMap.find(item => item.patterns.some(pattern => pattern.test(text)))
  return matched?.name || '开放题'
}

const buildQuestionTypeDistribution = (reports: PersistedReportSummary[], sessions: PersistedInterviewSession[]) => {
  const reportTypes = reports.flatMap((report) => {
    const reviewTitles = report.questionReviews?.map(item => item.questionTitle).filter(Boolean) ?? []
    const weaknessText = report.weaknessTags.join(' ')
    return reviewTitles.length
      ? reviewTitles.map(title => resolveQuestionTypeName(`${ title } ${ weaknessText }`))
      : report.weaknessTags.map(tag => resolveQuestionTypeName(tag))
  })
  const sessionTypes = sessions.flatMap((session) => {
    const threadTitles = session.questionThreadsSnapshot?.map(item => item.title).filter(Boolean) ?? []
    return threadTitles.map(title => resolveQuestionTypeName(`${ title } ${ session.weaknessTags.join(' ') }`))
  })

  return ensureDistribution(
    countByName([...reportTypes, ...sessionTypes]),
    interviewAnalyticsDemoData.questionTypeDistribution
  )
}

const buildAbilityRadar = (reports: PersistedReportSummary[], sessions: PersistedInterviewSession[]) => {
  const completedSessions = sessions.filter(item => item.status === 'completed')
  const answeredTotal = completedSessions.reduce((sum, item) => sum + item.answeredCount, 0)
  const questionTotal = completedSessions.reduce((sum, item) => sum + item.questionCount, 0)
  const completionScore = questionTotal > 0 ? clampScore((answeredTotal / questionTotal) * 100) : 76
  const focusScores: Record<AbilityFocusArea, number[]> = {
    structure: [],
    case_detail: [],
    result_metric: [],
    principle_depth: []
  }

  reports.forEach((report) => {
    report.weaknessFocusAreas?.forEach((area) => {
      focusScores[area]?.push(resolveCompletionScore(report.answeredCount, report.totalCount, report.weaknessTags.length))
    })
  })

  return [
    {
      name: '表达能力',
      value: clampScore((focusScores.case_detail[0] ?? completionScore) - reports.length),
      max: 100
    },
    {
      name: '逻辑结构',
      value: clampScore((focusScores.structure[0] ?? completionScore) - Math.min(reports.length * 2, 8)),
      max: 100
    },
    {
      name: '专业知识',
      value: clampScore((focusScores.principle_depth[0] ?? completionScore) + Math.min(completedSessions.length, 8)),
      max: 100
    },
    {
      name: '岗位匹配',
      value: clampScore((focusScores.result_metric[0] ?? completionScore) - Math.min(reports.length, 6)),
      max: 100
    },
    {
      name: '抗压能力',
      value: clampScore(completionScore - Math.min(reports.flatMap(item => item.weaknessTags).length, 14)),
      max: 100
    },
    {
      name: '复盘吸收',
      value: clampScore(70 + Math.min(reports.length * 6, 24)),
      max: 100
    }
  ]
}

const buildScoreTrend = (reports: PersistedReportSummary[], sessions: PersistedInterviewSession[]) => {
  const reportPoints = reports
    .slice()
    .sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt))
    .slice(-14)
    .map((report, index) => ({
      label: `第 ${ index + 1 } 次`,
      score: resolveCompletionScore(report.answeredCount, report.totalCount, report.weaknessTags.length),
      completedAt: report.createdAt
    }))

  if (reportPoints.length) return reportPoints

  return sessions
    .filter(item => item.status === 'completed')
    .sort((a, b) => toTimestamp(a.finishedAt) - toTimestamp(b.finishedAt))
    .slice(-14)
    .map((session, index) => ({
      label: `第 ${ index + 1 } 次`,
      score: resolveCompletionScore(session.answeredCount, session.questionCount, session.weaknessTags.length),
      completedAt: session.finishedAt
    }))
}

const buildActivityFeed = (reports: PersistedReportSummary[], sessions: PersistedInterviewSession[]) => {
  const reportActivities = reports.map(report => ({
    id: `report-${ report.id }`,
    title: '生成复盘报告',
    description: report.primaryWeakness || report.summaryHeadline || '完成一次训练复盘',
    timeText: '报告记录',
    type: 'report' as const,
    timestamp: toTimestamp(report.createdAt)
  }))
  const sessionActivities = sessions.map(session => ({
    id: `session-${ session.id }`,
    title: session.status === 'completed' ? '完成一场模拟面试' : '保存一场模拟面试',
    description: `${ topicLabelMap[session.topic] } · ${ session.answeredCount }/${ session.questionCount } 题`,
    timeText: session.status === 'completed' ? '训练完成' : '训练记录',
    type: 'mock' as const,
    timestamp: toTimestamp(session.finishedAt || session.startedAt)
  }))

  return [...reportActivities, ...sessionActivities]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
    .map((activity) => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      timeText: activity.timeText,
      type: activity.type
    }))
}

const buildWeaknessRanking = (
  reports: PersistedReportSummary[],
  sessions: PersistedInterviewSession[]
): InterviewWeaknessRankItem[] => {
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
      ?.map(area => focusAreaLabelMap[area])
      .filter(Boolean)
      .join(' / ')

    report.weaknessTags.forEach(tag => collect(tag, focusText || report.primaryWeakness))
    if (report.primaryWeakness) collect(report.primaryWeakness, focusText)
  })

  sessions.forEach((session) => {
    session.weaknessTags.forEach(tag => collect(tag, `${ topicLabelMap[session.topic] } 训练记录`))
  })

  const tones: InterviewMetricTone[] = ['red', 'orange', 'blue', 'green']

  return [...weaknessCounts.entries()]
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 5)
    .map(([name, payload], index) => ({
      name,
      value: payload.value,
      detail: [...payload.details][0] || '来自本地训练弱项记录',
      tone: tones[index] ?? 'blue'
    }))
}

const buildTrainingHeatmap = (
  sessions: PersistedInterviewSession[],
  reports: PersistedReportSummary[],
  now: number
): InterviewTrainingHeatmapDay[] => {
  const dayCounts = new Map<string, number>()

  const collect = (value?: string) => {
    const timestamp = toTimestamp(value)
    if (!timestamp) return

    const dateKey = formatDateKey(new Date(timestamp))
    dayCounts.set(dateKey, (dayCounts.get(dateKey) || 0) + 1)
  }

  sessions.forEach(session => collect(session.finishedAt || session.startedAt))
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

const buildDashboardData = (
  sessions: PersistedInterviewSession[],
  reports: PersistedReportSummary[],
  now: number
): InterviewAnalyticsDashboardData => {
  const completedSessions = sessions.filter(item => item.status === 'completed')
  const scoreTrend = buildScoreTrend(reports, sessions)
  const averageScore = scoreTrend.length
    ? Math.round(scoreTrend.reduce((sum, item) => sum + item.score, 0) / scoreTrend.length)
    : 0
  const weaknessCount = new Set(reports.flatMap(item => item.weaknessTags)).size

  return {
    metrics: [
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
        trendText: '按本地会话估算',
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
    abilityRadar: buildAbilityRadar(reports, sessions),
    scoreTrend,
    questionTypeDistribution: buildQuestionTypeDistribution(reports, sessions),
    jobPracticeDistribution: ensureDistribution(
      countByName(sessions.map(item => topicLabelMap[item.topic] || item.topic)),
      interviewAnalyticsDemoData.jobPracticeDistribution
    ),
    weaknessRanking: buildWeaknessRanking(reports, sessions),
    trainingHeatmap: buildTrainingHeatmap(sessions, reports, now),
    activityFeed: buildActivityFeed(reports, sessions)
  }
}

export const useInterviewAnalyticsDashboardData = () => {
  const { loadInterviewSessions, loadReportSummaries } = useWorkbenchPersistence()

  const selectedTimeRange = ref<InterviewAnalyticsTimeRange>('30d')
  const currentTimestamp = computed(() => Date.now())
  const sessions = computed(() => loadInterviewSessions())
  const reports = computed(() => loadReportSummaries())
  const hasLocalAnalyticsData = computed(() => Boolean(sessions.value.length || reports.value.length))
  const filteredSessions = computed(() => filterSessionsByRange(sessions.value, selectedTimeRange.value, currentTimestamp.value))
  const filteredReports = computed(() => filterReportsByRange(reports.value, selectedTimeRange.value, currentTimestamp.value))
  const hasFilteredAnalyticsData = computed(() => Boolean(filteredSessions.value.length || filteredReports.value.length))
  const selectedTimeRangeText = computed(() => {
    if (!hasLocalAnalyticsData.value) return '演示数据'
    return timeRangeOptions.find(item => item.value === selectedTimeRange.value)?.label ?? '全部'
  })
  const dashboardData = computed(() => (
    hasFilteredAnalyticsData.value
      ? buildDashboardData(filteredSessions.value, filteredReports.value, currentTimestamp.value)
      : interviewAnalyticsDemoData
  ))

  return {
    dashboardData,
    hasFilteredAnalyticsData,
    hasLocalAnalyticsData,
    selectedTimeRange,
    selectedTimeRangeText,
    timeRangeOptions
  }
}

export type InterviewMetricTone = 'blue' | 'green' | 'orange' | 'red'

export type InterviewActivityType = 'mock' | 'practice' | 'report' | 'library'

export type InterviewAnalyticsTimeRange = '7d' | '30d' | 'all'

export interface InterviewAnalyticsTimeRangeOption {
  value: InterviewAnalyticsTimeRange
  label: string
}

export interface InterviewMetricCard {
  key: string
  label: string
  value: string
  trendText?: string
  tone?: InterviewMetricTone
}

export interface InterviewAbilityMetric {
  name: string
  value: number
  max: number
}

export interface InterviewScorePoint {
  label: string
  score: number
  completedAt?: string
}

export interface InterviewDistributionItem {
  name: string
  value: number
}

export interface InterviewActivityItem {
  id: string
  title: string
  description?: string
  timeText: string
  type?: InterviewActivityType
}

export interface InterviewWeaknessRankItem {
  name: string
  value: number
  detail?: string
  tone?: InterviewMetricTone
}

export interface InterviewTrainingHeatmapDay {
  date: string
  label: string
  value: number
}

export interface InterviewAnalyticsDashboardData {
  metrics: InterviewMetricCard[]
  abilityRadar: InterviewAbilityMetric[]
  scoreTrend: InterviewScorePoint[]
  /** 训练主题分布：Vue 3 / TypeScript / 浏览器等 */
  topicDistribution: InterviewDistributionItem[]
  /** 专项题型分布：概念理解 / 代码分析 / 场景追问 */
  practiceQuestionTypeDistribution: InterviewDistributionItem[]
  weaknessRanking?: InterviewWeaknessRankItem[]
  trainingHeatmap?: InterviewTrainingHeatmapDay[]
  activityFeed?: InterviewActivityItem[]
}

export interface InterviewAnalyticsChartClickPayload {
  chartId: string
  name?: string
  value?: unknown
  dataIndex?: number
}

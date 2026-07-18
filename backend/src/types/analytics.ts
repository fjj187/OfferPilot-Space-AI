export type AnalyticsTimeRange = '7d' | '30d' | 'all'

export type AnalyticsMetricTone = 'blue' | 'green' | 'orange' | 'red'

export type AnalyticsActivityType = 'mock' | 'practice' | 'report' | 'library'

export interface AnalyticsSummaryMetricDto {
  key: string
  label: string
  value: string
  trendText?: string
  tone?: AnalyticsMetricTone
}

export interface AnalyticsAbilityMetricDto {
  name: string
  value: number
  max: number
}

export interface AnalyticsScorePointDto {
  label: string
  score: number
  completedAt?: string
}

export interface AnalyticsDistributionDto {
  name: string
  value: number
}

export interface AnalyticsWeaknessRankDto {
  name: string
  value: number
  detail?: string
  tone?: AnalyticsMetricTone
}

export interface AnalyticsHeatmapDayDto {
  date: string
  label: string
  value: number
}

export interface AnalyticsActivityDto {
  id: string
  title: string
  description?: string
  timeText: string
  type?: AnalyticsActivityType
}

export interface AnalyticsOverviewResponse {
  summary: AnalyticsSummaryMetricDto[]
  scoreTrend: AnalyticsScorePointDto[]
  abilityRadar: AnalyticsAbilityMetricDto[]
  topicDistribution: AnalyticsDistributionDto[]
  practiceQuestionTypeDistribution: AnalyticsDistributionDto[]
  weaknessRanking: AnalyticsWeaknessRankDto[]
  trainingHeatmap: AnalyticsHeatmapDayDto[]
  activityFeed: AnalyticsActivityDto[]
  aiSummary?: string
  generatedAt: string
}

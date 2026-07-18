import type {
  InterviewActivityType,
  InterviewAnalyticsDashboardData,
  InterviewAnalyticsTimeRange,
  InterviewMetricTone
} from '@/types/interview-analytics'

export interface AnalyticsOverviewRequestParams {
  range: InterviewAnalyticsTimeRange
}

export interface AnalyticsSummaryMetricDto {
  key: string
  label: string
  value: string
  trendText?: string
  tone?: InterviewMetricTone
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
  tone?: InterviewMetricTone
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
  type?: InterviewActivityType
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

export type AnalyticsOverviewSource = 'remote' | 'local' | 'demo'

export interface AnalyticsOverviewViewModel {
  dashboardData?: InterviewAnalyticsDashboardData
  source: AnalyticsOverviewSource
  generatedAt?: string
}

import type {
  AnalyticsOverviewResponse,
  AnalyticsOverviewViewModel
} from '@/types/analytics'

export const hasRemoteAnalyticsData = (response: AnalyticsOverviewResponse) => (
  response.summary.length > 0
  || response.scoreTrend.length > 0
  || response.abilityRadar.length > 0
  || response.topicDistribution.length > 0
  || response.practiceQuestionTypeDistribution.length > 0
  || response.weaknessRanking.length > 0
  || response.trainingHeatmap.length > 0
  || response.activityFeed.length > 0
)

export const mapAnalyticsOverviewToViewModel = (
  response: AnalyticsOverviewResponse
): AnalyticsOverviewViewModel => ({
  source: 'remote',
  generatedAt: response.generatedAt,
  dashboardData: hasRemoteAnalyticsData(response)
    ? {
      metrics: response.summary,
      scoreTrend: response.scoreTrend,
      abilityRadar: response.abilityRadar,
      topicDistribution: response.topicDistribution,
      practiceQuestionTypeDistribution: response.practiceQuestionTypeDistribution,
      weaknessRanking: response.weaknessRanking,
      trainingHeatmap: response.trainingHeatmap,
      activityFeed: response.activityFeed
    }
    : undefined
})

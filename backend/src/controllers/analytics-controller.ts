import type { Request, Response } from 'express'
import { AnalyticsService } from '../services/analytics-service.js'
import type { AnalyticsTimeRange } from '../types/analytics.js'

const analyticsService = new AnalyticsService()

const getSingleQueryParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] || '' : value || ''

const isAnalyticsTimeRange = (value: string): value is AnalyticsTimeRange => {
  return value === '7d' || value === '30d' || value === 'all'
}

const resolveAnalyticsOwnerScope = (request: Request) => {
  if (request.authUser?.role === 'admin') {
    return {
      role: 'admin' as const
    }
  }

  if (request.authUser?.role === 'user') {
    return {
      role: 'user' as const,
      username: request.authUser.username
    }
  }

  return undefined
}

export const getAnalyticsOverviewController = (request: Request, response: Response) => {
  const queryRange = getSingleQueryParam(request.query.range as string | string[] | undefined)
  const range = isAnalyticsTimeRange(queryRange) ? queryRange : '30d'

  response.json(analyticsService.getOverview(range, resolveAnalyticsOwnerScope(request)))
}

import type { AxiosRequestConfig } from 'axios'

import request from '@/services/http/request'
import type {
  AnalyticsOverviewRequestParams,
  AnalyticsOverviewResponse
} from '@/types/analytics'

const ANALYTICS_API_NO_RETRY_CONFIG: AxiosRequestConfig['retry'] = {
  maxRetries: 0
}

const resolveAnalyticsApiBase = () => {
  const configuredBase = import.meta.env.VITE_ANALYTICS_API_BASE_URL?.trim() || ''
  if (configuredBase) return configuredBase.replace(/\/$/, '')
  if (import.meta.env.DEV) {
    return `${ window.location.origin }/api/analytics`
  }
  return ''
}

const normalizeApiPath = (apiBase: string, path: string) => `${ apiBase }${ path }`

const createAnalyticsApiError = (message: string) => new Error(message)

export const isAnalyticsOverviewApiAvailable = () => Boolean(resolveAnalyticsApiBase())

export const fetchAnalyticsOverview = async (params: AnalyticsOverviewRequestParams) => {
  const apiBase = resolveAnalyticsApiBase()
  if (!apiBase) {
    throw createAnalyticsApiError('Analytics API is not configured.')
  }

  const response = await request.get(
    normalizeApiPath(apiBase, '/overview'),
    params,
    {
      retry: ANALYTICS_API_NO_RETRY_CONFIG,
      requestName: 'fetchAnalyticsOverview'
    }
  )

  if (response.error !== 0) {
    throw createAnalyticsApiError(response.msg || `Analytics API request failed: ${ response.error }`)
  }

  return response.data as AnalyticsOverviewResponse
}

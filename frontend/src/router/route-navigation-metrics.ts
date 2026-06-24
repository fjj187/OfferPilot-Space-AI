import type { RouteLocationNormalized } from 'vue-router'

const ROUTE_METRICS_WINDOW_MS = 10_000

interface RouteNavigationMetricsState {
  authProbeAttempts: number[]
  redirectDecisions: number[]
  notFoundHits: number[]
  routeTransitions: number[]
}

const routeNavigationMetricsState: RouteNavigationMetricsState = {
  authProbeAttempts: [],
  redirectDecisions: [],
  notFoundHits: [],
  routeTransitions: []
}

const trimMetricsWindow = (timestamps: number[], now: number) => {
  return timestamps.filter(item => now - item <= ROUTE_METRICS_WINDOW_MS)
}

const pushMetric = (key: keyof RouteNavigationMetricsState) => {
  const now = Date.now()
  routeNavigationMetricsState[key] = trimMetricsWindow(routeNavigationMetricsState[key], now)
  routeNavigationMetricsState[key].push(now)
}

export const recordAuthProbeAttempt = () => {
  pushMetric('authProbeAttempts')
}

export const recordGuardRedirect = () => {
  pushMetric('redirectDecisions')
}

export const recordRouteTransition = () => {
  pushMetric('routeTransitions')
}

export const recordNotFoundRouteHit = () => {
  pushMetric('notFoundHits')
}

export const collectRouteNavigationMetrics = () => {
  const now = Date.now()
  return {
    windowMs: ROUTE_METRICS_WINDOW_MS,
    authProbeAttempts: trimMetricsWindow(routeNavigationMetricsState.authProbeAttempts, now).length,
    redirectDecisions: trimMetricsWindow(routeNavigationMetricsState.redirectDecisions, now).length,
    notFoundHits: trimMetricsWindow(routeNavigationMetricsState.notFoundHits, now).length,
    routeTransitions: trimMetricsWindow(routeNavigationMetricsState.routeTransitions, now).length
  }
}

export const resetRouteNavigationMetrics = () => {
  routeNavigationMetricsState.authProbeAttempts = []
  routeNavigationMetricsState.redirectDecisions = []
  routeNavigationMetricsState.notFoundHits = []
  routeNavigationMetricsState.routeTransitions = []
}

export const classifyNotFoundRoute = (to: RouteLocationNormalized) => {
  return to.matched.length === 1 && to.name === '404'
}

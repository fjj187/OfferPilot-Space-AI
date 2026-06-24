import type { RouteLocationNormalizedLoaded, RouteLocationRaw } from 'vue-router'

const ROUTE_PARAM_RECOVERY_STORAGE_KEY = 'offerpilot:route-param-recovery'

interface PersistedRouteParamContext {
  path: string
  name?: string
  params: Record<string, string>
  recordedAt: string
}

const normalizeParamsRecord = (params: RouteLocationNormalizedLoaded['params']) => {
  return Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
    if (Array.isArray(value)) {
      if (value[0]) acc[key] = String(value[0])
      return acc
    }
    if (value == null || value === '') return acc
    acc[key] = String(value)
    return acc
  }, {})
}

const readRouteParamRecoveryContext = () => {
  if (typeof window === 'undefined') return null

  const raw = window.sessionStorage.getItem(ROUTE_PARAM_RECOVERY_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as PersistedRouteParamContext
  } catch {
    window.sessionStorage.removeItem(ROUTE_PARAM_RECOVERY_STORAGE_KEY)
    return null
  }
}

export const persistRouteParamRecoveryContext = (to: RouteLocationNormalizedLoaded) => {
  if (typeof window === 'undefined') return
  if (!to.matched.some(record => record.meta.persistParams)) return

  const params = normalizeParamsRecord(to.params)
  if (!Object.keys(params).length) return

  const payload: PersistedRouteParamContext = {
    path: to.path,
    name: typeof to.name === 'string' ? to.name : undefined,
    params,
    recordedAt: new Date().toISOString()
  }

  window.sessionStorage.setItem(ROUTE_PARAM_RECOVERY_STORAGE_KEY, JSON.stringify(payload))
}

export const clearRouteParamRecoveryContext = () => {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(ROUTE_PARAM_RECOVERY_STORAGE_KEY)
}

export const resolveRecoveredRouteLocation = (to: RouteLocationNormalizedLoaded): RouteLocationRaw | null => {
  if (!to.matched.some(record => record.meta.persistParams)) return null
  if (Object.keys(normalizeParamsRecord(to.params)).length) return null

  const recovered = readRouteParamRecoveryContext()
  if (!recovered) return null

  const sameName = recovered.name && to.name && recovered.name === to.name
  const samePath = recovered.path === to.path
  if (!sameName && !samePath) return null

  return {
    name: recovered.name || undefined,
    path: recovered.name ? undefined : recovered.path,
    params: recovered.params,
    query: to.query,
    hash: to.hash,
    replace: true
  }
}

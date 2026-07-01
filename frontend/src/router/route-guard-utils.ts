import {
  ADMIN_LOGIN_ROUTE_NAME,
  LOGIN_ROUTE_NAME
} from '@/config/product'
import { clearAuthToken, getAuthToken } from '@/services/auth/auth-api'
import {
  clearAuthSession,
  getAuthSession,
  isAuthenticated
} from '@/services/storage/auth-storage'
import { resolveSafeRedirect } from '@/utils/auth/resolve-safe-redirect'
import type { RouteLocationNormalizedLoaded, RouteLocationRaw } from 'vue-router'

const AUTH_PROBE_COOLDOWN_MS = 5000

const publicRouteNames = new Set([
  'Login',
  'AdminLogin',
  '404'
])

let lastAuthProbeFailedAt = 0

export const isPublicRoute = (to: RouteLocationNormalizedLoaded) => {
  if (to.matched.some(record => record.meta.public)) return true
  return typeof to.name === 'string' && publicRouteNames.has(to.name)
}

export const isAdminRoute = (path: string) => path === '/admin' || path.startsWith('/admin/')

export const clearClientAuthState = () => {
  clearAuthSession()
  clearAuthToken()
}

export const hasUsableAuthState = () => isAuthenticated() && Boolean(getAuthToken())

export const shouldSkipAuthProbe = () => {
  if (!isAuthenticated()) return true
  if (!getAuthToken()) {
    clearAuthSession()
    return true
  }
  // 演示环境占位 token，无需向远端探活
  if (getAuthToken() === 'demo') return true

  return Date.now() - lastAuthProbeFailedAt < AUTH_PROBE_COOLDOWN_MS
}

export const markAuthProbeFailed = () => {
  lastAuthProbeFailedAt = Date.now()
}

export const markAuthProbeSucceeded = () => {
  lastAuthProbeFailedAt = 0
}

export const getStoredAuthSnapshot = () => getAuthSession()

export const buildUnauthenticatedRedirect = (to: RouteLocationNormalizedLoaded): RouteLocationRaw => {
  const redirect = resolveSafeRedirect(to.fullPath)
  const loginRouteName = isAdminRoute(to.path) ? ADMIN_LOGIN_ROUTE_NAME : LOGIN_ROUTE_NAME

  return {
    name: loginRouteName,
    ...(redirect
      ? {
          query: {
            redirect
          }
        }
      : {}),
    replace: true
  }
}

export const buildForbiddenRedirect = (to: RouteLocationNormalizedLoaded): RouteLocationRaw => {
  if (isAdminRoute(to.path)) {
    return {
      name: ADMIN_LOGIN_ROUTE_NAME,
      query: {
        redirect: to.fullPath
      },
      replace: true
    }
  }

  const fallbackRedirect = resolveSafeRedirect(to.query.redirect) || undefined

  return fallbackRedirect
    ? {
        path: fallbackRedirect,
        replace: true
      }
    : {
        name: LOGIN_ROUTE_NAME,
        replace: true
      }
}

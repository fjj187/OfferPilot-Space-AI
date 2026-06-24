import {
  ADMIN_LOGIN_ROUTE_NAME,
  ADMIN_DASHBOARD_ROUTE_NAME,
  DEFAULT_APP_ROUTE_NAME
} from '@/config/product'
import { fetchCurrentAuthSession } from '@/services/auth/auth-api'
import { ensureDynamicRoutesReady } from '@/router/dynamic-route-manager'
import {
  classifyNotFoundRoute,
  recordAuthProbeAttempt,
  recordGuardRedirect,
  recordNotFoundRouteHit,
  recordRouteTransition
} from '@/router/route-navigation-metrics'
import {
  persistRouteParamRecoveryContext,
  resolveRecoveredRouteLocation
} from '@/router/route-param-recovery'
import {
  buildForbiddenRedirect,
  buildUnauthenticatedRedirect,
  clearClientAuthState,
  getStoredAuthSnapshot,
  isAdminRoute,
  isPublicRoute,
  markAuthProbeFailed,
  markAuthProbeSucceeded,
  shouldSkipAuthProbe
} from '@/router/route-guard-utils'
import { resolveSafeRedirect } from '@/utils/auth/resolve-safe-redirect'
import NProgress from 'nprogress'
import type { Router } from 'vue-router'

NProgress.configure({
  showSpinner: false
})

export function createRouterGuards(router: Router) {
  router.beforeEach(async (to) => {
    NProgress.start()

    const metaRecords = to.matched.map(record => record.meta)
    const requiresAuth = metaRecords.some(meta => meta.requiresAuth)
    const guestOnly = metaRecords.some(meta => meta.guestOnly)
    const requiredRole = metaRecords.find(meta => meta.requiredRole)?.requiredRole
    const hasDynamicRoute = metaRecords.some(meta => meta.dynamic)
      || (isAdminRoute(to.path) && to.matched.length <= 1)

    const recoveredLocation = resolveRecoveredRouteLocation(to)
    if (recoveredLocation) {
      recordGuardRedirect()
      return recoveredLocation
    }

    if (hasDynamicRoute) {
      await ensureDynamicRoutesReady(router)
    }

    if (isPublicRoute(to) && !guestOnly && !requiresAuth) {
      return true
    }

    let session = getStoredAuthSnapshot()
    let authenticated = Boolean(session?.username)

    if (requiresAuth && authenticated && !shouldSkipAuthProbe()) {
      try {
        recordAuthProbeAttempt()
        const latestSession = await fetchCurrentAuthSession()
        if (latestSession) {
          session = latestSession
          authenticated = true
          markAuthProbeSucceeded()
        }
        else {
          clearClientAuthState()
          markAuthProbeFailed()
          authenticated = false
          session = null
        }
      }
      catch {
        clearClientAuthState()
        markAuthProbeFailed()
        authenticated = false
        session = null
      }
    }
    else if (requiresAuth && authenticated && shouldSkipAuthProbe()) {
      session = getStoredAuthSnapshot()
      authenticated = Boolean(session?.username)
    }

    if (requiresAuth && shouldSkipAuthProbe() && !authenticated) {
      clearClientAuthState()
      authenticated = false
      session = null
    }

    if (requiresAuth && !authenticated) {
      recordGuardRedirect()
      return buildUnauthenticatedRedirect(to)
    }

    if (requiredRole && session?.role !== requiredRole) {
      recordGuardRedirect()
      return buildForbiddenRedirect(to)
    }

    if (guestOnly && authenticated && to.path !== '/') {
      const redirect = resolveSafeRedirect(to.query.redirect)
      recordGuardRedirect()
      return redirect
        ? {
            path: redirect,
            replace: true
          }
        : to.name === ADMIN_LOGIN_ROUTE_NAME && session?.role === 'admin'
          ? {
              name: ADMIN_DASHBOARD_ROUTE_NAME,
              replace: true
            }
        : {
            name: DEFAULT_APP_ROUTE_NAME,
            replace: true
          }
    }

    return true
  })

  router.afterEach((to) => {
    recordRouteTransition()
    persistRouteParamRecoveryContext(to)
    if (classifyNotFoundRoute(to)) {
      recordNotFoundRouteHit()
    }
    NProgress.done()
  })
}

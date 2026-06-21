import {
  ADMIN_DASHBOARD_ROUTE_NAME,
  ADMIN_LOGIN_ROUTE_NAME,
  DEFAULT_APP_ROUTE_NAME,
  LEGACY_WORKBENCH_ENABLED,
  LOGIN_ROUTE_NAME
} from '@/config/product'
import { fetchCurrentAuthSession } from '@/services/auth/auth-api'
import { getAuthSession, isAuthenticated } from '@/services/storage/auth-storage'
import { resolveSafeRedirect } from '@/utils/auth/resolve-safe-redirect'
import NProgress from 'nprogress'
import type { Router } from 'vue-router'

NProgress.configure({
  showSpinner: false
})

function isLegacyWorkbenchRoute(path: string) {
  return path === '/workspace' || path.startsWith('/workspace/')
}

function isAdminRoute(path: string) {
  return path === '/admin' || path.startsWith('/admin/')
}

export function createRouterGuards(router: Router) {
  router.beforeEach(async (to) => {
    NProgress.start()

    if (!LEGACY_WORKBENCH_ENABLED && isLegacyWorkbenchRoute(to.path)) {
      return {
        name: DEFAULT_APP_ROUTE_NAME,
        replace: true
      }
    }

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const guestOnly = to.matched.some(record => record.meta.guestOnly)
    const requiredRole = to.matched.find(record => record.meta.requiredRole)?.meta.requiredRole
    let authenticated = isAuthenticated()
    let session = getAuthSession()

    if (requiresAuth && authenticated) {
      try {
        const latestSession = await fetchCurrentAuthSession()
        if (latestSession) {
          session = latestSession
        }
        else {
          authenticated = false
          session = null
        }
      }
      catch {
        authenticated = false
        session = null
      }
    }

    if (requiresAuth && !authenticated) {
      const redirect = resolveSafeRedirect(to.fullPath)
      return {
        name: isAdminRoute(to.path) ? ADMIN_LOGIN_ROUTE_NAME : LOGIN_ROUTE_NAME,
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

    if (requiredRole && session?.role !== requiredRole) {
      return {
        name: isAdminRoute(to.path) ? ADMIN_LOGIN_ROUTE_NAME : DEFAULT_APP_ROUTE_NAME,
        query: {
          redirect: to.fullPath
        },
        replace: true
      }
    }

    if (guestOnly && authenticated) {
      const redirect = resolveSafeRedirect(to.query.redirect)
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

  router.afterEach(() => {
    NProgress.done()
  })
}

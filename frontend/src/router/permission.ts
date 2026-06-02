import { DEFAULT_APP_ROUTE_NAME, LEGACY_WORKBENCH_ENABLED, LOGIN_ROUTE_NAME } from '@/config/product'
import { isAuthenticated } from '@/services/storage/auth-storage'
import { resolveSafeRedirect } from '@/utils/auth/resolve-safe-redirect'
import NProgress from 'nprogress'
import type { Router } from 'vue-router'

NProgress.configure({
  showSpinner: false
})

function isLegacyWorkbenchRoute(path: string) {
  return path === '/workspace' || path.startsWith('/workspace/')
}

export function createRouterGuards(router: Router) {
  router.beforeEach((to) => {
    NProgress.start()

    if (!LEGACY_WORKBENCH_ENABLED && isLegacyWorkbenchRoute(to.path)) {
      return {
        name: DEFAULT_APP_ROUTE_NAME,
        replace: true
      }
    }

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const guestOnly = to.matched.some(record => record.meta.guestOnly)
    const authenticated = isAuthenticated()

    if (requiresAuth && !authenticated) {
      const redirect = resolveSafeRedirect(to.fullPath)
      return {
        name: LOGIN_ROUTE_NAME,
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

    if (guestOnly && authenticated) {
      const redirect = resolveSafeRedirect(to.query.redirect)
      return redirect
        ? {
            path: redirect,
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

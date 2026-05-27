import { DEFAULT_APP_ROUTE_NAME, LEGACY_WORKBENCH_ENABLED } from '@/config/product'
import NProgress from 'nprogress'
import type { Router } from 'vue-router'

NProgress.configure({
  showSpinner: false
})

function isLegacyWorkbenchRoute(path: string) {
  return path === '/workspace' || path.startsWith('/workspace/')
}

export function createRouterGuards(router: Router) {

  router.beforeEach(async (to, from, next) => {

    NProgress.start()

    if (!LEGACY_WORKBENCH_ENABLED && isLegacyWorkbenchRoute(to.path)) {
      next({
        name: DEFAULT_APP_ROUTE_NAME,
        replace: true
      })
      return
    }

    next()
  })

  router.afterEach(() => {
    NProgress.done()
  })
}

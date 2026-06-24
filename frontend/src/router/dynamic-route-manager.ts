import type { RouteRecordRaw, Router } from 'vue-router'

interface DynamicRouteManagerState {
  ready: boolean
  loading: boolean
  loadCount: number
  lastReadyAt: number
  registeredRouteNames: string[]
}

const dynamicRouteManagerState: DynamicRouteManagerState = {
  ready: false,
  loading: false,
  loadCount: 0,
  lastReadyAt: 0,
  registeredRouteNames: []
}

let ensureDynamicRoutesReadyTask: Promise<void> | null = null

const dynamicAdminChildRoutes: RouteRecordRaw[] = [
  {
    path: 'sessions/:sessionId/:threadId',
    name: 'AdminSessionDetail',
    meta: {
      public: false,
      requiresAuth: true,
      requiredRole: 'admin',
      dynamic: true,
      preserveQuery: true,
      persistParams: true,
      title: '会话详情'
    },
    component: () => import('@/views/admin/sessions.vue')
  },
  {
    path: 'reports/:sessionId',
    name: 'AdminReportDetail',
    meta: {
      public: false,
      requiresAuth: true,
      requiredRole: 'admin',
      dynamic: true,
      preserveQuery: true,
      persistParams: true,
      title: '报告详情'
    },
    component: () => import('@/views/admin/reports.vue')
  }
]

const registerDynamicAdminRoutes = (router: Router) => {
  const registeredRouteNames = new Set(dynamicRouteManagerState.registeredRouteNames)

  for (const routeRecord of dynamicAdminChildRoutes) {
    const routeName = typeof routeRecord.name === 'string' ? routeRecord.name : ''
    if (!routeName || router.hasRoute(routeName)) continue

    router.addRoute('AdminRoot', routeRecord)
    registeredRouteNames.add(routeName)
  }

  dynamicRouteManagerState.registeredRouteNames = [...registeredRouteNames]
}

/**
 * 当前先把后台详情型路由统一收口到这里注册，避免后续动态菜单、
 * 详情直链和守卫补注册逻辑重新散回 permission 文件。
 */
export const ensureDynamicRoutesReady = async (router: Router) => {
  if (dynamicRouteManagerState.ready) return
  if (ensureDynamicRoutesReadyTask) {
    await ensureDynamicRoutesReadyTask
    return
  }

  dynamicRouteManagerState.loading = true
  ensureDynamicRoutesReadyTask = Promise.resolve().then(() => {
    registerDynamicAdminRoutes(router)
    dynamicRouteManagerState.ready = true
    dynamicRouteManagerState.loadCount += 1
    dynamicRouteManagerState.lastReadyAt = Date.now()
  }).finally(() => {
    dynamicRouteManagerState.loading = false
    ensureDynamicRoutesReadyTask = null
  })

  await ensureDynamicRoutesReadyTask
}

export const resetDynamicRoutesReadyState = (router?: Router) => {
  if (router) {
    for (const routeName of dynamicRouteManagerState.registeredRouteNames) {
      if (router.hasRoute(routeName)) {
        router.removeRoute(routeName)
      }
    }
  }

  dynamicRouteManagerState.ready = false
  dynamicRouteManagerState.loading = false
  dynamicRouteManagerState.registeredRouteNames = []
  ensureDynamicRoutesReadyTask = null
}

export const isDynamicRoutesReady = () => dynamicRouteManagerState.ready

export const getDynamicRouteManagerSnapshot = () => ({
  ...dynamicRouteManagerState
})

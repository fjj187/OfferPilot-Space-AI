const WorkbenchLayout = () => import('@/views/workbench/layout.vue')

/** legacy 工作台路由元信息：保留代码，默认由路由守卫拦截 */
const legacyWorkbenchMeta = {
  legacy: true,
  hidden: true
} as const

const childrenRoutes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    meta: {
      guestOnly: true,
      title: '登录'
    },
    component: () => import('@/views/login.vue')
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    meta: {
      title: '后台登录'
    },
    component: () => import('@/views/admin/login.vue')
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/layout.vue'),
    name: 'AdminRoot',
    meta: {
      requiresAuth: true,
      requiredRole: 'admin',
      title: '后台管理'
    },
    redirect: {
      name: 'AdminDashboard'
    },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        meta: {
          requiresAuth: true,
          requiredRole: 'admin',
          title: '数据看板'
        },
        component: () => import('@/views/admin/dashboard.vue')
      },
      {
        path: 'sessions',
        name: 'AdminSessions',
        meta: {
          requiresAuth: true,
          requiredRole: 'admin',
          title: '会话管理'
        },
        component: () => import('@/views/admin/sessions.vue')
      },
      {
        path: 'reports',
        name: 'AdminReports',
        meta: {
          requiresAuth: true,
          requiredRole: 'admin',
          title: '报告管理'
        },
        component: () => import('@/views/admin/reports.vue')
      }
    ]
  },
  {
    path: '/workspace',
    component: WorkbenchLayout,
    name: 'WorkbenchRoot',
    meta: legacyWorkbenchMeta,
    redirect: {
      name: 'WorkbenchOverview'
    },
    children: [
      {
        path: 'overview',
        name: 'WorkbenchOverview',
        meta: legacyWorkbenchMeta,
        component: () => import('@/views/workbench/overview.vue')
      },
      {
        path: 'library',
        name: 'WorkbenchLibrary',
        meta: legacyWorkbenchMeta,
        component: () => import('@/views/workbench/library.vue')
      },
      {
        path: 'mock-interview',
        name: 'WorkbenchMockInterview',
        meta: legacyWorkbenchMeta,
        component: () => import('@/views/workbench/mock-interview.vue')
      },
      {
        path: 'practice',
        name: 'WorkbenchPractice',
        meta: legacyWorkbenchMeta,
        component: () => import('@/views/workbench/practice.vue')
      },
      {
        path: 'report',
        name: 'WorkbenchReport',
        meta: legacyWorkbenchMeta,
        component: () => import('@/views/workbench/report.vue')
      },
      {
        path: 'history',
        name: 'WorkbenchHistory',
        meta: legacyWorkbenchMeta,
        component: () => import('@/views/workbench/history.vue')
      }
    ]
  },
  {
    path: '/showcase/space-odyssey',
    name: 'SpaceOdysseyShowcase',
    component: () => import('@/views/showcase/space-odyssey.vue')
  },
  {
    path: '/showcase/mock-interview-space',
    name: 'MockInterviewSpaceShowcase',
    meta: {
      requiresAuth: true,
      title: '宇宙模拟面试'
    },
    component: () => import('@/views/showcase/mock-interview-space.vue')
  },
  {
    path: '/chat',
    name: 'ChatRoot',
    component: () => import('@/views/chat.vue')
  }
]

export default childrenRoutes

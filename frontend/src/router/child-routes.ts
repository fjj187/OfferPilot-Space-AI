import type { RouteRecordRaw } from 'vue-router'

const childrenRoutes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    meta: {
      public: true,
      guestOnly: true,
      requiresAuth: false,
      preserveQuery: true,
      title: '登录'
    },
    component: () => import('@/views/login.vue')
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    meta: {
      public: true,
      guestOnly: true,
      requiresAuth: false,
      preserveQuery: true,
      title: '后台登录'
    },
    component: () => import('@/views/admin/login.vue')
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/layout.vue'),
    name: 'AdminRoot',
    meta: {
      public: false,
      requiresAuth: true,
      requiredRole: 'admin',
      dynamic: false,
      preserveQuery: true,
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
          public: false,
          requiresAuth: true,
          requiredRole: 'admin',
          dynamic: false,
          preserveQuery: true,
          title: '数据看板'
        },
        component: () => import('@/views/admin/dashboard.vue')
      },
      {
        path: 'sessions',
        name: 'AdminSessions',
        meta: {
          public: false,
          requiresAuth: true,
          requiredRole: 'admin',
          dynamic: false,
          preserveQuery: true,
          title: '会话管理'
        },
        component: () => import('@/views/admin/sessions.vue')
      },
      {
        path: 'reports',
        name: 'AdminReports',
        meta: {
          public: false,
          requiresAuth: true,
          requiredRole: 'admin',
          dynamic: false,
          preserveQuery: true,
          title: '报告管理'
        },
        component: () => import('@/views/admin/reports.vue')
      },
      {
        path: 'models',
        name: 'AdminModels',
        meta: {
          public: false,
          requiresAuth: true,
          requiredRole: 'admin',
          dynamic: false,
          preserveQuery: true,
          title: '模型管理'
        },
        component: () => import('@/views/admin/models.vue')
      }
    ]
  },
  {
    path: '/showcase/space-odyssey',
    name: 'SpaceOdysseyShowcase',
    meta: {
      public: true,
      requiresAuth: false,
      preserveQuery: true
    },
    component: () => import('@/views/showcase/space-odyssey.vue')
  },
  {
    path: '/showcase/mock-interview-space',
    name: 'MockInterviewSpaceShowcase',
    meta: {
      public: false,
      requiresAuth: true,
      preserveQuery: true,
      title: '宇宙模拟面试'
    },
    component: () => import('@/views/showcase/mock-interview-space.vue')
  },
  {
    path: '/chat',
    name: 'ChatRoot',
    meta: {
      public: true,
      requiresAuth: false,
      preserveQuery: true
    },
    component: () => import('@/views/chat.vue')
  }
]

export default childrenRoutes

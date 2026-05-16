const WorkbenchLayout = () => import('@/views/workbench/layout.vue')

const childrenRoutes: Array<RouteRecordRaw> = [
  {
    path: '/workspace',
    component: WorkbenchLayout,
    name: 'WorkbenchRoot',
    redirect: {
      name: 'WorkbenchOverview'
    },
    children: [
      {
        path: 'overview',
        name: 'WorkbenchOverview',
        component: () => import('@/views/workbench/overview.vue')
      },
      {
        path: 'library',
        name: 'WorkbenchLibrary',
        component: () => import('@/views/workbench/library.vue')
      },
      {
        path: 'mock-interview',
        name: 'WorkbenchMockInterview',
        component: () => import('@/views/workbench/mock-interview.vue')
      },
      {
        path: 'practice',
        name: 'WorkbenchPractice',
        component: () => import('@/views/workbench/practice.vue')
      },
      {
        path: 'report',
        name: 'WorkbenchReport',
        component: () => import('@/views/workbench/report.vue')
      },
      {
        path: 'history',
        name: 'WorkbenchHistory',
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
    component: () => import('@/views/showcase/mock-interview-space.vue')
  },
  {
    path: '/chat',
    name: 'ChatRoot',
    redirect: '/workspace/overview'
  }
]

export default childrenRoutes

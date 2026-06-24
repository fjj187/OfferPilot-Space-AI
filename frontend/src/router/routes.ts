import { LOGIN_ROUTE_NAME } from '@/config/product'
import childRoutes from '@/router/child-routes'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Root',
    meta: {
      public: true,
      requiresAuth: false,
      preserveQuery: true
    },
    redirect: {
      name: LOGIN_ROUTE_NAME
    }
  },
  ...childRoutes,
  {
    path: '/:pathMatch(.*)',
    name: '404',
    meta: {
      public: true,
      requiresAuth: false,
      preserveQuery: true
    },
    component: () => import('@/components/404.vue')
  }
]

export default routes

import { LOGIN_ROUTE_NAME } from '@/config/product'
import childRoutes from '@/router/child-routes'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Root',
    redirect: {
      name: LOGIN_ROUTE_NAME
    }
  },
  ...childRoutes,
  {
    path: '/:pathMatch(.*)',
    name: '404',
    component: () => import('@/components/404.vue')
  }
]

export default routes

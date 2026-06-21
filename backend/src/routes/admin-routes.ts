import { Router } from 'express'
import {
  getAdminDashboardController,
  listAdminReportsController,
  listAdminSessionsController
} from '../controllers/admin-controller.js'
import { requireAuth, requireRole } from '../middlewares/auth-middleware.js'

export const adminRouter = Router()

adminRouter.use(requireAuth, requireRole('admin'))
adminRouter.get('/dashboard', getAdminDashboardController)
adminRouter.get('/sessions', listAdminSessionsController)
adminRouter.get('/reports', listAdminReportsController)

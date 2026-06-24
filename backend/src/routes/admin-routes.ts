import { Router } from 'express'
import {
  createAdminModelController,
  getAdminDashboardController,
  listAdminModelsController,
  listAdminReportsController,
  listAdminSessionsController,
  testAdminModelController,
  updateAdminModelController,
  updateAdminModelDefaultController,
  updateAdminModelStatusController
} from '../controllers/admin-controller.js'
import { requireAuth, requireRole } from '../middlewares/auth-middleware.js'

export const adminRouter = Router()

adminRouter.use(requireAuth, requireRole('admin'))
adminRouter.get('/dashboard', getAdminDashboardController)
adminRouter.get('/sessions', listAdminSessionsController)
adminRouter.get('/reports', listAdminReportsController)
adminRouter.get('/models', listAdminModelsController)
adminRouter.post('/models', createAdminModelController)
adminRouter.put('/models/:modelId', updateAdminModelController)
adminRouter.patch('/models/:modelId/status', updateAdminModelStatusController)
adminRouter.patch('/models/:modelId/default', updateAdminModelDefaultController)
adminRouter.post('/models/:modelId/test', testAdminModelController)

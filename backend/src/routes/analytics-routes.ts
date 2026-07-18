import { Router } from 'express'
import { getAnalyticsOverviewController } from '../controllers/analytics-controller.js'
import { attachOptionalAuth } from '../middlewares/auth-middleware.js'

export const analyticsRouter = Router()

analyticsRouter.get('/overview', attachOptionalAuth, getAnalyticsOverviewController)

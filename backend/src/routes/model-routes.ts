import { Router } from 'express'
import { listEnabledModelsController } from '../controllers/admin-controller.js'

export const modelRouter = Router()

modelRouter.get('/enabled', listEnabledModelsController)

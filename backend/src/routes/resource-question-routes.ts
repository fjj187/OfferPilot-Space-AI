import { Router } from 'express'
import {
  analyzeResourceQuestionController,
  generateNextResourceQuestionController,
  generateRandomResourceQuestionController,
  getResourceQuestionMetaController
} from '../controllers/resource-question-controller.js'

export const resourceQuestionRouter = Router()

resourceQuestionRouter.post('/analyze', analyzeResourceQuestionController)
resourceQuestionRouter.get('/:resourceId/question-meta', getResourceQuestionMetaController)
resourceQuestionRouter.post('/question/random', generateRandomResourceQuestionController)
resourceQuestionRouter.post('/question/next', generateNextResourceQuestionController)

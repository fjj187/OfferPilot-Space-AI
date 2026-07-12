import type { Request, Response } from 'express'
import { ResourceQuestionService } from '../services/resource-question-service.js'

const resourceQuestionService = new ResourceQuestionService()

const sendSuccess = (response: Response, data: unknown) => {
  response.json({
    success: true,
    data
  })
}

const sendError = (response: Response, error: unknown) => {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: unknown }).code)
    : 'RESOURCE_QUESTION_ERROR'
  const message = error instanceof Error ? error.message : 'Resource question request failed.'

  response.status(400).json({
    success: false,
    code,
    message
  })
}

export const analyzeResourceQuestionController = async (request: Request, response: Response) => {
  try {
    const result = await resourceQuestionService.analyzeResource(request.body)
    sendSuccess(response, result)
  }
  catch (error) {
    sendError(response, error)
  }
}

export const getResourceQuestionMetaController = (request: Request, response: Response) => {
  try {
    const result = resourceQuestionService.getQuestionMeta(String(request.params.resourceId || '').trim())
    sendSuccess(response, result)
  }
  catch (error) {
    sendError(response, error)
  }
}

export const generateRandomResourceQuestionController = async (request: Request, response: Response) => {
  try {
    const result = await resourceQuestionService.generateRandomQuestion(request.body)
    sendSuccess(response, result)
  }
  catch (error) {
    sendError(response, error)
  }
}

export const generateNextResourceQuestionController = async (request: Request, response: Response) => {
  try {
    const result = await resourceQuestionService.generateNextQuestion(request.body)
    sendSuccess(response, result)
  }
  catch (error) {
    sendError(response, error)
  }
}

import type { Request, Response } from 'express'
import { AdminService } from '../services/admin-service.js'

const adminService = new AdminService()

const getSingleParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] || '' : value || ''

export const getAdminDashboardController = (_request: Request, response: Response) => {
  response.json(adminService.getDashboard())
}

export const listAdminSessionsController = (_request: Request, response: Response) => {
  response.json({
    sessions: adminService.listSessions()
  })
}

export const listAdminReportsController = (_request: Request, response: Response) => {
  response.json({
    reports: adminService.listReports()
  })
}

export const listAdminModelsController = (_request: Request, response: Response) => {
  response.json({
    models: adminService.listModels()
  })
}

export const listEnabledModelsController = (_request: Request, response: Response) => {
  response.json({
    models: adminService.listEnabledModels()
  })
}

export const createAdminModelController = (request: Request, response: Response) => {
  try {
    response.json({
      model: adminService.createModel(request.body || {})
    })
  }
  catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : '模型创建失败'
    })
  }
}

export const updateAdminModelController = (request: Request, response: Response) => {
  try {
    response.json({
      model: adminService.updateModel(getSingleParam(request.params.modelId), request.body || {})
    })
  }
  catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : '模型更新失败'
    })
  }
}

export const updateAdminModelStatusController = (request: Request, response: Response) => {
  try {
    response.json({
      model: adminService.updateModelStatus(getSingleParam(request.params.modelId), Boolean(request.body?.enabled))
    })
  }
  catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : '模型状态更新失败'
    })
  }
}

export const updateAdminModelDefaultController = (request: Request, response: Response) => {
  try {
    response.json({
      model: adminService.setDefaultModel(getSingleParam(request.params.modelId))
    })
  }
  catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : '默认模型更新失败'
    })
  }
}

export const testAdminModelController = async (request: Request, response: Response) => {
  try {
    response.json({
      result: await adminService.testModel(getSingleParam(request.params.modelId))
    })
  }
  catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : '模型测试失败'
    })
  }
}

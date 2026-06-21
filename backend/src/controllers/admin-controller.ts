import type { Request, Response } from 'express'
import { AdminService } from '../services/admin-service.js'

const adminService = new AdminService()

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

import type { Request, Response } from 'express'
import { AuthService } from '../services/auth-service.js'

const authService = new AuthService()

export const loginController = (request: Request, response: Response) => {
  const result = authService.login(request.body)

  if (!result) {
    response.status(401).json({
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Invalid username or password.'
    })
    return
  }

  response.json(result)
}

export const meController = (request: Request, response: Response) => {
  if (!request.authUser) {
    response.status(401).json({
      code: 'AUTH_REQUIRED',
      message: 'Authentication required.'
    })
    return
  }

  response.json({
    user: request.authUser
  })
}

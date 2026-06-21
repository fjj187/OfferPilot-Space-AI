import type { NextFunction, Request, Response } from 'express'
import { AuthService } from '../services/auth-service.js'
import type { AuthRole } from '../types/auth.js'

const authService = new AuthService()

const extractBearerToken = (request: Request) => {
  const authorization = String(request.headers.authorization || '').trim()
  if (!authorization.startsWith('Bearer ')) return ''
  return authorization.slice('Bearer '.length).trim()
}

export const attachOptionalAuth = (request: Request, _response: Response, next: NextFunction) => {
  const user = authService.verifyToken(extractBearerToken(request))
  if (user) {
    request.authUser = user
  }
  next()
}

export const requireAuth = (request: Request, response: Response, next: NextFunction) => {
  const user = authService.verifyToken(extractBearerToken(request))

  if (!user) {
    response.status(401).json({
      code: 'AUTH_REQUIRED',
      message: 'Authentication required.'
    })
    return
  }

  request.authUser = user
  next()
}

export const requireRole = (role: AuthRole) => {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.authUser) {
      response.status(401).json({
        code: 'AUTH_REQUIRED',
        message: 'Authentication required.'
      })
      return
    }

    if (request.authUser.role !== role) {
      response.status(403).json({
        code: 'AUTH_FORBIDDEN',
        message: `Role ${ role } required.`
      })
      return
    }

    next()
  }
}

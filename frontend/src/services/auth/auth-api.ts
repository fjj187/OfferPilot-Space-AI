import Cookie from 'js-cookie'
import type { AxiosRequestConfig } from 'axios'
import request from '@/utils/request'
import type { AuthRole, AuthSession } from '@/services/storage/auth-storage'

interface LoginResponse {
  token: string
  user: {
    username: string
    role: AuthRole
    displayName: string
  }
}

const AUTH_TOKEN_COOKIE_KEY = 'token'
const AUTH_API_RETRY_CONFIG: AxiosRequestConfig['retry'] = {
  maxRetries: 0
}

const resolveAuthApiBase = () => {
  const configuredBase = import.meta.env.VITE_AUTH_API_BASE_URL?.trim() || ''
  if (configuredBase) return configuredBase.replace(/\/$/, '')
  if (import.meta.env.DEV) {
    return `${ window.location.origin }/api/auth`
  }
  return ''
}

const normalizeApiPath = (apiBase: string, path: string) => `${ apiBase }${ path }`

const requestAuthApi = async <T>(
  path: string,
  method: 'get' | 'post',
  payload?: unknown,
  config?: AxiosRequestConfig
): Promise<T | null> => {
  const apiBase = resolveAuthApiBase()
  if (!apiBase) return null

  const url = normalizeApiPath(apiBase, path)
  const response = method === 'post'
    ? await request.post(url, payload, {
        ...config,
        retry: config?.retry ?? AUTH_API_RETRY_CONFIG,
        requestName: config?.requestName || path
      })
    : await request.get(url, undefined, {
        ...config,
        retry: config?.retry ?? AUTH_API_RETRY_CONFIG,
        requestName: config?.requestName || path
      })

  if (response.error !== 0) {
    return null
  }

  return response.data as T
}

export const setAuthToken = (token: string) => {
  Cookie.set(AUTH_TOKEN_COOKIE_KEY, token, {
    sameSite: 'lax'
  })
}

export const clearAuthToken = () => {
  Cookie.remove(AUTH_TOKEN_COOKIE_KEY)
}

export const getAuthToken = () => Cookie.get(AUTH_TOKEN_COOKIE_KEY) || ''

export const loginByApi = async (username: string, password: string): Promise<{ session: AuthSession, token: string } | null> => {
  const payload = await requestAuthApi<LoginResponse>(
    '/login',
    'post',
    {
      username,
      password
    },
    {
      requestName: 'loginByApi'
    }
  )
  if (!payload?.token || !payload.user?.username || !payload.user?.role) {
    return null
  }

  return {
    token: payload.token,
    session: {
      username: payload.user.username,
      role: payload.user.role,
      displayName: payload.user.displayName
    }
  }
}

export const fetchCurrentAuthSession = async (): Promise<AuthSession | null> => {
  const payload = await requestAuthApi<{
    user?: AuthSession
  }>(
    '/me',
    'get',
    undefined,
    {
      requestName: 'fetchCurrentAuthSession'
    }
  )

  if (!payload) {
    return null
  }

  return payload.user?.username ? payload.user : null
}

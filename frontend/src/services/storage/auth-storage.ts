export const AUTH_STORAGE_KEY = 'offerpilot.auth.session'

export interface AuthSession {
  username: string
}

export const DEFAULT_AUTH_CREDENTIALS = {
  username: 'admin',
  password: 'admin'
} as const

export function getAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.username?.trim()) return null

    return {
      username: parsed.username.trim()
    }
  }
  catch {
    return null
  }
}

export function setAuthSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function isAuthenticated() {
  return Boolean(getAuthSession()?.username)
}

export function validateCredentials(username: string, password: string) {
  return username.trim() === DEFAULT_AUTH_CREDENTIALS.username
    && password === DEFAULT_AUTH_CREDENTIALS.password
}

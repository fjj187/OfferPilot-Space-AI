export const AUTH_STORAGE_KEY = 'offerpilot.auth.session'
export const AUTH_LAST_ACCOUNT_KEY = 'offerpilot.auth.last-account'

export type AuthRole = 'user' | 'admin'

export interface AuthSession {
  username: string
  role: AuthRole
  displayName?: string
}

export const DEFAULT_AUTH_CREDENTIALS = {
  username: 'user',
  password: 'user'
} as const

export const DEMO_AUTH_ACCOUNTS: Array<AuthSession & { password: string }> = [
  {
    username: 'user',
    password: 'user',
    role: 'user',
    displayName: '普通用户'
  },
  {
    username: 'admin',
    password: 'admin',
    role: 'admin',
    displayName: '管理员'
  }
]

const findDemoAccount = (username: string) => (
  DEMO_AUTH_ACCOUNTS.find(account => account.username === username.trim()) || null
)

const normalizeAuthRole = (role: unknown, username: string): AuthRole => {
  if (role === 'admin' || role === 'user') return role
  return findDemoAccount(username)?.role || 'user'
}

export function getDefaultAuthCredentials() {
  if (typeof window === 'undefined') {
    return DEFAULT_AUTH_CREDENTIALS
  }

  const lastAccountUsername = window.localStorage.getItem(AUTH_LAST_ACCOUNT_KEY)?.trim() || ''
  return findDemoAccount(lastAccountUsername) || DEFAULT_AUTH_CREDENTIALS
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.username?.trim()) return null

    const username = parsed.username.trim()

    return {
      username,
      role: normalizeAuthRole(parsed.role, username),
      displayName: parsed.displayName?.trim() || username
    }
  }
  catch {
    return null
  }
}

export function setAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function setLastAuthAccount(username: string) {
  if (typeof window === 'undefined') return

  const matched = findDemoAccount(username)
  if (!matched) return

  window.localStorage.setItem(AUTH_LAST_ACCOUNT_KEY, matched.username)
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function isAuthenticated() {
  return Boolean(getAuthSession()?.username)
}

export function resolveCredentials(username: string, password: string) {
  const normalizedUsername = username.trim()
  const matched = DEMO_AUTH_ACCOUNTS.find(account => (
    account.username === normalizedUsername && account.password === password
  ))

  if (!matched) return null

  return {
    username: matched.username,
    role: matched.role,
    displayName: matched.displayName
  } satisfies AuthSession
}

export function validateCredentials(username: string, password: string) {
  return Boolean(resolveCredentials(username, password))
}

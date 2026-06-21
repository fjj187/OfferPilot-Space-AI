import crypto from 'node:crypto'
import type { AuthLoginRequest, AuthLoginResponse, AuthRole, AuthUser } from '../types/auth.js'
import { backendEnv } from '../utils/env.js'

interface AuthAccount extends AuthUser {
  password: string
}

interface AuthTokenPayload {
  username: string
  role: AuthRole
  displayName: string
  exp: number
}

const TOKEN_TTL_MS = 1000 * 60 * 60 * 8

const demoAccounts: AuthAccount[] = [
  {
    username: backendEnv.demoUserUsername,
    password: backendEnv.demoUserPassword,
    role: 'user',
    displayName: '普通用户'
  },
  {
    username: backendEnv.demoAdminUsername,
    password: backendEnv.demoAdminPassword,
    role: 'admin',
    displayName: '管理员'
  }
]

const encodeBase64Url = (value: string) => Buffer.from(value, 'utf8').toString('base64url')

const decodeBase64Url = (value: string) => Buffer.from(value, 'base64url').toString('utf8')

const signTokenPayload = (encodedPayload: string) => {
  return crypto.createHmac('sha256', backendEnv.authTokenSecret).update(encodedPayload).digest('base64url')
}

const toAuthUser = (account: AuthAccount): AuthUser => ({
  username: account.username,
  role: account.role,
  displayName: account.displayName
})

const buildToken = (user: AuthUser) => {
  const payload: AuthTokenPayload = {
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    exp: Date.now() + TOKEN_TTL_MS
  }

  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = signTokenPayload(encodedPayload)
  return `${ encodedPayload }.${ signature }`
}

export class AuthService {
  login(payload: Partial<AuthLoginRequest>): AuthLoginResponse | null {
    const username = String(payload.username || '').trim()
    const password = String(payload.password || '')
    if (!username || !password) return null

    const account = demoAccounts.find(item => item.username === username && item.password === password)
    if (!account) return null

    const user = toAuthUser(account)
    return {
      token: buildToken(user),
      user
    }
  }

  verifyToken(token: string): AuthUser | null {
    const normalizedToken = token.trim()
    if (!normalizedToken) return null

    const [encodedPayload, signature] = normalizedToken.split('.')
    if (!encodedPayload || !signature) return null
    if (signTokenPayload(encodedPayload) !== signature) return null

    try {
      const parsed = JSON.parse(decodeBase64Url(encodedPayload)) as Partial<AuthTokenPayload>
      if (!parsed.username || !parsed.role || !parsed.displayName || typeof parsed.exp !== 'number') {
        return null
      }

      if (parsed.exp < Date.now()) return null

      return {
        username: parsed.username,
        role: parsed.role,
        displayName: parsed.displayName
      }
    }
    catch {
      return null
    }
  }
}

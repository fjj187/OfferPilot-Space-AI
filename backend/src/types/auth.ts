export type AuthRole = 'user' | 'admin'

export interface AuthUser {
  username: string
  role: AuthRole
  displayName: string
}

export interface AuthLoginRequest {
  username: string
  password: string
}

export interface AuthLoginResponse {
  token: string
  user: AuthUser
}

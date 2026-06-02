import { describe, expect, it } from 'vitest'
import {
  clearAuthSession,
  DEFAULT_AUTH_CREDENTIALS,
  getAuthSession,
  isAuthenticated,
  setAuthSession,
  validateCredentials
} from '@/services/storage/auth-storage'
import { resolveSafeRedirect } from '@/utils/auth/resolve-safe-redirect'

describe('resolveSafeRedirect', () => {  it('接受站内相对路径', () => {
    expect(resolveSafeRedirect('/showcase/mock-interview-space')).toBe('/showcase/mock-interview-space')
    expect(resolveSafeRedirect('/showcase/mock-interview-space?scene=library')).toBe('/showcase/mock-interview-space?scene=library')
  })

  it('接受 query 数组首项', () => {
    expect(resolveSafeRedirect(['/showcase/mock-interview-space'])).toBe('/showcase/mock-interview-space')
  })

  it('拒绝外部链接、协议相对路径与登录页', () => {
    expect(resolveSafeRedirect('https://example.com')).toBeNull()
    expect(resolveSafeRedirect('//evil.example.com')).toBeNull()
    expect(resolveSafeRedirect('/login')).toBeNull()
    expect(resolveSafeRedirect('/login?redirect=/foo')).toBeNull()
    expect(resolveSafeRedirect(undefined)).toBeNull()
  })
})

describe('auth-storage', () => {
  it('校验默认演示账号', () => {
    expect(validateCredentials(DEFAULT_AUTH_CREDENTIALS.username, DEFAULT_AUTH_CREDENTIALS.password)).toBe(true)
    expect(validateCredentials('admin', 'wrong')).toBe(false)
    expect(validateCredentials('guest', DEFAULT_AUTH_CREDENTIALS.password)).toBe(false)
  })

  it('无 window 时读写会话为安全空操作', () => {
    expect(getAuthSession()).toBeNull()
    expect(isAuthenticated()).toBe(false)

    setAuthSession({ username: 'admin' })
    clearAuthSession()

    expect(getAuthSession()).toBeNull()
    expect(isAuthenticated()).toBe(false)
  })
})
const LOGIN_PATH = '/login'

/** 仅允许站内相对路径，并排除登录页自身，避免 redirect 循环 */
export function resolveSafeRedirect(target: unknown) {
  const raw = Array.isArray(target) ? target[0] : target
  if (typeof raw !== 'string') return null

  const trimmed = raw.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null

  const pathOnly = trimmed.split('?')[0]?.split('#')[0] ?? ''
  if (pathOnly === LOGIN_PATH) return null

  return trimmed
}

import { computed, ref } from 'vue'
import { clearAuthToken, fetchCurrentAuthSession, loginByApi, setAuthToken } from '@/services/auth/auth-api'
import {
  DEMO_AUTH_ACCOUNTS,
  clearAuthSession,
  getDefaultAuthCredentials,
  getAuthSession,
  normalizeAuthSession,
  resolveCredentials,
  setLastAuthAccount,
  setAuthSession,
} from '@/services/storage/auth-storage'

const initialSession = getAuthSession()
const authUsername = ref(initialSession?.username ?? '')
const authRole = ref(initialSession?.role ?? 'user')
const authDisplayName = ref(initialSession?.displayName ?? authUsername.value)

export function useAuth() {
  const defaultCredentials = getDefaultAuthCredentials()

  const applySession = (session: ReturnType<typeof getAuthSession>) => {
    authUsername.value = session?.username ?? ''
    authRole.value = session?.role ?? 'user'
    authDisplayName.value = session?.displayName ?? authUsername.value
  }

  applySession(getAuthSession())

  const isLoggedIn = computed(() => Boolean(authUsername.value))
  const isAdmin = computed(() => authRole.value === 'admin')
  const displayName = computed(() => authDisplayName.value || authUsername.value || defaultCredentials.username)

  const syncFromStorage = () => {
    applySession(getAuthSession())
  }

  const syncFromServer = async () => {
    const rawSession = await fetchCurrentAuthSession()
    if (!rawSession) {
      clearAuthSession()
      clearAuthToken()
      applySession(null)
      return null
    }

    const session = normalizeAuthSession(rawSession)
    setAuthSession(session)
    applySession(session)
    return session
  }

  const login = async (username: string, password: string) => {
    const result = await loginByApi(username, password)
    if (result) {
      setAuthToken(result.token)
      const session = normalizeAuthSession(result.session)
      setAuthSession(session)
      setLastAuthAccount(session.username)
      authUsername.value = session.username
      authRole.value = session.role
      authDisplayName.value = session.displayName ?? session.username
      return true
    }

    // 演示环境兜底：API 不可用时使用本地演示账号校验
    const localSession = resolveCredentials(username, password)
    if (localSession) {
      const normalizedLocalSession = normalizeAuthSession(localSession)
      // 设置占位 token 以通过路由守卫的 hasUsableAuthState 校验
      setAuthToken('demo')
      setAuthSession(normalizedLocalSession)
      setLastAuthAccount(normalizedLocalSession.username)
      authUsername.value = normalizedLocalSession.username
      authRole.value = normalizedLocalSession.role
      authDisplayName.value = normalizedLocalSession.displayName ?? normalizedLocalSession.username
      return true
    }

    return false
  }

  const logout = () => {
    clearAuthSession()
    clearAuthToken()
    authUsername.value = ''
    authRole.value = 'user'
    authDisplayName.value = ''
  }

  return {
    authUsername,
    authRole,
    isLoggedIn,
    isAdmin,
    displayName,
    defaultUsername: defaultCredentials.username,
    defaultPassword: defaultCredentials.password,
    demoAccounts: DEMO_AUTH_ACCOUNTS,
    syncFromStorage,
    syncFromServer,
    login,
    logout
  }
}

import { computed, ref } from 'vue'
import {
  DEFAULT_AUTH_CREDENTIALS,
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  validateCredentials
} from '@/services/storage/auth-storage'

const authUsername = ref(getAuthSession()?.username ?? '')

export function useAuth() {
  const isLoggedIn = computed(() => Boolean(authUsername.value))
  const displayName = computed(() => authUsername.value || DEFAULT_AUTH_CREDENTIALS.username)

  const syncFromStorage = () => {
    authUsername.value = getAuthSession()?.username ?? ''
  }

  const login = (username: string, password: string) => {
    if (!validateCredentials(username, password)) return false

    const session = {
      username: username.trim()
    }
    setAuthSession(session)
    authUsername.value = session.username
    return true
  }

  const logout = () => {
    clearAuthSession()
    authUsername.value = ''
  }

  return {
    authUsername,
    isLoggedIn,
    displayName,
    defaultUsername: DEFAULT_AUTH_CREDENTIALS.username,
    defaultPassword: DEFAULT_AUTH_CREDENTIALS.password,
    syncFromStorage,
    login,
    logout
  }
}

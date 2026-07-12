<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import SpaceHeader from '@/components/showcase/mock-interview-space/SpaceHeader.vue'
import SpaceLoginHero from '@/components/showcase/mock-interview-space/SpaceLoginHero.vue'
import { DEFAULT_APP_ROUTE_NAME } from '@/config/product'
import { useEnabledModels } from '@/composables/model/useEnabledModels'
import { scenes } from '@/constants/showcase/mockInterviewSpaceScenes'
import { preloadMockInterviewSpacePlanetTextures } from '@/services/showcase/mock-interview-space-planet-preload'
import router from '@/router'
import { resolveSafeRedirect } from '@/utils/auth/resolve-safe-redirect'
import { useRoute } from 'vue-router'

const route = useRoute()
const overviewScene = scenes[0]!
const isNavigatingAfterLogin = ref(false)
const DEFAULT_APP_PATH = '/showcase/mock-interview-space'
const LOGIN_TRANSITION_MS = 360
const {
  enabledModels,
  isLoadingEnabledModels,
  selectedModelDisplayName,
  selectedModelId,
  updateSelectedModelId
} = useEnabledModels()

let loginTransitionTimer: ReturnType<typeof setTimeout> | null = null
let mockInterviewSpaceEntryPreloadPromise: Promise<void> | null = null

/** 与宇宙页登录门控一致的静止顶栏样式 */
const loginHeaderStyle: CSSProperties = {
  opacity: '1',
  transform: 'translateY(0)',
  pointerEvents: 'auto',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  '--header-mask-opacity': '1',
  '--header-border-opacity': '0.08',
  '--header-bg-opacity': '0.92'
}

const loginPageStyle = computed<CSSProperties>(() => ({
  background: overviewScene.shellBackground,
  '--scene-primary': overviewScene.theme.primary,
  '--scene-secondary': overviewScene.theme.secondary,
  '--scene-line': overviewScene.theme.line,
  '--scene-dot': overviewScene.theme.dot,
  '--scene-dot-active': overviewScene.theme.activeDot,
  '--space-header-height': '59px'
} as CSSProperties))

const normalizePostLoginRedirect = (target: string) => {
  if (!target.startsWith(DEFAULT_APP_PATH)) {
    return target
  }

  const [pathAndQuery, hash = ''] = target.split('#')
  const [path, queryString = ''] = pathAndQuery.split('?')
  const searchParams = new URLSearchParams(queryString)

  searchParams.delete('welcome')

  const normalizedQuery = searchParams.toString()
  const normalizedHash = hash ? `#${ hash }` : ''

  return normalizedQuery
    ? `${ path }?${ normalizedQuery }${ normalizedHash }`
    : `${ path }${ normalizedHash }`
}

const resolvePostLoginTarget = () => {
  const redirect = resolveSafeRedirect(route.query.redirect)
  if (redirect) {
    return normalizePostLoginRedirect(redirect)
  }

  return {
    name: DEFAULT_APP_ROUTE_NAME
  }
}

const clearLoginTransitionTimer = () => {
  if (!loginTransitionTimer) return
  window.clearTimeout(loginTransitionTimer)
  loginTransitionTimer = null
}

const preloadMockInterviewSpaceEntry = () => {
  mockInterviewSpaceEntryPreloadPromise ||= Promise.allSettled([
    preloadMockInterviewSpacePlanetTextures(),
    import('@/views/showcase/mock-interview-space.vue')
  ]).then(() => undefined)

  return mockInterviewSpaceEntryPreloadPromise
}

const navigateAfterLogin = () => {
  if (isNavigatingAfterLogin.value) return

  isNavigatingAfterLogin.value = true
  const target = resolvePostLoginTarget()

  clearLoginTransitionTimer()
  loginTransitionTimer = window.setTimeout(() => {
    loginTransitionTimer = null
    void router.replace(target)
  }, LOGIN_TRANSITION_MS)
}

const handleLoginSuccess = () => {
  navigateAfterLogin()
}

const goAdminLogin = () => {
  void router.push({
    name: 'AdminLogin'
  })
}

onMounted(() => {
  void preloadMockInterviewSpaceEntry()
})

onBeforeUnmount(() => {
  clearLoginTransitionTimer()
})

</script>

<template>
  <div
    class="login-page"
    :style="loginPageStyle"
  >
    <SpaceHeader
      :header-style="loginHeaderStyle"
      :enabled-models="enabledModels"
      :is-auto-scrolling="false"
      :is-loading-models="isLoadingEnabledModels"
      :is-user-scrolling="false"
      :selected-model-id="selectedModelId"
      :selected-model-label="selectedModelDisplayName"
      @update-model-id="updateSelectedModelId"
    />

    <SpaceLoginHero
      class="login-gate-layer"
      :class="{ 'is-login-transitioning': isNavigatingAfterLogin }"
      @success="handleLoginSuccess"
    />

    <div
      v-if="isNavigatingAfterLogin"
      class="login-transition-mask"
      aria-hidden="true"
    ></div>

    <button
      class="admin-entry-button"
      type="button"
      @click="goAdminLogin"
    >
      进入后台管理
    </button>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
  color: #fff;

  > :deep(.space-header) {
    position: sticky;
    top: 0;
    z-index: 12;
    flex-shrink: 0;
  }
}

.login-gate-layer {
  /* 全屏铺星空底，顶栏透明叠在上方 */
  position: fixed;
  inset: 0;
  z-index: 1;
}
.admin-entry-button {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 4;
  height: 42px;
  padding: 0 16px;
  border: 1px solid rgb(118 247 234 / 0.22);
  border-radius: 999px;
  background: rgb(8 18 34 / 0.72);
  color: rgb(232 244 255 / 0.9);
  cursor: pointer;
  backdrop-filter: blur(14px);
  box-shadow: 0 12px 30px rgb(0 0 0 / 0.24);
}

.login-gate-layer.is-login-transitioning {
  opacity: 0;
  transform: scale(1.015);
  pointer-events: none;
  transition:
    opacity 0.22s ease,
    transform 0.42s ease;
}

.login-transition-mask {
  position: fixed;
  inset: 0;
  z-index: 3;
  background: rgb(3 6 14 / 0);
  pointer-events: none;
  animation: login-transition-fade 0.36s ease forwards;
}

@keyframes login-transition-fade {
  0% {
    background: rgb(3 6 14 / 0);
  }

  100% {
    background: rgb(3 6 14 / 0.92);
  }
}
</style>

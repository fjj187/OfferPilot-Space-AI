<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import SpaceHeader from '@/components/showcase/mock-interview-space/SpaceHeader.vue'
import SpaceLoginHero from '@/components/showcase/mock-interview-space/SpaceLoginHero.vue'
import { useAuth } from '@/composables/useAuth'
import { DEFAULT_APP_ROUTE_NAME } from '@/config/product'
import { scenes } from '@/constants/showcase/mockInterviewSpaceScenes'
import router from '@/router'
import { resolveSafeRedirect } from '@/utils/auth/resolve-safe-redirect'
import { useRoute } from 'vue-router'

const route = useRoute()
const { isLoggedIn } = useAuth()
const overviewScene = scenes[0]!

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

const navigateAfterLogin = () => {
  const redirect = resolveSafeRedirect(route.query.redirect)
  if (redirect) {
    void router.replace(redirect)
    return
  }

  void router.replace({
    name: DEFAULT_APP_ROUTE_NAME,
    query: {
      welcome: '1'
    }
  })
}

const handleLoginSuccess = () => {
  navigateAfterLogin()
}

watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    navigateAfterLogin()
  }
})

onMounted(() => {
  if (isLoggedIn.value) {
    navigateAfterLogin()
  }
})
</script>

<template>
  <div
    class="login-page"
    :style="loginPageStyle"
  >
    <SpaceHeader
      :header-style="loginHeaderStyle"
      :is-auto-scrolling="false"
      :is-user-scrolling="false"
    />

    <SpaceLoginHero
      class="login-gate-layer"
      @success="handleLoginSuccess"
    />
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
</style>

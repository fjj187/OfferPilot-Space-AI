<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import SpaceHeader from '@/components/showcase/mock-interview-space/SpaceHeader.vue'
import SpaceLoginHero from '@/components/showcase/mock-interview-space/SpaceLoginHero.vue'
import { DEFAULT_APP_ROUTE_NAME } from '@/config/product'
import { scenes } from '@/constants/showcase/mockInterviewSpaceScenes'
import router from '@/router'
import { resolveSafeRedirect } from '@/utils/auth/resolve-safe-redirect'
import { useRoute } from 'vue-router'

const route = useRoute()
const overviewScene = scenes[0]!
const isNavigatingAfterLogin = ref(false)

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
  isNavigatingAfterLogin.value = true
  const redirect = resolveSafeRedirect(route.query.redirect)
  if (redirect) {
    if (redirect.startsWith('/showcase/mock-interview-space')) {
      void router.replace({
        name: DEFAULT_APP_ROUTE_NAME,
        query: {
          welcome: '1'
        }
      })
      return
    }
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

const goAdminLogin = () => {
  void router.push({
    name: 'AdminLogin'
  })
}

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
      :class="{ 'is-login-transitioning': isNavigatingAfterLogin }"
      @success="handleLoginSuccess"
    />

    <div
      v-if="isNavigatingAfterLogin"
      class="login-transition-mask"
      aria-hidden="true"
    >
      <span class="login-transition-core"></span>
    </div>

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
  display: grid;
  place-items: center;
  background: #03060e;
  pointer-events: none;
}

.login-transition-core {
  width: 18vmax;
  height: 18vmax;
  border-radius: 50%;
  background:
    radial-gradient(circle, rgb(255 255 255 / 0.92) 0%, rgb(118 247 234 / 0.58) 22%, transparent 68%);
  animation: login-transition-pulse 0.72s ease-out infinite;
}

@keyframes login-transition-pulse {
  0% {
    opacity: 0.78;
    transform: scale(0.72);
  }

  100% {
    opacity: 0.18;
    transform: scale(1.28);
  }
}
</style>

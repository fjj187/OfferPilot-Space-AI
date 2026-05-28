<script lang="tsx" setup>
import type { CSSProperties } from 'vue'
import SpaceCosmosConfirm from '@/components/showcase/mock-interview-space/SpaceCosmosConfirm.vue'
import { useAuth } from '@/composables/useAuth'

defineProps<{
  headerStyle: CSSProperties
  isAutoScrolling: boolean
  isUserScrolling: boolean
}>()

const emit = defineEmits<{
  resolveElement: [element: HTMLElement | null]
}>()

const { displayName, isLoggedIn, logout } = useAuth()

const showLogoutConfirm = ref(false)

const handleLogoutClick = () => {
  showLogoutConfirm.value = true
}

const handleLogoutConfirm = () => {
  logout()
  window.$ModalMessage?.success?.('已退出登录', {
    duration: 2000,
    closable: false
  })
}

const headerEl = ref<HTMLElement | null>(null)

onMounted(() => {
  emit('resolveElement', headerEl.value)
})

onBeforeUnmount(() => {
  emit('resolveElement', null)
})
</script>

<template>
  <header
    ref="headerEl"
    class="space-header"
    :class="{
      'is-auto-scrolling': isAutoScrolling,
      'is-user-scrolling': isUserScrolling
    }"
    :style="headerStyle"
  >
    <div class="brand-lockup">
      <div class="brand-mark">
        <span class="i-lucide-orbit"></span>
      </div>
      <div>
        <div class="brand-name">Interview Cosmos</div>
        <div class="brand-meta">Mock redesign / scene preview</div>
      </div>
    </div>

    <nav class="space-nav">
      <a href="#">Overview</a>
      <a href="#">Interview</a>
      <a href="#">Strategy</a>
      <a href="#">Feedback</a>
      <a href="#">Result</a>
    </nav>

    <div class="header-tools">
      <button
        type="button"
        class="icon-tool"
        aria-label="Search"
      >
        <span class="i-lucide-search"></span>
      </button>
      <button
        v-if="!isLoggedIn"
        type="button"
        class="back-link sign-in-link"
        disabled
      >
        Sign in
      </button>
      <template v-else>
        <span
          class="user-badge"
          :title="`当前用户 ${ displayName }`"
        >
          {{ displayName }}
        </span>
        <button
          type="button"
          class="back-link logout-link"
          @click="handleLogoutClick"
        >
          退出
        </button>
      </template>
    </div>
  </header>

  <SpaceCosmosConfirm
    v-model:show="showLogoutConfirm"
    title="退出登录"
    message="确定要退出当前账号吗？退出后将返回登录门控。"
    confirm-text="退出"
    cancel-text="取消"
    confirm-primary
    @confirm="handleLogoutConfirm"
  />
</template>

<style lang="scss" scoped>
.space-header {
  position: sticky;
  top: 0;
  z-index: 10;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 10px 28px;
  border-bottom: 1px solid rgb(255 255 255 / var(--header-border-opacity, 0.08));
  background: linear-gradient(
    180deg,
    rgb(7 15 30 / var(--header-bg-opacity, 0.92)) 0%,
    rgb(7 15 30 / calc(var(--header-bg-opacity, 0.92) * 0.37)) 100%
  );
  backdrop-filter: blur(14px);
  transition:
    opacity 0.5s ease,
    transform 0.5s var(--ease-orbit),
    border-color 0.5s ease,
    background 0.5s ease,
    backdrop-filter 0.5s ease;
}

.space-header.is-auto-scrolling,
.space-header.is-user-scrolling {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.space-header::after {
  content: "";
  position: absolute;
  inset: auto 0 -32px;
  height: 32px;
  background: linear-gradient(180deg, rgb(7 15 30 / calc(var(--header-mask-opacity, 1) * 0.34)) 0%, rgb(7 15 30 / 0) 100%);
  pointer-events: none;
  transition: opacity 0.5s ease, background 0.5s ease;
}

.space-header.is-auto-scrolling::after {
  opacity: 0;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 12px;
  background: rgb(255 255 255 / 0.06);
  color: var(--scene-primary);
  font-size: 18px;
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
}

.brand-meta {
  margin-top: 2px;
  color: rgb(232 244 255 / 0.62);
  font-size: 15px;
}

.space-nav {
  display: flex;
  gap: 22px;
}

.space-nav a {
  color: rgb(255 255 255 / 0.82);
  font-size: 15px;
  transition: color 0.22s ease;
}

.space-nav a:hover {
  color: var(--scene-primary);
}

.back-link,
.icon-tool {
  font: inherit;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-tool {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  color: #fff;
  cursor: pointer;
  transition: background 0.24s ease, border-color 0.24s ease, transform 0.24s ease;
}

.icon-tool:hover {
  border-color: rgb(255 255 255 / 0.24);
  background: rgb(255 255 255 / 0.08);
  transform: translateY(-1px);
}

.back-link {
  height: 38px;
  padding: 0 16px;
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
  color: #fff;
  cursor: pointer;
  transition: background 0.24s ease, border-color 0.24s ease, transform 0.24s ease;
}

.back-link:hover {
  border-color: rgb(255 255 255 / 0.26);
  background: rgb(255 255 255 / 0.1);
  transform: translateY(-1px);
}

.sign-in-link {
  opacity: 0.88;
  cursor: default;
}

.sign-in-link:hover {
  transform: none;
}

.user-badge {
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 16px;
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
  color: rgb(255 255 255 / 0.92);
  font-size: inherit;
  line-height: 1;
  cursor: default;
  user-select: none;
}

.logout-link {
  flex-shrink: 0;
}

@media (max-width: 1100px) {
  .space-header {
    flex-wrap: wrap;
  }

  .space-nav {
    order: 3;
    width: 100%;
    overflow-x: auto;
  }
}

@media (max-width: 780px) {
  .space-header {
    padding-left: 18px;
    padding-right: 18px;
  }

  .header-tools {
    width: 100%;
    justify-content: space-between;
  }

  .back-link {
    flex: 1;
  }
}
</style>

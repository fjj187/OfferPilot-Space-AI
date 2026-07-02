<script setup lang="ts">
import { useMessage } from 'naive-ui'
import AdminGalaxy from '@/components/admin/AdminGalaxy.vue'
import { ADMIN_DASHBOARD_ROUTE_NAME, LOGIN_ROUTE_NAME } from '@/config/product'
import { useAuth } from '@/composables/useAuth'
import { resolveSafeRedirect } from '@/utils/auth/resolve-safe-redirect'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const { defaultUsername, defaultPassword, login, isAdmin } = useAuth()

const username = ref(defaultUsername)
const password = ref(defaultPassword)
const submitting = ref(false)

const loginHighlights = [
  '会话总览',
  '报告追踪',
  '模型配置'
]

const navigateAfterLogin = () => {
  const redirect = resolveSafeRedirect(route.query.redirect)
  if (redirect) {
    void router.replace(redirect)
    return
  }

  void router.replace({
    name: ADMIN_DASHBOARD_ROUTE_NAME
  })
}

onMounted(() => {
  if (route.query.fromLogout !== '1') return

  message.success('已退出后台账号')
  void router.replace({
    name: 'AdminLogin',
    query: {
      ...route.query,
      fromLogout: undefined
    }
  })
})

const handleSubmit = async () => {
  if (submitting.value) return

  submitting.value = true
  const ok = await login(username.value, password.value)
  submitting.value = false

  if (!ok) {
    message.error('账号或密码错误')
    return
  }

  if (!isAdmin.value) {
    message.warning('当前账号不是管理员，无法进入后台')
    void router.replace({
      name: LOGIN_ROUTE_NAME
    })
    return
  }

  message.success('已进入后台管理台')
  navigateAfterLogin()
}
</script>

<template>
  <main class="admin-login-page">
    <AdminGalaxy
      class="admin-login-galaxy"
      :density="1.2"
      :glow-intensity="0.56"
      :mouse-repulsion="false"
      :saturation="0.95"
      :hue-shift="208"
      :rotation-speed="0.06"
      :star-speed="0.42"
      :transparent="true"
      :twinkle-intensity="0.45"
    />
    <div class="admin-login-noise"></div>
    <div class="admin-login-veil"></div>

    <section class="login-shell">
      <div class="login-copy">
        <p class="eyebrow">
          OfferPilot Admin Space
        </p>
        <h1>后台管理入口</h1>
        <p class="lead">
          在同一块控制台里查看模拟面试会话、报告生成状态与模型配置，
          把日常排查、运营观察和配置维护收拢到一个入口。
        </p>

        <div class="highlight-list">
          <span
            v-for="item in loginHighlights"
            :key="item"
            class="highlight-chip"
          >
            {{ item }}
          </span>
        </div>
      </div>

      <form
        class="login-card"
        @submit.prevent="handleSubmit"
      >
        <div class="card-head">
          <span class="card-kicker">Admin Console</span>
          <strong>管理员登录</strong>
          <p>请输入管理员账号，进入后台控制台。</p>
        </div>

        <label>
          <span>账号</span>
          <input
            v-model="username"
            autocomplete="username"
            type="text"
          >
        </label>

        <label>
          <span>密码</span>
          <input
            v-model="password"
            autocomplete="current-password"
            type="password"
          >
        </label>

        <button
          class="submit-button"
          :disabled="submitting"
          type="submit"
        >
          {{ submitting ? '登录中' : '进入后台' }}
        </button>

        <RouterLink
          class="back-link"
          :to="{ name: LOGIN_ROUTE_NAME }"
        >
          返回用户登录页
        </RouterLink>
      </form>
    </section>
  </main>
</template>

<style scoped lang="scss">
.admin-login-page {
  --admin-login-text: #eff7ff;
  --admin-login-text-soft: rgb(219 234 254 / 0.76);
  --admin-login-border: rgb(148 163 184 / 0.18);
  --admin-login-panel: rgb(3 10 24 / 0.56);
  --admin-login-panel-strong: rgb(5 14 32 / 0.82);
  --admin-login-accent: #7dd3fc;
  --admin-login-accent-strong: #4ade80;
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  padding: 40px 24px;
  color: var(--admin-login-text);
  background:
    radial-gradient(circle at top, rgb(15 23 42 / 0.18), transparent 30%),
    linear-gradient(135deg, #020611 0%, #07111f 50%, #02050d 100%);
}

.admin-login-galaxy {
  opacity: 1;
}

.admin-login-noise,
.admin-login-veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.admin-login-noise {
  background-image:
    radial-gradient(circle at 20% 20%, rgb(125 211 252 / 0.26), transparent 26%),
    radial-gradient(circle at 80% 18%, rgb(34 211 238 / 0.22), transparent 22%),
    radial-gradient(circle at 50% 80%, rgb(74 222 128 / 0.16), transparent 20%);
  mix-blend-mode: screen;
  opacity: 0.95;
}

.admin-login-veil {
  background:
    linear-gradient(90deg, rgb(2 6 23 / 0.68) 0%, rgb(2 6 23 / 0.4) 42%, rgb(2 6 23 / 0.62) 100%);
}

.login-shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 420px);
  gap: 40px;
  align-items: center;
  width: min(1180px, 100%);
  min-height: calc(100vh - 80px);
  margin: 0 auto;
}

.login-copy {
  max-width: 620px;

  h1 {
    margin: 12px 0 20px;
    font-size: clamp(42px, 7vw, 84px);
    line-height: 0.94;
    letter-spacing: -0.07em;
    text-wrap: balance;
  }
}

.eyebrow {
  margin: 0;
  color: var(--admin-login-accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.28em;
  text-transform: uppercase;
}

.lead {
  max-width: 560px;
  margin: 0;
  color: var(--admin-login-text-soft);
  font-size: 16px;
  line-height: 1.9;
}

.highlight-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.highlight-chip {
  padding: 10px 16px;
  border: 1px solid rgb(125 211 252 / 0.22);
  border-radius: 999px;
  background: rgb(8 18 38 / 0.46);
  color: rgb(226 232 240 / 0.88);
  font-size: 13px;
  letter-spacing: 0.04em;
  backdrop-filter: blur(14px);
}

.login-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 28px;
  border: 1px solid var(--admin-login-border);
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgb(15 23 42 / 0.66) 0%, rgb(2 6 23 / 0.9) 100%);
  box-shadow:
    0 30px 100px rgb(0 0 0 / 0.36),
    inset 0 1px 0 rgb(255 255 255 / 0.08);
  backdrop-filter: blur(18px);

  label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: rgb(226 239 255 / 0.74);
    font-size: 13px;
  }

  input {
    height: 48px;
    padding: 0 14px;
    border: 1px solid rgb(125 211 252 / 0.14);
    border-radius: 14px;
    outline: none;
    background: rgb(15 23 42 / 0.9);
    color: #fff;
    font-size: 15px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background-color 0.2s ease;

    &:focus {
      border-color: rgb(125 211 252 / 0.45);
      box-shadow: 0 0 0 4px rgb(125 211 252 / 0.12);
      background: rgb(15 23 42 / 0.98);
    }
  }
}

.card-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 2px;

  strong {
    font-size: 24px;
    line-height: 1.1;
  }

  p {
    margin: 0;
    color: var(--admin-login-text-soft);
    font-size: 14px;
    line-height: 1.7;
  }
}

.card-kicker {
  color: var(--admin-login-accent-strong);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.submit-button {
  height: 50px;
  margin-top: 4px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #7dd3fc 0%, #22c55e 100%);
  color: #03111f;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 18px 34px rgb(34 197 94 / 0.2);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.7;
  }
}

.back-link {
  color: rgb(226 239 255 / 0.72);
  text-align: center;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #fff;
  }
}

@media (max-width: 900px) {
  .admin-login-page {
    padding: 28px 18px;
  }

  .admin-login-veil {
    background:
      linear-gradient(180deg, rgb(2 6 23 / 0.72) 0%, rgb(2 6 23 / 0.88) 100%);
  }

  .login-shell {
    grid-template-columns: 1fr;
    gap: 24px;
    align-content: center;
    min-height: calc(100vh - 56px);
  }

  .login-copy h1 {
    font-size: clamp(40px, 16vw, 66px);
  }
}
</style>

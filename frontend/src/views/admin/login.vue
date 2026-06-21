<script setup lang="ts">
import { useMessage } from 'naive-ui'
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

  message.success('退出后台成功')
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
    message.warning('当前账号是普通用户，不能进入后台')
    void router.replace({
      name: LOGIN_ROUTE_NAME
    })
    return
  }

  message.success('已进入后台管理')
  navigateAfterLogin()
}
</script>

<template>
  <main class="admin-login-page">
    <section class="login-shell">
      <div class="login-copy">
        <p class="eyebrow">
          OfferPilot Admin
        </p>
        <h1>后台管理入口</h1>
        <p>
          用于查看模拟面试会话、报告生成情况和轻量数据看板。当前是前端演示登录态，正式环境仍需要后端鉴权兜底。
        </p>
      </div>

      <form
        class="login-card"
        @submit.prevent="handleSubmit"
      >
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
          返回登录页
        </RouterLink>
      </form>
    </section>
  </main>
</template>

<style scoped lang="scss">
.admin-login-page {
  min-height: 100vh;
  padding: 48px 24px;
  color: #eef6ff;
  background:
    radial-gradient(circle at 16% 12%, rgb(37 99 235 / 0.34), transparent 34%),
    radial-gradient(circle at 82% 18%, rgb(20 184 166 / 0.28), transparent 30%),
    linear-gradient(135deg, #07111f 0%, #0d1726 48%, #081018 100%);
}

.login-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 32px;
  align-items: center;
  width: min(1040px, 100%);
  min-height: calc(100vh - 96px);
  margin: 0 auto;
}

.login-copy {
  h1 {
    margin: 10px 0 18px;
    font-size: clamp(38px, 7vw, 76px);
    line-height: 0.98;
    letter-spacing: -0.06em;
  }

  p {
    max-width: 560px;
    color: rgb(226 239 255 / 0.72);
    font-size: 16px;
    line-height: 1.8;
  }
}

.eyebrow {
  margin: 0;
  color: #67e8f9;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.login-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 22px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 28px;
  background: rgb(7 17 31 / 0.72);
  box-shadow: 0 24px 80px rgb(0 0 0 / 0.32);
  backdrop-filter: blur(18px);

  label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: rgb(226 239 255 / 0.66);
    font-size: 13px;
  }

  input {
    height: 46px;
    padding: 0 14px;
    border: 1px solid rgb(255 255 255 / 0.1);
    border-radius: 14px;
    outline: none;
    background: rgb(15 29 49 / 0.86);
    color: #fff;
    font-size: 15px;
  }
}

.submit-button {
  height: 48px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #67e8f9 0%, #22c55e 100%);
  color: #03111f;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.7;
  }
}

.back-link {
  color: rgb(226 239 255 / 0.7);
  text-align: center;
  text-decoration: none;
}

@media (max-width: 820px) {
  .login-shell {
    grid-template-columns: 1fr;
    align-content: center;
  }
}
</style>

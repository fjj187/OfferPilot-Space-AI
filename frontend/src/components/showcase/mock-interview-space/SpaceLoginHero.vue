<script lang="ts" setup>
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useAuth } from '@/composables/useAuth'

const emit = defineEmits<{
  success: []
}>()

const message = useMessage()
const { defaultUsername, defaultPassword, login } = useAuth()

const username = ref(defaultUsername)
const password = ref(defaultPassword)
const submitting = ref(false)

const handleSubmit = () => {
  if (submitting.value) return

  const trimmedUsername = username.value.trim()
  if (!trimmedUsername || !password.value) {
    message.warning('请输入用户名和密码')
    return
  }

  submitting.value = true
  const ok = login(trimmedUsername, password.value)
  submitting.value = false

  if (!ok) {
    message.error('账号或密码错误')
    return
  }

  message.success(`欢迎，${ trimmedUsername }`)
  emit('success')
}
</script>

<template>
  <section class="space-login-hero">
    <div
      class="login-sky"
      aria-hidden="true"
    >
      <div class="login-stars"></div>
      <div class="earth-horizon">
        <div class="earth-disc">
          <div class="earth-texture"></div>
          <div class="earth-detail"></div>
          <div class="earth-clouds"></div>
          <div class="earth-highlight"></div>
        </div>
        <div class="earth-atmosphere"></div>
      </div>
    </div>

    <div class="hero-panel">
      <div class="hero-copy">
        <p class="hero-badge">
          <span class="i-lucide-sparkles badge-icon"></span>
          面向下一阶段的模拟面试训练
        </p>

        <h1 class="hero-title">
          开启你的面试轨道
        </h1>

        <p class="hero-subtitle">
          用 AI 驱动的模拟面试与资料训练，在同一宇宙工作台里完成准备、演练与复盘。
        </p>
      </div>

      <form
        class="login-card"
        @submit.prevent="handleSubmit"
      >
        <label class="field-box">
          <span class="field-label">用户名</span>
          <input
            v-model="username"
            type="text"
            name="username"
            autocomplete="username"
          >
        </label>

        <label class="field-box">
          <span class="field-label">密码</span>
          <input
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
          >
        </label>

        <button
          type="submit"
          class="btn-enter"
          :disabled="submitting"
        >
          {{ submitting ? '登录中…' : '进入宇宙' }}
        </button>
      </form>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.space-login-hero {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  justify-content: center;
  padding:
    calc(var(--space-header-height, 59px) + clamp(32px, 6vh, 72px))
    24px
    0;
  overflow: hidden;
  background: #050810;
  box-sizing: border-box;
}

/* 星空 + 地球同一全屏容器，避免中间横向裁切断层 */
.login-sky {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background:
    radial-gradient(ellipse 130% 95% at 50% 0%, #0b1422 0%, #050810 52%, #030508 100%);
}

.login-stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 7% 12%, rgb(255 255 255 / 0.92), transparent),
    radial-gradient(1px 1px at 18% 26%, rgb(255 255 255 / 0.5), transparent),
    radial-gradient(1.5px 1.5px at 31% 8%, rgb(255 255 255 / 0.78), transparent),
    radial-gradient(1px 1px at 44% 19%, rgb(255 255 255 / 0.42), transparent),
    radial-gradient(1px 1px at 57% 10%, rgb(255 255 255 / 0.68), transparent),
    radial-gradient(1.5px 1.5px at 69% 28%, rgb(255 255 255 / 0.58), transparent),
    radial-gradient(1px 1px at 82% 14%, rgb(255 255 255 / 0.88), transparent),
    radial-gradient(1px 1px at 91% 35%, rgb(255 255 255 / 0.38), transparent),
    radial-gradient(1px 1px at 13% 42%, rgb(255 255 255 / 0.48), transparent),
    radial-gradient(1.5px 1.5px at 26% 55%, rgb(255 255 255 / 0.62), transparent),
    radial-gradient(1px 1px at 39% 49%, rgb(255 255 255 / 0.34), transparent),
    radial-gradient(1px 1px at 53% 60%, rgb(255 255 255 / 0.52), transparent),
    radial-gradient(1px 1px at 66% 46%, rgb(255 255 255 / 0.72), transparent),
    radial-gradient(1.5px 1.5px at 79% 53%, rgb(255 255 255 / 0.46), transparent),
    radial-gradient(1px 1px at 11% 70%, rgb(255 255 255 / 0.36), transparent),
    radial-gradient(1px 1px at 36% 76%, rgb(255 255 255 / 0.44), transparent),
    radial-gradient(1px 1px at 74% 66%, rgb(255 255 255 / 0.4), transparent);
  background-repeat: no-repeat;
}

.earth-horizon {
  position: absolute;
  left: 50%;
  bottom: 0;
  z-index: 1;
  width: min(1120px, 165vw);
  aspect-ratio: 1;
  transform: translate(-50%, 56%);
}

.earth-disc {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 50%;
  background: #050810;
  /* 贴图外围黑色与深空背景羽化融合，消除横向断层 */
  mask-image: radial-gradient(circle at 50% 40%, #000 0%, #000 54%, transparent 76%);
  mask-mode: alpha;
}

/* NASA 阿波罗全景地球：海洋、陆地、沙漠、云系 */
.earth-texture {
  position: absolute;
  inset: 0;
  background:
    #0a3560 url('/earth-horizon.jpg') center 42% / cover no-repeat;
  filter: saturate(1.08) contrast(1.05);
}

/* 贴图加载失败时的精细 CSS 兜底（分层地貌） */
.earth-detail {
  position: absolute;
  inset: 0;
  opacity: 0.22;
  mix-blend-mode: overlay;
  background:
    radial-gradient(ellipse 22% 18% at 34% 38%, rgb(72 150 92 / 0.85) 0%, transparent 70%),
    radial-gradient(ellipse 18% 22% at 58% 42%, rgb(58 128 78 / 0.8) 0%, transparent 72%),
    radial-gradient(ellipse 14% 12% at 48% 50%, rgb(188 156 96 / 0.75) 0%, transparent 68%),
    radial-gradient(ellipse 12% 10% at 68% 46%, rgb(210 178 108 / 0.7) 0%, transparent 66%),
    radial-gradient(ellipse 16% 14% at 26% 48%, rgb(52 118 72 / 0.65) 0%, transparent 70%);
}

.earth-clouds {
  position: absolute;
  inset: 0;
  opacity: 0.38;
  mix-blend-mode: screen;
  background:
    radial-gradient(ellipse 20% 7% at 40% 34%, rgb(255 255 255 / 0.75) 0%, transparent 100%),
    radial-gradient(ellipse 16% 6% at 55% 38%, rgb(255 255 255 / 0.6) 0%, transparent 100%),
    radial-gradient(ellipse 14% 5% at 32% 42%, rgb(255 255 255 / 0.5) 0%, transparent 100%),
    radial-gradient(ellipse 12% 5% at 62% 36%, rgb(255 255 255 / 0.45) 0%, transparent 100%),
    radial-gradient(ellipse 18% 6% at 48% 46%, rgb(255 255 255 / 0.35) 0%, transparent 100%);
}

.earth-highlight {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 70% 28%, rgb(255 255 255 / 0.18) 0%, transparent 42%);
  pointer-events: none;
}

.earth-atmosphere {
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: 50%;
  border-top: 2px solid rgb(165 225 255 / 0.95);
  box-shadow: 0 -10px 40px rgb(90 185 255 / 0.42);
  pointer-events: none;
}

.hero-panel {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: min(420px, 100%);
  margin-top: -20px;
}

.hero-copy {
  text-align: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 18px;
  padding: 7px 14px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(8 16 32 / 0.5);
  color: rgb(220 235 255 / 0.82);
  font-size: 13px;
  backdrop-filter: blur(10px);
}

.badge-icon {
  font-size: 14px;
  color: var(--scene-primary, #7ec0ff);
}

.hero-title {
  margin: 0;
  color: #fff;
  font-size: clamp(32px, 5.2vw, 48px);
  font-weight: 700;
  line-height: 1.14;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  margin: 14px 0 0;
  color: rgb(210 228 255 / 0.72);
  font-size: 15px;
  line-height: 1.65;
}

.login-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 28px;
  padding: 16px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 18px;
  background: rgb(6 14 28 / 0.58);
  backdrop-filter: blur(14px);
  box-shadow: 0 20px 48px rgb(0 0 0 / 0.22);
}

.field-box {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  min-height: 68px;
  padding: 0 16px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 12px;
  background: rgb(10 20 38 / 0.72);
  transition: border-color 0.2s ease, background 0.2s ease;

  &:focus-within {
    border-color: rgb(120 180 255 / 0.4);
    background: rgb(12 26 48 / 0.82);
  }

  input {
    width: 100%;
    border: 0;
    outline: none;
    background: transparent;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
  }
}

.field-label {
  color: rgb(200 220 255 / 0.5);
  font-size: 12px;
  line-height: 1;
}

.btn-enter {
  height: 48px;
  margin-top: 4px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(180deg, #4d9bff 0%, #2f7cf0 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 10px 28px rgb(47 124 240 / 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 14px 32px rgb(47 124 240 / 0.45);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.72;
  }
}

@media (max-width: 640px) {
  .space-login-hero {
    padding-top: calc(var(--space-header-height, 59px) + 32px);
  }

  .hero-panel {
    width: 100%;
    margin-top: 0;
  }

  .login-card {
    margin-top: 22px;
  }
}
</style>

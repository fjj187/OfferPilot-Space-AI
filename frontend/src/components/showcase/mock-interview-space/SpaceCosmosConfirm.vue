<script lang="ts" setup>
withDefaults(defineProps<{
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  /** 主操作使用宇宙页主题色（如退出登录） */
  confirmPrimary?: boolean
}>(), {
  confirmText: '确认',
  cancelText: '取消',
  confirmPrimary: false
})

const emit = defineEmits<{
  'update:show': [value: boolean]
  confirm: []
  cancel: []
}>()

const close = () => {
  emit('update:show', false)
}

const handleCancel = () => {
  emit('cancel')
  close()
}

const handleConfirm = () => {
  emit('confirm')
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="space-cosmos-confirm-fade">
      <div
        v-if="show"
        class="space-cosmos-confirm-overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        @click.self="handleCancel"
      >
        <div class="space-cosmos-confirm-dialog">
          <div class="space-cosmos-confirm-kicker">
            <span class="i-lucide-orbit kicker-icon"></span>
            Interview Cosmos
          </div>
          <h2 class="space-cosmos-confirm-title">
            {{ title }}
          </h2>
          <p class="space-cosmos-confirm-message">
            {{ message }}
          </p>
          <div class="space-cosmos-confirm-actions">
            <button
              type="button"
              class="space-cosmos-confirm-btn"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              class="space-cosmos-confirm-btn"
              :class="{ 'is-primary': confirmPrimary }"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.space-cosmos-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
  radial-gradient(circle at 20% 12%, rgb(118 247 234 / 0.08) 0%, transparent 42%),
  radial-gradient(circle at 82% 78%, rgb(120 166 255 / 0.1) 0%, transparent 38%),
  rgb(5 8 16 / 0.78);
  backdrop-filter: blur(14px);
}

.space-cosmos-confirm-dialog {
  position: relative;
  width: min(420px, 100%);
  padding: 22px 22px 18px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 20px;
  background:
    linear-gradient(165deg, rgb(29 29 73 / 0.97) 0%, rgb(36 32 95 / 0.97) 52%, rgb(12 20 38 / 0.98) 100%);
  box-shadow:
    0 24px 60px rgb(3 6 18 / 0.45),
    inset 0 1px 0 rgb(255 255 255 / 0.07);
  overflow: hidden;
}

.space-cosmos-confirm-dialog::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 88% 0%, rgb(118 247 234 / 0.12) 0%, transparent 46%);
  pointer-events: none;
}

.space-cosmos-confirm-kicker {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--scene-primary, #76f7ea);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.kicker-icon {
  font-size: 14px;
}

.space-cosmos-confirm-title {
  position: relative;
  margin: 12px 0 0;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
}

.space-cosmos-confirm-message {
  position: relative;
  margin: 10px 0 0;
  color: rgb(232 238 255 / 0.78);
  font-size: 14px;
  line-height: 1.7;
}

.space-cosmos-confirm-actions {
  position: relative;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.space-cosmos-confirm-btn {
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
  color: rgb(244 247 255 / 0.92);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.space-cosmos-confirm-btn:hover {
  border-color: rgb(255 255 255 / 0.22);
  background: rgb(255 255 255 / 0.11);
  transform: translateY(-1px);
}

.space-cosmos-confirm-btn.is-primary {
  border-color: rgb(113 227 224 / 0.14);
  background: var(--scene-primary, #76f7ea);
  color: #0a1520;
  font-weight: 600;
}

.space-cosmos-confirm-btn.is-primary:hover {
  border-color: rgb(255 255 255 / 0.12);
  background: #fff;
  color: #0a1520;
}

.space-cosmos-confirm-fade-enter-active,
.space-cosmos-confirm-fade-leave-active {
  transition: opacity 0.22s ease;
}

.space-cosmos-confirm-fade-enter-active .space-cosmos-confirm-dialog,
.space-cosmos-confirm-fade-leave-active .space-cosmos-confirm-dialog {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.space-cosmos-confirm-fade-enter-from,
.space-cosmos-confirm-fade-leave-to {
  opacity: 0;
}

.space-cosmos-confirm-fade-enter-from .space-cosmos-confirm-dialog,
.space-cosmos-confirm-fade-leave-to .space-cosmos-confirm-dialog {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}
</style>

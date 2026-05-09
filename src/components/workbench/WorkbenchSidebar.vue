<script lang="ts" setup>
import type { SidebarItem } from '@/views/workbench/workbench.data'

interface Props {
  items: SidebarItem[]
  activePath: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  navigate: [path: string]
}>()

const handleNavigate = (path: string) => {
  emit('navigate', path)
}

const isActive = (path: string) => props.activePath === path
</script>

<template>
  <div class="sidebar-shell">
    <div class="sidebar-brand">
      <div class="brand-mark">
        <span class="i-lucide-brain-circuit"></span>
      </div>
      <div>
        <div class="brand-title">PrepChain</div>
        <div class="brand-subtitle">AI 面试训练台</div>
      </div>
    </div>

    <n-button
      type="primary"
      size="large"
      round
      class="sidebar-cta"
    >
      <template #icon>
        <span class="i-lucide-play"></span>
      </template>
      开始训练
    </n-button>

    <div class="sidebar-menu">
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        class="sidebar-item"
        :class="{ 'is-active': isActive(item.path) }"
        @click="handleNavigate(item.path)"
      >
        <span
          class="sidebar-item-icon"
          :class="item.icon"
        ></span>
        <span class="sidebar-item-label">{{ item.label }}</span>
        <span
          v-if="item.badge"
          class="sidebar-item-badge"
        >{{ item.badge }}</span>
      </button>
    </div>

    <div class="sidebar-footer">
      <div class="sidebar-footer-card">
        <div class="sidebar-footer-title">当前训练主题</div>
        <div class="sidebar-footer-value">前端开发 / 社招一面</div>
        <div class="sidebar-footer-meta">偏重项目表达 + 框架原理</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 26px 18px 18px;
  background:
    radial-gradient(circle at top left, rgb(124 138 255 / 14%), transparent 36%),
    linear-gradient(180deg, #f8faff 0%, #f5f7fc 100%);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #5c77ff 0%, #7bc6ff 100%);
  box-shadow: 0 18px 30px rgb(95 121 255 / 24%);
  font-size: 24px;
}

.brand-title {
  font-size: 24px;
  font-weight: 700;
  color: #1d2440;
}

.brand-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #73809a;
}

.sidebar-cta {
  height: 48px;
  margin-bottom: 22px;
  --n-color: #5f79ff !important;
  --n-color-hover: #556fff !important;
  --n-color-pressed: #4d67f2 !important;
  --n-box-shadow-focus: 0 0 0 2px rgb(95 121 255 / 18%) !important;
}

.sidebar-menu {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 0;
  border-radius: 16px;
  background: transparent;
  color: #6f7c95;
  transition: 0.25s ease;
  cursor: pointer;
}

.sidebar-item:hover,
.sidebar-item.is-active {
  background: #fff;
  color: #1f2746;
  box-shadow: 0 10px 24px rgb(31 39 70 / 8%);
}

.sidebar-item-icon {
  font-size: 18px;
}

.sidebar-item-label {
  flex: 1;
  text-align: left;
  font-size: 15px;
  font-weight: 600;
}

.sidebar-item-badge {
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  line-height: 24px;
  border-radius: 999px;
  background: #eef2ff;
  color: #5f79ff;
  font-size: 12px;
  font-weight: 700;
}

.sidebar-footer {
  padding-top: 18px;
}

.sidebar-footer-card {
  padding: 16px;
  border: 1px solid #ebeff6;
  border-radius: 20px;
  background: rgb(255 255 255 / 88%);
}

.sidebar-footer-title {
  font-size: 12px;
  color: #8b96ae;
}

.sidebar-footer-value {
  margin-top: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #1f2746;
}

.sidebar-footer-meta {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: #73809a;
}
</style>

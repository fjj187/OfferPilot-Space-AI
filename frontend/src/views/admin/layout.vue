<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { displayName, authRole, logout } = useAuth()

const navItems = [
  {
    name: 'AdminDashboard',
    label: '数据看板'
  },
  {
    name: 'AdminSessions',
    label: '会话管理'
  },
  {
    name: 'AdminReports',
    label: '报告管理'
  }
] as const

const handleLogout = () => {
  logout()
  void router.replace({
    name: 'AdminLogin',
    query: {
      fromLogout: '1'
    }
  })
}
</script>

<template>
  <main class="admin-layout">
    <aside class="admin-sidebar">
      <div class="brand">
        <span class="brand-mark">OP</span>
        <div>
          <strong>OfferPilot</strong>
          <span>后台管理</span>
        </div>
      </div>

      <nav class="admin-nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="identity-bubble">
          <strong>{{ authRole === 'admin' ? '管理员' : displayName }}</strong>
        </div>

        <button
          type="button"
          class="sidebar-logout"
          @click="handleLogout"
        >
          退出登录
        </button>
      </div>
    </aside>

    <section class="admin-main">
      <div class="admin-content-scroll">
        <RouterView />
      </div>
    </section>
  </main>
</template>

<style scoped lang="scss">
.admin-layout {
  --admin-bg: #06101d;
  --admin-bg-soft: rgb(7 18 34 / 0.78);
  --admin-panel: rgb(10 24 46 / 0.76);
  --admin-panel-strong: rgb(12 30 56 / 0.9);
  --admin-border: rgb(129 212 250 / 0.18);
  --admin-text: #eff6ff;
  --admin-text-soft: rgb(217 234 255 / 0.74);
  --admin-accent: #67e8f9;
  --admin-accent-strong: #22c55e;
  --admin-shadow: 0 24px 80px rgb(2 6 23 / 0.34);
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  height: 100vh;
  overflow: hidden;
  color: var(--admin-text);
  background:
    radial-gradient(circle at 15% 18%, rgb(34 211 238 / 0.14), transparent 22%),
    radial-gradient(circle at 82% 12%, rgb(59 130 246 / 0.2), transparent 24%),
    radial-gradient(circle at 74% 68%, rgb(34 197 94 / 0.12), transparent 26%),
    linear-gradient(135deg, #030712 0%, #07111f 38%, #0a1930 100%);
}

.admin-sidebar {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 28px 24px;
  min-height: 0;
  border-right: 1px solid rgb(129 212 250 / 0.1);
  background:
    linear-gradient(180deg, rgb(3 10 24 / 0.96) 0%, rgb(5 16 33 / 0.92) 100%);
  box-shadow: inset -1px 0 0 rgb(255 255 255 / 0.03);
}

.brand {
  display: flex;
  gap: 16px;
  align-items: center;

  div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  strong {
    font-size: 18px;
    letter-spacing: -0.03em;
  }

  span {
    color: var(--admin-text-soft);
    font-size: 14px;
  }
}

.brand-mark {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border-radius: 18px;
  background:
    radial-gradient(circle at 30% 25%, rgb(255 255 255 / 0.76), transparent 26%),
    linear-gradient(135deg, #67e8f9 0%, #38bdf8 32%, #22c55e 100%);
  color: #06111f !important;
  font-size: 18px;
  font-weight: 900;
  box-shadow: 0 12px 30px rgb(34 211 238 / 0.26);
}

.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;

  a {
    position: relative;
    padding: 14px 16px;
    border: 1px solid transparent;
    border-radius: 18px;
    color: var(--admin-text-soft);
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
    transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, color 180ms ease;

    &:hover {
      border-color: rgb(103 232 249 / 0.16);
      background: rgb(103 232 249 / 0.08);
      color: var(--admin-text);
      transform: translateX(4px);
    }
  }

  .router-link-active {
    border-color: rgb(103 232 249 / 0.22);
    background:
      linear-gradient(135deg, rgb(103 232 249 / 0.18), rgb(34 197 94 / 0.14));
    color: #fff;
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08);
  }
}

.sidebar-footer {
  display: flex;
  flex: 1;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding-top: 20px;
}

.identity-bubble {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 18px;
  border: 1px solid rgb(129 212 250 / 0.12);
  border-radius: 999px;
  background:
    radial-gradient(circle at 18% 20%, rgb(255 255 255 / 0.08), transparent 28%),
    linear-gradient(135deg, rgb(103 232 249 / 0.1), rgb(34 197 94 / 0.08));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.05);
  cursor: default;
  user-select: none;
  opacity: 0.92;
}

.identity-bubble strong {
  color: #f8fbff;
  font-size: 15px;
  line-height: 1;
}

.sidebar-logout {
  min-height: 48px;
  padding: 0 18px;
  border: 1px solid rgb(103 232 249 / 0.26);
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgb(8 22 40 / 0.92), rgb(14 34 58 / 0.88));
  color: var(--admin-text);
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.08),
    0 10px 24px rgb(2 6 23 / 0.2);
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;

  &:hover {
    border-color: rgb(103 232 249 / 0.42);
    background:
      linear-gradient(135deg, rgb(18 49 78 / 0.96), rgb(24 68 96 / 0.92));
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.1),
      0 14px 28px rgb(34 211 238 / 0.12);
    transform: translateY(-1px) scale(1.01);
  }
}

.admin-main {
  display: flex;
  min-height: 0;
  overflow: hidden;
  flex-direction: column;
  min-width: 0;
  padding: 28px 30px 36px;
}

.admin-content-scroll {
  min-height: 0;
  overflow-y: auto;
  padding-right: 6px;
  scrollbar-width: thin;
  scrollbar-color: rgb(103 232 249 / 0.22) transparent;

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    border: 2px solid transparent;
    border-radius: 999px;
    background: rgb(103 232 249 / 0.16);
    background-clip: padding-box;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgb(103 232 249 / 0.28);
    background-clip: padding-box;
  }
}

@media (max-width: 860px) {
  .admin-layout {
    grid-template-columns: 1fr;
    height: auto;
    overflow: visible;
  }

  .admin-sidebar {
    position: sticky;
    top: 0;
    z-index: 2;
    padding: 20px 16px;
  }

  .admin-nav {
    flex-direction: row;
    overflow-x: auto;
  }

  .sidebar-footer {
    padding-top: 16px;
  }

  .admin-main {
    padding: 18px 16px 28px;
    overflow: visible;
  }

  .admin-content-scroll {
    overflow: visible;
    padding-right: 0;
  }
}
</style>

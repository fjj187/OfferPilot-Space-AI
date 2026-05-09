export interface SidebarItem {
  key: string
  label: string
  icon: string
  path: string
  badge?: string
}

export const sidebarItems: SidebarItem[] = [
  { key: 'overview', label: '总览', icon: 'i-lucide-layout-dashboard', path: '/workspace/overview', badge: '3' },
  { key: 'library', label: '资料库', icon: 'i-lucide-folder-open', path: '/workspace/library' },
  { key: 'mock', label: '模拟面试', icon: 'i-lucide-message-circle-more', path: '/workspace/mock-interview' },
  { key: 'practice', label: '专项刷题', icon: 'i-lucide-scroll-text', path: '/workspace/practice' },
  { key: 'report', label: '复盘报告', icon: 'i-lucide-chart-column-big', path: '/workspace/report' },
  { key: 'history', label: '训练历史', icon: 'i-lucide-history', path: '/workspace/history' }
]

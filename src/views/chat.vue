<script lang="ts" setup>
const sidebarItems = [
  { key: 'overview', label: '总览', icon: 'i-lucide-layout-dashboard', badge: '3' },
  { key: 'library', label: '资料库', icon: 'i-lucide-folder-open' },
  { key: 'mock', label: '模拟面试', icon: 'i-lucide-message-circle-more' },
  { key: 'practice', label: '专项刷题', icon: 'i-lucide-scroll-text' },
  { key: 'report', label: '复盘报告', icon: 'i-lucide-chart-column-big' },
  { key: 'history', label: '训练历史', icon: 'i-lucide-history' }
]

const quickTopics = ['Vue 3', 'TypeScript', '工程化', '浏览器', '性能优化', '场景题']

const libraryCards = [
  {
    title: '前端八股总纲.md',
    meta: '128 个知识点 · 已切片',
    desc: '覆盖 Vue、TS、浏览器、性能优化和工程化，适合作为主资料库。',
    accent: 'from-[#6aa7ff] to-[#8ed0ff]'
  },
  {
    title: '项目复盘沉淀.docx',
    meta: '36 个项目问答 · 已解析',
    desc: '偏项目场景和表达组织，适合模拟面试中的追问环节。',
    accent: 'from-[#8f7cff] to-[#c7a6ff]'
  },
  {
    title: '高频追问清单.md',
    meta: '52 道追问题 · 待补充',
    desc: '用于专项刷题，适合训练“继续追问时怎么答”。',
    accent: 'from-[#57c9a3] to-[#8fe3c9]'
  }
]

const practiceQueue = [
  {
    title: 'Vue 响应式原理',
    progress: 82,
    note: '更适合做深挖题'
  },
  {
    title: 'TypeScript 泛型与约束',
    progress: 61,
    note: '概念会说，场景表达偏弱'
  },
  {
    title: '性能优化实战',
    progress: 48,
    note: '项目化表达还不够稳'
  }
]

const guidanceCards = [
  {
    title: '开始一轮模拟面试',
    desc: '基于你当前资料库，生成 10 道前端高频题并逐题追问。',
    tone: 'primary'
  },
  {
    title: '针对薄弱点专项刷题',
    desc: '围绕 TypeScript 和性能优化，快速练 6 道题。',
    tone: 'neutral'
  },
  {
    title: '生成本周复盘报告',
    desc: '汇总最近 3 次训练的薄弱点、建议和推荐题单。',
    tone: 'neutral'
  }
]

const interviewFlow = [
  { label: '导入资料', detail: 'md / docx / 文件夹', icon: 'i-lucide-file-up' },
  { label: 'AI 生成题纲', detail: '按主题与难度定制', icon: 'i-lucide-sparkles' },
  { label: '模拟提问', detail: '逐题追问与引导', icon: 'i-lucide-badge-help' },
  { label: '复盘输出', detail: '弱点报告与完整问卷', icon: 'i-lucide-file-text' }
]
</script>

<template>
  <LayoutCenterPanel :loading="false">
    <template #sidebar>
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
            v-for="item in sidebarItems"
            :key="item.key"
            type="button"
            class="sidebar-item"
            :class="{ 'is-active': item.key === 'overview' }"
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

    <div class="workspace">
      <header class="workspace-header">
        <div class="header-search">
          <span class="i-lucide-search search-icon"></span>
          <input
            type="text"
            placeholder="搜索资料、知识点或历史训练..."
          >
        </div>

        <div class="header-actions">
          <button
            type="button"
            class="header-action-btn"
          >
            <span class="i-lucide-bell"></span>
          </button>

          <div class="profile-pill">
            <n-avatar
              round
              :size="34"
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
            />
            <div>
              <div class="profile-name">Nicholas Turner</div>
              <div class="profile-role">Frontend Candidate</div>
            </div>
          </div>
        </div>
      </header>

      <main class="workspace-body">
        <section class="main-stage">
          <div class="hero-panel">
            <div class="hero-copy">
              <div class="hero-badge">本周训练计划</div>
              <h1>把你的面试资料库，变成可追问、可复盘的 AI 面试官。</h1>
              <p>
                导入自己的 md 和 Word 面试资料，开始一轮更像真实场景的模拟面试，
                最后自动沉淀薄弱点报告和完整问卷。
              </p>
              <div class="hero-actions">
                <n-button
                  type="primary"
                  round
                  size="large"
                >
                  导入资料并开始
                </n-button>
                <n-button
                  ghost
                  round
                  size="large"
                  color="#6c7df7"
                >
                  查看复盘样例
                </n-button>
              </div>
            </div>

            <div class="hero-stats">
              <div class="stat-card stat-primary">
                <div class="stat-label">本周已训练</div>
                <div class="stat-value">08 次</div>
                <div class="stat-meta">连续 4 天保持输出</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">资料库文档</div>
                <div class="stat-value">24 份</div>
                <div class="stat-meta">共切分 312 个知识片段</div>
              </div>
            </div>
          </div>

          <div class="topic-row">
            <button
              v-for="topic in quickTopics"
              :key="topic"
              type="button"
              class="topic-chip"
              :class="{ 'is-active': topic === 'Vue 3' }"
            >
              {{ topic }}
            </button>
          </div>

          <div class="section-head">
            <div>
              <div class="section-kicker">资料库概览</div>
              <h2>最近导入的核心资料</h2>
            </div>
            <n-button
              text
              type="primary"
            >
              查看全部
            </n-button>
          </div>

          <div class="library-grid">
            <article
              v-for="card in libraryCards"
              :key="card.title"
              class="library-card"
            >
              <div
                class="library-card-banner"
                :class="`bg-gradient-to-br ${card.accent}`"
              ></div>
              <div class="library-card-body">
                <div class="library-card-meta">{{ card.meta }}</div>
                <h3>{{ card.title }}</h3>
                <p>{{ card.desc }}</p>
                <div class="library-card-footer">
                  <span class="i-lucide-file-text"></span>
                  <span>可用于生成面试题与知识卡片</span>
                </div>
              </div>
            </article>
          </div>

          <div class="section-head compact">
            <div>
              <div class="section-kicker">训练闭环</div>
              <h2>一轮完整面试会怎么走</h2>
            </div>
          </div>

          <div class="flow-grid">
            <article
              v-for="step in interviewFlow"
              :key="step.label"
              class="flow-card"
            >
              <div
                class="flow-icon"
                :class="step.icon"
              ></div>
              <div class="flow-title">{{ step.label }}</div>
              <div class="flow-detail">{{ step.detail }}</div>
            </article>
          </div>
        </section>

        <aside class="right-rail">
          <section class="rail-card">
            <div class="rail-card-head">
              <div>
                <div class="section-kicker">AI 引导</div>
                <h3>建议你先做这些</h3>
              </div>
            </div>

            <div class="guidance-list">
              <button
                v-for="card in guidanceCards"
                :key="card.title"
                type="button"
                class="guidance-card"
                :class="{ 'is-primary': card.tone === 'primary' }"
              >
                <div class="guidance-title">{{ card.title }}</div>
                <div class="guidance-desc">{{ card.desc }}</div>
              </button>
            </div>
          </section>

          <section class="rail-card">
            <div class="rail-card-head">
              <div>
                <div class="section-kicker">专项训练队列</div>
                <h3>你的薄弱点分布</h3>
              </div>
              <span class="i-lucide-sliders-horizontal rail-icon"></span>
            </div>

            <div class="queue-list">
              <div
                v-for="item in practiceQueue"
                :key="item.title"
                class="queue-item"
              >
                <div class="queue-copy">
                  <div class="queue-title">{{ item.title }}</div>
                  <div class="queue-note">{{ item.note }}</div>
                </div>
                <n-progress
                  type="line"
                  :percentage="item.progress"
                  indicator-placement="inside"
                  rail-color="#edf1f7"
                  color="#6c7df7"
                  :height="10"
                  :border-radius="999"
                />
              </div>
            </div>
          </section>

          <section class="rail-card accent-card">
            <div class="accent-top">
              <div>
                <div class="section-kicker">复盘快照</div>
                <h3>最近一次模拟面试</h3>
              </div>
              <span class="pill-tag">已完成</span>
            </div>

            <div class="snapshot-score">
              <div>
                <div class="score-label">综合表现</div>
                <div class="score-value">82 / 100</div>
              </div>
              <div class="score-trend">较上次 +9</div>
            </div>

            <ul class="snapshot-list">
              <li>Vue 生命周期与组合式 API 表达更流畅</li>
              <li>TypeScript 场景题有明显卡顿</li>
              <li>性能优化回答还缺量化指标</li>
            </ul>

            <n-button
              type="primary"
              block
              round
            >
              打开完整复盘报告
            </n-button>
          </section>
        </aside>
      </main>
    </div>
  </LayoutCenterPanel>
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

.workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top right, rgb(113 135 255 / 10%), transparent 32%),
    linear-gradient(180deg, #fbfcff 0%, #f4f7fb 100%);
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 30px 12px;
}

.header-search {
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(520px, 100%);
  height: 54px;
  padding: 0 18px;
  border: 1px solid #e7ecf5;
  border-radius: 18px;
  background: rgb(255 255 255 / 88%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 60%);
}

.header-search input {
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: #25304a;
}

.header-search input::placeholder {
  color: #97a3b8;
}

.search-icon {
  color: #8c98af;
  font-size: 18px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-action-btn {
  width: 48px;
  height: 48px;
  border: 1px solid #e7ecf5;
  border-radius: 16px;
  background: rgb(255 255 255 / 88%);
  color: #50607d;
  font-size: 18px;
  cursor: pointer;
}

.profile-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px 4px 6px;
  border: 1px solid #e7ecf5;
  border-radius: 14px;
  background: rgb(255 255 255 / 88%);
}

.profile-name {
  font-size: 13px;
  font-weight: 700;
  color: #1f2746;
  line-height: 1.15;
}

.profile-role {
  margin-top: 0;
  font-size: 11px;
  line-height: 1.15;
  color: #8290a8;
}

.workspace-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 2.1fr) minmax(240px, 315px);
  gap: 22px;
  padding: 0 30px 28px;
  overflow: hidden;
}

.main-stage,
.right-rail {
  min-height: 0;
  overflow-y: auto;
}

.main-stage {
  padding-right: 6px;
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(220px, 0.75fr);
  gap: 18px;
  margin-bottom: 18px;
}

.hero-copy,
.stat-card,
.library-card,
.flow-card,
.rail-card {
  border: 1px solid #e8edf6;
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 7%);
}

.hero-copy {
  padding: 26px 28px;
  border-radius: 28px;
}

.hero-badge,
.section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 16px 0 14px;
  font-size: 34px;
  line-height: 1.15;
  color: #1d2440;
}

.hero-copy p {
  max-width: 90%;
  margin: 0;
  font-size: 15px;
  line-height: 1.8;
  color: #6d7a92;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.hero-stats {
  display: grid;
  gap: 16px;
}

.stat-card {
  padding: 20px;
  border-radius: 24px;
}

.stat-primary {
  background: linear-gradient(135deg, #eff3ff 0%, #f5fbff 100%);
}

.stat-label,
.library-card-meta,
.score-label {
  font-size: 12px;
  color: #8d98b0;
}

.stat-value {
  margin-top: 12px;
  font-size: 30px;
  font-weight: 700;
  color: #1e2642;
}

.stat-meta {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #697690;
}

.topic-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.topic-chip {
  padding: 10px 16px;
  border: 1px solid #e3e9f4;
  border-radius: 999px;
  background: rgb(255 255 255 / 82%);
  color: #66758f;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s ease;
}

.topic-chip.is-active,
.topic-chip:hover {
  border-color: #d8e0ff;
  background: #eef2ff;
  color: #5c72ef;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.section-head h2,
.rail-card-head h3,
.accent-top h3 {
  margin: 6px 0 0;
  font-size: 22px;
  color: #1f2746;
}

.section-head.compact {
  margin-top: 20px;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.library-card {
  overflow: hidden;
  border-radius: 24px;
}

.library-card-banner {
  height: 120px;
}

.library-card-body {
  padding: 18px 18px 20px;
}

.library-card-body h3 {
  margin: 10px 0 10px;
  font-size: 18px;
  line-height: 1.35;
  color: #1e2642;
}

.library-card-body p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #6b7790;
}

.library-card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: #7b88a0;
  font-size: 13px;
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 10px;
}

.flow-card {
  padding: 18px;
  border-radius: 22px;
}

.flow-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #eef2ff;
  color: #5f79ff;
  font-size: 20px;
}

.flow-title {
  margin-top: 18px;
  font-size: 16px;
  font-weight: 700;
  color: #1f2746;
}

.flow-detail {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #75829b;
}

.right-rail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rail-card {
  padding: 20px;
  border-radius: 24px;
}

.rail-card-head,
.accent-top,
.snapshot-score {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.rail-icon {
  color: #93a0b6;
  font-size: 18px;
}

.guidance-list,
.queue-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.guidance-card {
  padding: 16px;
  border: 1px solid #e9edf6;
  border-radius: 18px;
  background: #f9fbff;
  text-align: left;
  cursor: pointer;
  transition: 0.2s ease;
}

.guidance-card.is-primary {
  background: linear-gradient(135deg, #edf1ff 0%, #f5fbff 100%);
  border-color: #dce5ff;
}

.guidance-card:hover {
  box-shadow: 0 12px 28px rgb(36 53 87 / 8%);
}

.guidance-title,
.queue-title {
  font-size: 15px;
  font-weight: 700;
  color: #1f2746;
}

.guidance-desc,
.queue-note,
.snapshot-list {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #75829b;
}

.queue-item {
  padding: 16px;
  border: 1px solid #edf1f7;
  border-radius: 18px;
  background: #fbfcff;
}

.queue-copy {
  margin-bottom: 12px;
}

.accent-card {
  background: linear-gradient(180deg, #f8faff 0%, #ffffff 100%);
}

.pill-tag {
  padding: 7px 12px;
  border-radius: 999px;
  background: #eef8f4;
  color: #2f8f67;
  font-size: 12px;
  font-weight: 700;
}

.snapshot-score {
  margin-top: 18px;
  padding: 16px 18px;
  border-radius: 18px;
  background: #f6f8fd;
}

.score-value {
  margin-top: 8px;
  font-size: 30px;
  font-weight: 800;
  color: #1f2746;
}

.score-trend {
  font-size: 13px;
  font-weight: 700;
  color: #4ea77a;
}

.snapshot-list {
  margin: 16px 0 18px;
  padding-left: 18px;
}

.snapshot-list li + li {
  margin-top: 10px;
}

@media (max-width: 1440px) {
  .workspace-body {
    grid-template-columns: minmax(0, 1fr) 280px;
  }

  .library-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .flow-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .hero-panel {
    grid-template-columns: 1fr;
  }

  .workspace-body {
    grid-template-columns: 1fr;
  }

  .right-rail {
    padding-right: 6px;
  }
}

@media (max-width: 900px) {
  .workspace-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-search {
    width: 100%;
  }

  .header-actions {
    justify-content: space-between;
  }

  .library-grid,
  .flow-grid {
    grid-template-columns: 1fr;
  }

  .hero-copy h1 {
    font-size: 28px;
  }
}
</style>

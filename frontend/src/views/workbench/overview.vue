<script lang="ts" setup>
import TopicChips from '@/components/workbench/TopicChips.vue'
import WorkbenchContentShell from '@/components/workbench/WorkbenchContentShell.vue'
import { useOverviewLaunchState } from '@/composables/workspace/useOverviewLaunchState'
import { type OverviewTopicKey, quickTopics } from './overview.data'

const router = useRouter()

const {
  activeTopic,
  activeDocument,
  currentModeLabel,
  currentSourceLabel,
  currentTopicLabel,
  inProgressSession,
  latestCompletedSession,
  latestReportSummary,
  progressPercent,
  progressText,
  latestWeaknessTags,
  latestSummaryText,
  primaryActionLabel,
  railSteps,
  mockInterviewQuery,
  libraryQuery,
  reportQuery,
  setActiveTopic
} = useOverviewLaunchState()

const summaryStats = computed(() => [
  {
    label: '当前进度',
    value: `${ progressPercent.value }%`,
    note: progressText.value
  },
  {
    label: '最近完成',
    value: latestReportSummary.value ? `${ latestReportSummary.value.answeredCount } 题` : '暂无记录',
    note: latestCompletedSession.value?.finishedAt || latestReportSummary.value?.createdAt || '完成后会出现在这里'
  },
  {
    label: '薄弱信号',
    value: latestWeaknessTags.value[0] || '尚未形成稳定弱项',
    note: latestWeaknessTags.value.slice(1, 3).join(' / ') || '继续训练后会逐步收敛'
  }
])

const handleTopicChange = (topic: string) => {
  setActiveTopic(topic as OverviewTopicKey)
}

const handlePrimaryAction = () => {
  router.push({
    name: 'WorkbenchMockInterview',
    query: mockInterviewQuery.value
  })
}

const handleOpenLibrary = () => {
  router.push({
    name: 'WorkbenchLibrary',
    query: libraryQuery.value
  })
}

const handleOpenReport = () => {
  router.push({
    name: 'WorkbenchReport',
    query: reportQuery.value
  })
}
</script>

<template>
  <WorkbenchContentShell>
    <section class="launch-hero">
      <div class="hero-copy">
        <div class="hero-kicker">训练任务启动页</div>
        <h1>{{ currentTopicLabel }}</h1>
        <p class="hero-note">{{ latestSummaryText }}</p>
      </div>

      <div class="hero-actions">
        <n-button
          type="primary"
          size="large"
          @click="handlePrimaryAction"
        >
          {{ primaryActionLabel }}
        </n-button>
        <n-button
          tertiary
          size="large"
          @click="handleOpenLibrary"
        >
          查看资料
        </n-button>
        <n-button
          tertiary
          size="large"
          @click="handleOpenReport"
        >
          查看报告
        </n-button>
      </div>
    </section>

    <TopicChips
      :topics="quickTopics"
      :active-topic="activeTopic"
      @change="handleTopicChange"
    />

    <section class="mission-panel">
      <div class="mission-main">
        <div class="meta-row">
          <div class="meta-pill">
            <span class="meta-label">当前模式</span>
            <strong>{{ currentModeLabel }}</strong>
          </div>
          <div class="meta-pill">
            <span class="meta-label">资料来源</span>
            <strong>{{ activeDocument?.name || currentSourceLabel }}</strong>
          </div>
          <div class="meta-pill">
            <span class="meta-label">当前状态</span>
            <strong>{{ inProgressSession ? '存在未完成 session' : '可开始新一轮训练' }}</strong>
          </div>
        </div>

        <div class="progress-block">
          <div class="progress-head">
            <div>
              <div class="section-kicker">主任务区</div>
              <h2>继续当前训练链路</h2>
            </div>
            <strong class="progress-value">{{ progressPercent }}%</strong>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
          <p class="progress-text">{{ progressText }}</p>
        </div>
      </div>

      <div class="mission-side">
        <div class="side-card">
          <div class="section-kicker">训练摘要</div>
          <h3>最近结果承接</h3>
          <ul class="summary-list">
            <li
              v-for="item in summaryStats"
              :key="item.label"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <small>{{ item.note }}</small>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="rail-section">
      <div class="section-kicker">轨道概览</div>
      <div class="rail-line">
        <div
          v-for="step in railSteps"
          :key="step.key"
          class="rail-step"
          :class="{ 'is-active': step.active, 'is-done': step.done }"
        >
          <span class="rail-dot"></span>
          <span class="rail-name">{{ step.label }}</span>
        </div>
      </div>
    </section>

    <section class="secondary-grid">
      <div class="secondary-card">
        <div class="section-kicker">训练摘要区</div>
        <h3>当前最需要关注的薄弱点</h3>
        <div
          v-if="latestWeaknessTags.length"
          class="tag-row"
        >
          <span
            v-for="tag in latestWeaknessTags.slice(0, 4)"
            :key="tag"
            class="weakness-tag"
          >{{ tag }}</span>
        </div>
        <p
          v-else
          class="empty-note"
        >
          还没有稳定的薄弱项标签，先完成一轮训练。
        </p>
      </div>

      <div class="secondary-card">
        <div class="section-kicker">次级入口</div>
        <h3>辅助动作</h3>
        <div class="action-list">
          <button
            type="button"
            class="action-item"
            @click="handleOpenLibrary"
          >
            打开资料页
          </button>
          <button
            type="button"
            class="action-item"
            @click="handleOpenReport"
          >
            打开报告页
          </button>
          <button
            type="button"
            class="action-item"
            @click="handlePrimaryAction"
          >
            {{ primaryActionLabel }}
          </button>
        </div>
      </div>
    </section>
  </WorkbenchContentShell>
</template>

<style lang="scss" scoped>
.launch-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.hero-kicker,
.section-kicker {
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  color: #6f7dfa;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 10px 0 0;
  font-size: clamp(34px, 4vw, 52px);
  line-height: 1.02;
  color: #18233d;
}

.hero-note {
  max-width: 700px;
  margin: 14px 0 0;
  color: #71809a;
  font-size: 15px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

.mission-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.9fr);
  gap: 18px;
  margin-bottom: 22px;
}

.mission-main,
.mission-side,
.rail-section,
.secondary-card {
  padding: 22px;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: rgb(255 255 255 / 86%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 6%);
}

.meta-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.meta-pill {
  padding: 14px 16px;
  border-radius: 18px;
  background: #f6f8fc;
}

.meta-label {
  display: block;
  margin-bottom: 6px;
  color: #8592a8;
  font-size: 12px;
}

.meta-pill strong {
  color: #1f2746;
  font-size: 14px;
}

.progress-block {
  margin-top: 18px;
}

.progress-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.progress-head h2,
.side-card h3,
.secondary-card h3 {
  margin: 8px 0 0;
  color: #1f2746;
  font-size: 24px;
}

.progress-value {
  color: #5c72ef;
  font-size: 28px;
}

.progress-track {
  height: 12px;
  margin-top: 18px;
  overflow: hidden;
  border-radius: 999px;
  background: #edf1f7;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #6d82ff 0%, #8bb9ff 100%);
}

.progress-text {
  margin: 10px 0 0;
  color: #75839b;
  font-size: 14px;
}

.summary-list {
  display: grid;
  gap: 12px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.summary-list li {
  display: grid;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f6f8fc;
}

.summary-list span,
.summary-list small {
  color: #7a879d;
}

.summary-list strong {
  color: #1f2746;
  font-size: 18px;
}

.rail-section {
  margin-bottom: 22px;
}

.rail-line {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.rail-step {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 12px;
  text-align: center;
}

.rail-step::after {
  content: "";
  position: absolute;
  top: 8px;
  left: calc(50% + 18px);
  width: calc(100% - 36px);
  height: 2px;
  background: #e2e8f3;
}

.rail-step:last-child::after {
  display: none;
}

.rail-dot {
  width: 18px;
  height: 18px;
  border: 3px solid #cfd8ea;
  border-radius: 999px;
  background: #fff;
}

.rail-name {
  color: #6f7b91;
  font-size: 14px;
  font-weight: 600;
}

.rail-step.is-done .rail-dot,
.rail-step.is-active .rail-dot {
  border-color: #6f7dfa;
  background: #6f7dfa;
}

.rail-step.is-done::after {
  background: #6f7dfa;
}

.rail-step.is-active .rail-name {
  color: #23304b;
}

.secondary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.weakness-tag {
  padding: 10px 14px;
  border-radius: 999px;
  background: #eef2ff;
  color: #596fe8;
  font-size: 13px;
  font-weight: 600;
}

.empty-note {
  margin: 14px 0 0;
  color: #7c889e;
  font-size: 14px;
}

.action-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.action-item {
  height: 44px;
  padding: 0 16px;
  border: 1px solid #e4e9f4;
  border-radius: 14px;
  background: #fff;
  color: #30405c;
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.action-item:hover {
  border-color: #cfd7ee;
  background: #f8faff;
}

@media (max-width: 1200px) {
  .launch-hero,
  .mission-panel,
  .secondary-grid {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .hero-actions {
    justify-content: flex-start;
  }

  .meta-row,
  .rail-line {
    grid-template-columns: 1fr;
  }

  .rail-step::after {
    display: none;
  }
}

@media (max-width: 780px) {
  .mission-main,
  .mission-side,
  .rail-section,
  .secondary-card {
    padding: 18px;
    border-radius: 20px;
  }

  .hero-copy h1 {
    font-size: 32px;
  }
}
</style>

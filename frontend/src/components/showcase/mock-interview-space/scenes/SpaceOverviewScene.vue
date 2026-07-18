<script setup lang="tsx">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SpaceSceneHeader from '@/components/showcase/mock-interview-space/SpaceSceneHeader.vue'
import { useInterviewAnalyticsDashboardData } from '@/composables/analytics/useInterviewAnalyticsDashboardData'

type IdleWindow = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
  cancelIdleCallback?: (handle: number) => void
}

let analyticsDashboardLoadTask: Promise<typeof import('@/components/analytics/InterviewAnalyticsDashboard.vue')> | null = null

const preloadAnalyticsDashboard = () => {
  analyticsDashboardLoadTask ||= import('@/components/analytics/InterviewAnalyticsDashboard.vue')
  return analyticsDashboardLoadTask
}

const InterviewAnalyticsDashboard = defineAsyncComponent({
  loader: preloadAnalyticsDashboard,
  delay: 0
})

interface OverviewSummaryItem {
  label: string
  value: string
  note: string
}

const props = withDefaults(defineProps<{
  sectionTitle: string
  sectionBody: string
  progressPercent: number
  statusLabel: string
  summaryItems: OverviewSummaryItem[]
  primaryActionLabel: string
  analyticsSuspended?: boolean
  /** 有报告弱项时补充说明专项训练如何承接 */
  practiceRouteNote?: string
}>(), {
  analyticsSuspended: false
})

const emit = defineEmits<{
  primaryAction: []
  openLibrary: []
  openPractice: []
  openReport: []
}>()

const analyticsRevealTarget = ref<HTMLElement | null>(null)
const shouldMountAnalyticsDashboard = ref(false)
const isAnalyticsDashboardVisible = ref(false)
const isAnalyticsDashboardActive = ref(false)

let analyticsRevealObserver: IntersectionObserver | null = null
let cancelAnalyticsPreload: (() => void) | null = null
let isAnalyticsNearViewport = false
let analyticsScrollRoot: HTMLElement | null = null

const {
  dataSource,
  dashboardData,
  error: dashboardError,
  generatedAt,
  hasRemoteAnalyticsData,
  hasRemoteAnalyticsResponse,
  loading: dashboardLoading,
  reloadDashboardData,
  selectedTimeRange,
  selectedTimeRangeText,
  timeRangeOptions
} = useInterviewAnalyticsDashboardData()

const analyticsSubtitle = computed(() => {
  if (dashboardLoading.value) return '正在读取训练统计数据。'

  if (hasRemoteAnalyticsResponse.value) {
    if (hasRemoteAnalyticsData.value) {
      return generatedAt.value
        ? `基于后端聚合数据生成训练概览，更新时间：${ generatedAt.value }。`
        : '基于后端聚合数据生成训练概览。'
    }

    return '后端统计接口已返回空数据，请先完成训练后再查看分析。'
  }

  if (dataSource.value === 'local') {
    return dashboardError.value
      ? '后端统计暂不可用，当前基于本地面试会话和复盘报告生成训练概览。'
      : '基于本地面试会话和复盘报告生成训练概览。'
  }

  return dashboardError.value
    ? '后端统计暂不可用，当前使用示例数据预览图表效果。'
    : '当前暂无本地训练记录，先用示例数据预览图表效果。'
})

const revealAnalyticsDashboard = async () => {
  if (shouldMountAnalyticsDashboard.value) return

  shouldMountAnalyticsDashboard.value = true
  await preloadAnalyticsDashboard()
  await nextTick()

  window.requestAnimationFrame(() => {
    isAnalyticsDashboardVisible.value = true
  })
}

const scheduleAnalyticsPreload = () => {
  const idleWindow = window as IdleWindow

  if (idleWindow.requestIdleCallback) {
    const preloadHandle = idleWindow.requestIdleCallback(() => {
      void preloadAnalyticsDashboard()
    }, {
      timeout: 1600
    })

    cancelAnalyticsPreload = () => idleWindow.cancelIdleCallback?.(preloadHandle)
    return
  }

  const preloadTimer = window.setTimeout(() => {
    void preloadAnalyticsDashboard()
  }, 600)

  cancelAnalyticsPreload = () => window.clearTimeout(preloadTimer)
}

const syncAnalyticsDashboardActive = () => {
  if (props.analyticsSuspended || !isAnalyticsNearViewport) {
    isAnalyticsDashboardActive.value = false
    return
  }

  isAnalyticsDashboardActive.value = true
}

const suspendAnalyticsDashboard = () => {
  isAnalyticsDashboardActive.value = false
}

const resolveAnalyticsScrollTarget = () => {
  return analyticsRevealTarget.value?.closest('.interview-space-showcase') as HTMLElement | null
}

onMounted(() => {
  scheduleAnalyticsPreload()
  analyticsScrollRoot = resolveAnalyticsScrollTarget()

  if (!('IntersectionObserver' in window)) {
    isAnalyticsNearViewport = true
    isAnalyticsDashboardActive.value = true
    void revealAnalyticsDashboard()
    return
  }

  analyticsRevealObserver = new IntersectionObserver((entries) => {
    const isNearViewport = entries.some(entry => entry.isIntersecting)

    isAnalyticsNearViewport = isNearViewport
    syncAnalyticsDashboardActive()
    if (!isNearViewport) return

    void revealAnalyticsDashboard()
  }, {
    root: analyticsScrollRoot,
    rootMargin: '420px 0px 520px'
  })

  if (analyticsRevealTarget.value) {
    analyticsRevealObserver.observe(analyticsRevealTarget.value)
  }
})

onBeforeUnmount(() => {
  analyticsRevealObserver?.disconnect()
  analyticsRevealObserver = null
  analyticsScrollRoot = null
  cancelAnalyticsPreload?.()
  cancelAnalyticsPreload = null
})

watch(() => props.analyticsSuspended, (suspended) => {
  if (suspended) {
    suspendAnalyticsDashboard()
    return
  }

  syncAnalyticsDashboardActive()
})
</script>

<template>
  <div class="overview-panel-shell">
    <SpaceSceneHeader
      :title="sectionTitle"
      :body="sectionBody"
      aside-min-width="620px"
    >
      <template #aside>
        <div class="overview-action-row">
          <button
            type="button"
            class="overview-action primary"
            @click="emit('primaryAction')"
          >
            {{ primaryActionLabel }}
          </button>
          <button
            type="button"
            class="overview-action"
            @click="emit('openLibrary')"
          >
            查看资料
          </button>
          <button
            type="button"
            class="overview-action"
            @click="emit('openPractice')"
          >
            去专项训练
          </button>
          <button
            type="button"
            class="overview-action"
            @click="emit('openReport')"
          >
            查看报告
          </button>
        </div>
      </template>
    </SpaceSceneHeader>

    <div
      ref="analyticsRevealTarget"
      class="overview-analytics-lazy"
      :class="{ 'is-visible': isAnalyticsDashboardVisible }"
    >
      <InterviewAnalyticsDashboard
        v-if="shouldMountAnalyticsDashboard"
        class="overview-analytics-dashboard"
        :active="isAnalyticsDashboardActive"
        :data="dashboardData"
        :loading="dashboardLoading"
        title="训练数据驾驶舱"
        :subtitle="analyticsSubtitle"
        :time-range-text="selectedTimeRangeText"
        @refresh="reloadDashboardData"
      >
        <template #actions>
          <div class="overview-analytics-range">
            <button
              v-for="option in timeRangeOptions"
              :key="option.value"
              type="button"
              class="overview-analytics-range__button"
              :class="{ 'is-active': selectedTimeRange === option.value }"
              @click="selectedTimeRange = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </template>
      </InterviewAnalyticsDashboard>
    </div>

    <div class="overview-progress-card">
      <div class="overview-progress-head">
        <div>
          <div class="overview-progress-label">主任务区</div>
          <strong>{{ primaryActionLabel }}</strong>
        </div>
        <span>{{ progressPercent }}%</span>
      </div>
      <div class="overview-progress-track">
        <div
          class="overview-progress-fill"
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>
      <p>{{ statusLabel }}</p>
    </div>

    <div class="overview-summary-grid">
      <div
        v-for="item in summaryItems"
        :key="item.label"
        class="overview-summary-card"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.note }}</small>
      </div>
    </div>

    <div class="overview-route-card overview-summary-card">
      <span>训练路径</span>
      <strong>按资料练，或按弱项补练</strong>
      <small>
        想按资料练，请使用下方「查看资料」；想按弱项补练，请使用下方「去专项训练」。
      </small>
      <small
        v-if="practiceRouteNote"
        class="overview-route-card__note"
      >
        {{ practiceRouteNote }}
      </small>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.overview-panel-shell {
  display: grid;
  gap: 16px;
  margin-top: 0;
}

.overview-progress-card,
.overview-summary-card {
  padding: 18px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 22px;
  background: rgb(10 18 34 / 0.5);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
}

.overview-progress-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.overview-progress-label,
.overview-summary-card span {
  display: block;
  color: rgb(220 232 255 / 0.62);
  font-size: 15px;
}

.overview-progress-head strong,
.overview-summary-card strong {
  display: block;
  margin-top: 6px;
  color: #fff;
  font-size: 22px;
  font-weight: 600;
}

.overview-progress-head span {
  color: var(--scene-primary);
  font-size: 26px;
  font-weight: 600;
}

.overview-progress-track {
  height: 10px;
  margin-top: 16px;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.08);
}

.overview-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--scene-primary) 0%, rgb(255 255 255 / 0.86) 100%);
}

.overview-progress-card p,
.overview-summary-card small {
  margin: 10px 0 0;
  color: rgb(228 238 255 / 0.72);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.6;
}

.overview-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.overview-route-card strong {
  display: block;
  margin-top: 6px;
  color: #fff;
  font-size: 22px;
  font-weight: 600;
}

.overview-route-card__note {
  display: block;
  margin-top: 8px;
}

.overview-action-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 4px;
}

.overview-action {
  height: 46px;
  padding: 0 18px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.05);
  color: #fff;
  font: inherit;
  font-size: 16px;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.24s ease, border-color 0.24s ease, transform 0.24s ease;
}

.overview-action.primary {
  border-color: rgb(255 255 255 / 0.06);
  background: var(--scene-primary);
  color: #081421;
}

.overview-action:hover {
  border-color: rgb(255 255 255 / 0.24);
  background: rgb(255 255 255 / 0.1);
  transform: translateY(-1px);
}

.overview-action.primary:hover {
  background: #fff;
}

.overview-analytics-dashboard {
  margin-top: 10px;
}

.overview-analytics-lazy {
  min-height: 760px;
  contain: layout paint style;
  content-visibility: auto;
  opacity: 0;
  transform: translate3d(0, 18px, 0);
  transition: opacity 0.42s ease, transform 0.42s ease;
}

.overview-analytics-lazy.is-visible {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.overview-analytics-range {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  border: 1px solid rgb(148 199 255 / 0.18);
  border-radius: 8px;
  background: rgb(255 255 255 / 0.05);
}

.overview-analytics-range__button {
  height: 32px;
  padding: 0 11px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: rgb(224 238 255 / 0.72);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.overview-analytics-range__button:hover,
.overview-analytics-range__button.is-active {
  background: rgb(82 240 196 / 0.16);
  color: #f6fbff;
}

@media (max-width: 1100px) {
  .overview-action-row {
    justify-content: flex-start;
  }

  .overview-summary-grid {
    grid-template-columns: 1fr;
  }

  .overview-analytics-lazy {
    min-height: 980px;
  }
}
</style>

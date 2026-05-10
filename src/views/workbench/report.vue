<script lang="ts" setup>
import ReportOverviewCard from '@/components/report/ReportOverviewCard.vue'
import ReportSuggestionCard from '@/components/report/ReportSuggestionCard.vue'
import ReportWeaknessSection from '@/components/report/ReportWeaknessSection.vue'
import WorkbenchContentShell from '@/components/workbench/WorkbenchContentShell.vue'
import WorkbenchContextSummary from '@/components/workbench/WorkbenchContextSummary.vue'
import WorkbenchPageIntro from '@/components/workbench/WorkbenchPageIntro.vue'
import { useWorkbenchPersistence } from '@/composables/useWorkbenchPersistence'

const route = useRoute()
const router = useRouter()
const { getInterviewSessionById, getReportSummaryBySessionId } = useWorkbenchPersistence()

const topicLabelMap: Record<string, string> = {
  vue3: 'Vue 3',
  typescript: 'TypeScript',
  engineering: '工程化',
  browser: '浏览器',
  performance: '性能优化',
  scenario: '场景题'
}

const modeLabelMap: Record<string, string> = {
  standard: '标准模拟',
  guided: '引导模式'
}

const statusLabelMap: Record<string, string> = {
  in_progress: '进行中',
  completed: '已完成',
  aborted: '已中断'
}

const sourceLabelMap: Record<string, string> = {
  'hero-import': '总览页导入资料入口',
  overview: '总览页训练推荐入口',
  'library-frontend-notes': '前端八股总纲资料',
  'library-project-review': '项目复盘沉淀资料',
  'library-follow-up-questions': '高频追问清单资料',
  'queue-vue-reactivity': 'Vue 响应式专项队列',
  'queue-ts-generics': 'TypeScript 泛型专项队列',
  'queue-performance-project': '性能优化专项队列',
  library: '资料库上下文'
}

const currentSessionId = computed(() => String(route.query.sessionId || ''))
const currentSession = computed(() => {
  return currentSessionId.value ? getInterviewSessionById(currentSessionId.value) : null
})
const currentSummary = computed(() => {
  return currentSessionId.value ? getReportSummaryBySessionId(currentSessionId.value) : null
})

const currentTopic = computed(() => {
  return topicLabelMap[String(currentSession.value?.topic || currentSummary.value?.topic || route.query.topic || '')] || '综合'
})

const currentSource = computed(() => {
  const raw = String(currentSession.value?.source || currentSummary.value?.source || route.query.source || route.query.from || 'workspace')
  return sourceLabelMap[raw] || raw
})

const currentMode = computed(() => {
  return modeLabelMap[String(currentSession.value?.mode || route.query.mode || 'standard')] || '标准模拟'
})

const currentStatus = computed(() => {
  return statusLabelMap[String(currentSession.value?.status || 'completed')] || '已完成'
})

const answeredText = computed(() => {
  const answered = currentSession.value?.answeredCount ?? currentSummary.value?.answeredCount ?? Number(route.query.answered || 0)
  const total = currentSession.value?.questionCount ?? currentSummary.value?.totalCount ?? Number(route.query.total || 0)
  return `${answered} / ${total} 题`
})

const startedAtText = computed(() => currentSession.value?.startedAt || '当前无开始时间记录')
const finishedAtText = computed(() => currentSession.value?.finishedAt || '本轮尚未记录结束时间')

const weaknessTags = computed(() => {
  return currentSummary.value?.weaknessTags || currentSession.value?.weaknessTags || []
})

const summaryItems = computed(() => [
  { label: '报告主题', value: currentTopic.value },
  { label: '资料来源', value: currentSource.value },
  { label: '训练模式', value: currentMode.value },
  { label: '当前状态', value: currentStatus.value },
  { label: '会话标识', value: currentSessionId.value || '未关联 session' },
  { label: '已答题数', value: answeredText.value }
])

const suggestions = computed(() => {
  const list: string[] = []
  const session = currentSession.value
  const summary = currentSummary.value

  if (session && session.answeredCount < session.questionCount) {
    list.push('当前轮次还没有完整答完，建议先回模拟面试页继续完成剩余题目。')
  }

  if ((summary?.weaknessTags.length || 0) >= 3) {
    list.push('薄弱点标签较多，建议优先进入专项刷题页做定向补练。')
  }

  if ((summary?.source || session?.source) === 'hero-import' || (summary?.source || session?.source) === 'library') {
    list.push('这一轮明显依赖资料库上下文，建议回资料页继续补充同主题文档。')
  }

  if (session?.mode === 'guided') {
    list.push('本轮是引导模式，下一轮可以切到标准模拟，验证是否真的能独立答出来。')
  }

  if (!list.length) {
    list.push('当前这轮训练数据较少，建议再完成一轮更完整的模拟面试，复盘会更有价值。')
  }

  return list
})

const goHistory = () => {
  router.push({
    name: 'WorkbenchHistory'
  })
}
</script>

<template>
  <WorkbenchContentShell>
    <WorkbenchPageIntro
      eyebrow="复盘报告页"
      title="复盘报告"
      description="这里展示当前训练轮次的真实承接结果，包括训练概览、薄弱点标签和下一步补练建议。"
    />

    <WorkbenchContextSummary :items="summaryItems" :columns="3" />

    <div class="report-layout">
      <div class="report-main">
        <ReportOverviewCard
          :answered-text="answeredText"
          :status-text="currentStatus"
          :mode-text="currentMode"
          :source-text="currentSource"
          :started-at="startedAtText"
          :finished-at="finishedAtText"
        />

        <ReportWeaknessSection :weakness-tags="weaknessTags" />

        <ReportSuggestionCard :suggestions="suggestions" />
      </div>

      <aside class="report-side">
        <section class="side-card">
          <div class="section-kicker">回看入口</div>
          <h3>继续查看历史训练</h3>
          <p>你可以进入历史页，查看更多 session 和复盘摘要列表。</p>
          <n-button
            type="primary"
            block
            @click="goHistory"
          >
            打开训练历史
          </n-button>
        </section>
      </aside>
    </div>
  </WorkbenchContentShell>
</template>

<style lang="scss" scoped>
.report-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.85fr);
  gap: 18px;
  margin-top: 24px;
}

.report-main {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.report-side {
  display: flex;
  flex-direction: column;
}

.side-card {
  padding: 22px;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 6%);
}

.section-kicker {
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h3 {
  margin: 8px 0 0;
  font-size: 22px;
  color: #1f2746;
}

p {
  margin: 12px 0 18px;
  font-size: 14px;
  line-height: 1.8;
  color: #6d7a92;
}

@media (max-width: 1200px) {
  .report-layout {
    grid-template-columns: 1fr;
  }
}
</style>

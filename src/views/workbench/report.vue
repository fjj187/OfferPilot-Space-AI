<script lang="ts" setup>
import WorkbenchContentShell from '@/components/workbench/WorkbenchContentShell.vue'
import WorkbenchPageIntro from '@/components/workbench/WorkbenchPageIntro.vue'
import { useWorkbenchPersistence } from '@/composables/useWorkbenchPersistence'
import {
  buildInterviewMessagesFromRemote,
  getRemoteInterviewSessionDetail,
  listRemoteInterviewSessions
} from '@/services/interview/interview-session-api'

interface ReportSectionItem {
  title: string
  summary: string
  suggestion: string
}

interface ReportEvidenceItem {
  title: string
  question: string
  answer: string
  feedback: string
}

const route = useRoute()
const router = useRouter()
const { getInterviewSessionById, getReportSummaryBySessionId } = useWorkbenchPersistence()
const remoteSessionDetail = ref<null | Awaited<ReturnType<typeof getRemoteInterviewSessionDetail>>>(null)
const remoteSessionLoaded = ref(false)

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
  'backend-session': '后端真实会话',
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
const currentThreadId = computed(() => String(route.query.threadId || ''))
const currentSession = computed(() => (
  currentSessionId.value ? getInterviewSessionById(currentSessionId.value) : null
))
const currentSummary = computed(() => (
  currentSessionId.value ? getReportSummaryBySessionId(currentSessionId.value) : null
))
const remoteMessages = computed(() => (
  remoteSessionDetail.value ? buildInterviewMessagesFromRemote(remoteSessionDetail.value) : []
))
const latestUserMessage = computed(() => {
  return [...remoteMessages.value].reverse().find(item => item.role === 'user')?.displayContent || ''
})
const latestAssistantMessage = computed(() => {
  return [...remoteMessages.value].reverse().find(item => item.role === 'assistant')?.displayContent || ''
})

const currentTopic = computed(() => (
  topicLabelMap[String(
    remoteSessionDetail.value?.topic
    || currentSession.value?.topic
    || currentSummary.value?.topic
    || route.query.topic
    || ''
  )] || '综合'
))

const currentSource = computed(() => {
  const raw = String(currentSession.value?.source || currentSummary.value?.source || route.query.source || route.query.from || 'workspace')
  return sourceLabelMap[raw] || raw
})

const currentMode = computed(() => (
  modeLabelMap[String(
    remoteSessionDetail.value?.feedbackStyle === 'guided'
      ? 'guided'
      : currentSession.value?.mode || route.query.mode || 'standard'
  )] || '标准模拟'
))

const currentStatus = computed(() => (
  statusLabelMap[String(
    currentSession.value?.status
    || (remoteSessionDetail.value?.messageCount ? 'completed' : 'in_progress')
  )] || '已完成'
))

const answeredCount = computed(() => (
  currentSession.value?.answeredCount
  ?? currentSummary.value?.answeredCount
  ?? (remoteSessionDetail.value ? Math.max(Math.floor(remoteSessionDetail.value.messageCount / 2), 0) : undefined)
  ?? Number(route.query.answered || 0)
))

const totalCount = computed(() => (
  currentSession.value?.questionCount
  ?? currentSummary.value?.totalCount
  ?? (remoteSessionDetail.value ? Math.max(Math.ceil(remoteSessionDetail.value.messageCount / 2), 1) : undefined)
  ?? Number(route.query.total || 0)
))

const answeredText = computed(() => `${ answeredCount.value } / ${ totalCount.value || 0 } 题`)
const startedAtText = computed(() => currentSession.value?.startedAt || remoteSessionDetail.value?.updatedAt || '本轮开始时间已记录在训练会话中')
const finishedAtText = computed(() => currentSession.value?.finishedAt || currentSummary.value?.createdAt || remoteSessionDetail.value?.updatedAt || '刚刚完成本轮模拟')

const weaknessTags = computed(() => {
  const list = currentSummary.value?.weaknessTags || currentSession.value?.weaknessTags || []
  return list.length ? list : ['结构表达', '案例细节', '结果指标']
})

const focusAreas = computed(() => {
  const list = currentSummary.value?.weaknessFocusAreas || []
  if (list.length) return list
  return ['structure', 'case_detail', 'result_metric']
})

const focusAreaLabelMap: Record<string, string> = {
  structure: '结构表达',
  case_detail: '案例细节',
  result_metric: '结果指标',
  principle_depth: '原理追问'
}

const headline = computed(() => (
  currentSummary.value?.summaryHeadline
  || remoteSessionDetail.value?.questionTitle
  || `本轮 ${ currentTopic.value } 模拟已经形成第一版复盘结论`
))

const reportSummary = computed(() => (
  currentSummary.value?.summaryBody
  || latestAssistantMessage.value
  || latestUserMessage.value
  || `这轮训练已经完成，当前最明显的问题集中在 ${ weaknessTags.value.slice(0, 2).join('、') }。建议先看完整报告确认问题，再决定是直接补练还是再做一轮模拟。`
))

const conclusionList = computed(() => {
  const firstWeakness = weaknessTags.value[0] || '结构表达'
  const secondWeakness = weaknessTags.value[1] || '案例细节'
  return [
    `这轮最主要的问题是“${ firstWeakness }”，回答已经开始覆盖主题，但稳定度不够。`,
    `第二个信号是“${ secondWeakness }”，说明答案里还缺少能支撑说服力的具体内容。`,
    answeredCount.value < totalCount.value
      ? '当前轮次还没有完全答满，结论已经可用，但还值得补一轮更完整的样本。'
      : '本轮样本已经足够形成阶段性判断，可以直接进入下一步训练。'
  ]
})

const evidenceItems = computed<ReportEvidenceItem[]>(() => {
  const answerSnapshot = currentSummary.value?.answerSnapshot || []
  const feedbackText = reportSummary.value

  return [
    {
      title: '证据 01',
      question: remoteSessionDetail.value?.questionTitle || `围绕 ${ currentTopic.value } 当前题目的回答表现`,
      answer: answerSnapshot[1] || latestUserMessage.value || '你的回答已经开始命中主题，但表达较短，缺少展开与承接。',
      feedback: answerSnapshot[2] || latestAssistantMessage.value || `系统反馈显示：当前需要继续补 ${ weaknessTags.value.slice(0, 2).join('、') }，把答案从“知道”升级成“能讲清”。`
    },
    {
      title: '证据 02',
      question: '为什么这轮会形成这个复盘结论？',
      answer: answerSnapshot[0] || latestUserMessage.value || '当前回答样本显示，你能快速进入问题，但没有把过程、取舍和结果讲完整。',
      feedback: feedbackText
    }
  ]
})

const sectionItems = computed<ReportSectionItem[]>(() => {
  const labels = focusAreas.value.map(item => focusAreaLabelMap[item] || item)
  return [
    {
      title: labels[0] || '结构表达',
      summary: '当前回答已经能碰到关键点，但整体还是偏短，结论、拆分和收束之间不够完整。',
      suggestion: '下一轮优先把单题回答固定成“结论 -> 过程 -> 结果”三段。'
    },
    {
      title: labels[1] || '案例细节',
      summary: '当前表达还缺少项目语境、真实约束和取舍过程，所以说服力不够。',
      suggestion: '补练时强制带出场景、限制条件和你的判断过程。'
    },
    {
      title: labels[2] || '结果指标',
      summary: '答案里还没有稳定出现结果、收益或验证方式，因此面试官很难判断产出质量。',
      suggestion: '补上结果指标、影响范围或验证手段，让回答形成闭环。'
    }
  ]
})

const nextActionTitle = computed(() => {
  const practicePlan = currentSummary.value?.practicePlan
  if (!practicePlan) return '建议先查看完整报告后再决定训练方式'
  return `建议先做 ${ practicePlan.questionCount } 题 ${ currentTopic.value } 定向补练`
})

const nextActionBody = computed(() => {
  const practicePlan = currentSummary.value?.practicePlan
  if (!practicePlan) return '如果你想马上收敛当前问题，先按这份报告进入专项补练；如果你想验证稳定度，再来一轮模拟更合适。'
  return `当前最适合的动作是围绕“${ practicePlan.weaknessTag }”继续补练，再回模拟面试验证是否真的收住。`
})

const recentMeta = computed(() => [
  `主题：${ currentTopic.value }`,
  `模式：${ currentMode.value }`,
  `状态：${ currentStatus.value }`,
  `来源：${ currentSource.value }`
])

const openHistory = () => {
  router.push({
    name: 'WorkbenchHistory'
  })
}

const continuePractice = () => {
  router.push({
    name: 'WorkbenchPractice'
  })
}

const continueMock = () => {
  router.push({
    name: 'WorkbenchMockInterview'
  })
}

const loadRemoteSessionDetail = async () => {
  if (!currentSessionId.value) {
    remoteSessionDetail.value = null
    remoteSessionLoaded.value = true
    return
  }

  try {
    let resolvedThreadId = currentThreadId.value

    if (!resolvedThreadId) {
      const sessions = await listRemoteInterviewSessions()
      resolvedThreadId = sessions.find(item => item.sessionId === currentSessionId.value)?.threadId || ''
    }

    remoteSessionDetail.value = resolvedThreadId
      ? await getRemoteInterviewSessionDetail(currentSessionId.value, resolvedThreadId)
      : null
  } catch {
    remoteSessionDetail.value = null
  } finally {
    remoteSessionLoaded.value = true
  }
}

watch(
  () => route.fullPath,
  () => {
    remoteSessionLoaded.value = false
    loadRemoteSessionDetail()
  },
  {
    immediate: true
  }
)
</script>

<template>
  <WorkbenchContentShell>
    <WorkbenchPageIntro
      eyebrow="复盘报告"
      title="本轮模拟复盘报告"
      description="这里展示本轮模拟面试的完整复盘。先看结论，再看证据，最后决定下一步训练动作。"
    />

    <section class="report-hero">
      <div class="report-hero-main">
        <div class="report-kicker">Round Review</div>
        <h2>{{ headline }}</h2>
        <p>{{ reportSummary }}</p>
        <div class="report-meta-row">
          <span
            v-for="item in recentMeta"
            :key="item"
            class="report-meta-pill"
          >
            {{ item }}
          </span>
        </div>
      </div>

      <aside class="report-hero-side">
        <div class="report-side-label">下一步建议</div>
        <strong>{{ nextActionTitle }}</strong>
        <p>{{ nextActionBody }}</p>
        <div class="report-side-actions">
          <n-button
            type="primary"
            block
            @click="continuePractice"
          >
            开始定向补练
          </n-button>
          <n-button
            block
            @click="continueMock"
          >
            再来一轮模拟
          </n-button>
        </div>
      </aside>
    </section>

    <section class="report-body">
      <article class="report-document">
        <section class="report-doc-section">
          <div class="report-section-kicker">本轮结论</div>
          <h3>先看这轮最值得处理的三个信号</h3>
          <ul class="report-conclusion-list">
            <li
              v-for="item in conclusionList"
              :key="item"
            >
              {{ item }}
            </li>
          </ul>
        </section>

        <section class="report-doc-section">
          <div class="report-section-kicker">关键证据</div>
          <h3>这些内容支撑了上面的判断</h3>
          <div class="report-evidence-list">
            <article
              v-for="item in evidenceItems"
              :key="item.title"
              class="report-evidence-item"
            >
              <span class="report-evidence-label">{{ item.title }}</span>
              <div class="report-evidence-block">
                <small>题目</small>
                <p>{{ item.question }}</p>
              </div>
              <div class="report-evidence-block">
                <small>回答摘录</small>
                <p>{{ item.answer }}</p>
              </div>
              <div class="report-evidence-block">
                <small>复盘说明</small>
                <p>{{ item.feedback }}</p>
              </div>
            </article>
          </div>
        </section>

        <section class="report-doc-section">
          <div class="report-section-kicker">问题拆解</div>
          <h3>按维度看这轮问题分别出在哪里</h3>
          <div class="report-analysis-list">
            <article
              v-for="item in sectionItems"
              :key="item.title"
              class="report-analysis-item"
            >
              <div class="report-analysis-title">{{ item.title }}</div>
              <p>{{ item.summary }}</p>
              <strong>{{ item.suggestion }}</strong>
            </article>
          </div>
        </section>
      </article>

      <aside class="report-sidebar">
        <section class="report-sidebar-card">
          <div class="report-side-label">本轮记录</div>
          <div class="report-mini-stat">
            <span>答题进度</span>
            <strong>{{ answeredText }}</strong>
          </div>
          <div class="report-mini-stat">
            <span>开始时间</span>
            <strong>{{ startedAtText }}</strong>
          </div>
          <div class="report-mini-stat">
            <span>结束时间</span>
            <strong>{{ finishedAtText }}</strong>
          </div>
        </section>

        <section class="report-sidebar-card">
          <div class="report-side-label">弱项标签</div>
          <div class="report-tag-list">
            <span
              v-for="tag in weaknessTags"
              :key="tag"
              class="report-tag"
            >
              {{ tag }}
            </span>
          </div>
        </section>

        <section class="report-sidebar-card">
          <div class="report-side-label">更多入口</div>
          <p class="report-sidebar-copy">如果你想回看其他轮次，可以去训练历史里对比最近的变化。</p>
          <n-button
            block
            @click="openHistory"
          >
            打开训练历史
          </n-button>
        </section>
      </aside>
    </section>
  </WorkbenchContentShell>
</template>

<style lang="scss" scoped>
.report-hero,
.report-document,
.report-sidebar-card {
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: rgb(255 255 255 / 94%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 6%);
}

.report-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.8fr);
  gap: 24px;
  padding: 28px;
}

.report-kicker,
.report-section-kicker,
.report-side-label,
.report-evidence-label {
  color: #6174f6;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.report-hero-main h2 {
  margin: 10px 0 0;
  color: #1f2746;
  font-size: 34px;
  line-height: 1.2;
}

.report-hero-main p,
.report-analysis-item p,
.report-evidence-block p,
.report-sidebar-copy {
  margin: 14px 0 0;
  color: #62708a;
  font-size: 15px;
  line-height: 1.9;
}

.report-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.report-meta-pill,
.report-tag {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid #e5eaf5;
  border-radius: 999px;
  background: #f8faff;
  color: #44506a;
  font-size: 14px;
}

.report-hero-side {
  padding: 2px 0;
}

.report-hero-side strong {
  display: block;
  margin-top: 10px;
  color: #1f2746;
  font-size: 22px;
  line-height: 1.45;
}

.report-side-actions {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.report-body {
  display: grid;
  grid-template-columns: minmax(0, 1.72fr) minmax(280px, 0.78fr);
  gap: 20px;
  margin-top: 24px;
}

.report-document {
  padding: 30px;
}

.report-doc-section + .report-doc-section {
  margin-top: 34px;
  padding-top: 34px;
  border-top: 1px solid #eef2f8;
}

.report-doc-section h3 {
  margin: 10px 0 0;
  color: #1f2746;
  font-size: 26px;
  line-height: 1.3;
}

.report-conclusion-list {
  display: grid;
  gap: 14px;
  margin: 18px 0 0;
  padding-left: 20px;
  color: #33405c;
  font-size: 16px;
  line-height: 1.85;
}

.report-evidence-list,
.report-analysis-list {
  display: grid;
  gap: 16px;
  margin-top: 18px;
}

.report-evidence-item,
.report-analysis-item {
  padding: 18px 20px;
  border: 1px solid #edf1f8;
  border-radius: 18px;
  background: #fbfcff;
}

.report-evidence-block + .report-evidence-block {
  margin-top: 14px;
}

.report-evidence-block small {
  color: #7b879d;
  font-size: 13px;
  font-weight: 700;
}

.report-evidence-block p {
  margin-top: 8px;
}

.report-analysis-title {
  color: #1f2746;
  font-size: 18px;
  font-weight: 700;
}

.report-analysis-item strong {
  display: block;
  margin-top: 12px;
  color: #2f5fd3;
  font-size: 15px;
  line-height: 1.75;
}

.report-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.report-sidebar-card {
  padding: 22px;
}

.report-mini-stat + .report-mini-stat {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eef2f8;
}

.report-mini-stat span {
  color: #7b879d;
  font-size: 14px;
}

.report-mini-stat strong {
  display: block;
  margin-top: 8px;
  color: #1f2746;
  font-size: 16px;
  line-height: 1.75;
}

.report-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

@media (max-width: 1200px) {
  .report-hero,
  .report-body {
    grid-template-columns: 1fr;
  }
}
</style>

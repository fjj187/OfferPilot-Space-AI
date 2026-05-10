<script lang="ts" setup>
import MessageList from '@/components/message/MessageList.vue'
import AnswerInputPanel from '@/components/mock-interview/AnswerInputPanel.vue'
import InterviewActionBar from '@/components/mock-interview/InterviewActionBar.vue'
import InterviewContextBar from '@/components/mock-interview/InterviewContextBar.vue'
import InterviewGuidePanel from '@/components/mock-interview/InterviewGuidePanel.vue'
import SourceReferenceCard from '@/components/mock-interview/SourceReferenceCard.vue'
import WeaknessTrackerCard from '@/components/mock-interview/WeaknessTrackerCard.vue'
import WorkbenchContentShell from '@/components/workbench/WorkbenchContentShell.vue'
import { useInterviewStream } from '@/composables/useInterviewStream'
import { useWorkbenchPersistence } from '@/composables/useWorkbenchPersistence'
import {
  difficultyLabelMap,
  interviewGuides,
  interviewTopics,
  modeLabelMap,
  questionBank,
  type InterviewMode,
  type InterviewQuestion,
  type InterviewTopicKey
} from './mock-interview.data'

const route = useRoute()
const router = useRouter()

const {
  loadWorkbenchContext,
  saveWorkbenchContext,
  findInterviewSession,
  createInterviewSession,
  updateInterviewSession,
  completeInterviewSession,
  saveReportSummary
} = useWorkbenchPersistence()

const {
  messages,
  isStreaming,
  streamError,
  scrollVersion,
  appendUserMessage,
  appendAssistantMessage,
  appendSystemMessage,
  startStream,
  stopStream,
  clearMessages
} = useInterviewStream()

const activeTopic = ref<InterviewTopicKey>('vue3')
const interviewMode = ref<InterviewMode>('standard')
const answerDraft = ref('')
const currentQuestionIndex = ref(0)
const followUpIndex = ref(0)
const hintVisible = ref(false)
const submittedQuestionIds = ref<string[]>([])
const weaknessTags = ref<string[]>([])
const currentQuestionList = ref<InterviewQuestion[]>([])
const currentSessionId = ref('')
const currentSource = ref('library')
const currentDocType = ref<'md' | 'docx'>('md')

const topicLabelMap = interviewTopics.reduce<Record<string, string>>((map, item) => {
  map[item.key] = item.label
  return map
}, {})

const sourceLabelMap: Record<string, string> = {
  'hero-import': '从总览页导入入口进入',
  overview: '从总览页推荐训练进入',
  'library-frontend-notes': '前端知识沉淀资料',
  'library-project-review': '项目复盘资料',
  'library-follow-up-questions': '高频追问资料',
  'queue-vue-reactivity': 'Vue 响应式专题',
  'queue-ts-generics': 'TypeScript 泛型专题',
  'queue-performance-project': '性能优化专题'
}

const normalizeTopic = (value: unknown): InterviewTopicKey => {
  return interviewTopics.some(item => item.key === value) ? (value as InterviewTopicKey) : 'vue3'
}

const normalizeMode = (value: unknown): InterviewMode => {
  return value === 'guided' ? 'guided' : 'standard'
}

const buildQuestionList = (topic: InterviewTopicKey, count: number) => {
  const topicQuestions = questionBank.filter(item => item.topic === topic)
  const backupQuestions = questionBank.filter(item => item.topic !== topic)
  return [...topicQuestions, ...backupQuestions].slice(0, count)
}

const currentQuestion = computed(() => currentQuestionList.value[currentQuestionIndex.value])

const currentGuide = computed(() => {
  return interviewGuides.find(item => item.topic === activeTopic.value) || interviewGuides[0]
})

const currentFollowUp = computed(() => {
  const question = currentQuestion.value
  if (!question) return ''
  return question.followUps[followUpIndex.value] || ''
})

const isCurrentSubmitted = computed(() => {
  const question = currentQuestion.value
  return !!question && submittedQuestionIds.value.includes(question.id)
})

const answeredCount = computed(() => submittedQuestionIds.value.length)
const totalCount = computed(() => currentQuestionList.value.length)
const remainingCount = computed(() => Math.max(totalCount.value - answeredCount.value, 0))
const isLastQuestion = computed(() => currentQuestionIndex.value >= currentQuestionList.value.length - 1)
const dialogueCount = computed(() => messages.value.filter(item => item.role !== 'system').length)

const contextItems = computed(() => {
  const question = currentQuestion.value

  return [
    {
      label: '当前主题',
      value: topicLabelMap[activeTopic.value] || 'Vue 3'
    },
    {
      label: '训练模式',
      value: modeLabelMap[interviewMode.value]
    },
    {
      label: '资料来源',
      value: sourceLabelMap[currentSource.value] || '从当前资料上下文进入'
    },
    {
      label: '文档类型',
      value: question?.docType?.toUpperCase() || currentDocType.value.toUpperCase()
    }
  ]
})

const persistCurrentSession = () => {
  if (!currentSessionId.value) return

  updateInterviewSession(currentSessionId.value, {
    answeredCount: answeredCount.value,
    currentQuestionIndex: currentQuestionIndex.value,
    submittedQuestionIds: submittedQuestionIds.value,
    weaknessTags: weaknessTags.value,
    followUpIndex: followUpIndex.value,
    hintVisible: hintVisible.value
  })
}

const addWeaknessTag = (tag: string) => {
  if (!weaknessTags.value.includes(tag)) {
    weaknessTags.value = [...weaknessTags.value, tag]
  }
}

const buildOpeningContent = (question: InterviewQuestion) => {
  return [
    '### 当前题目',
    `**${question.title}**`,
    '',
    question.prompt,
    '',
    `- 难度：${difficultyLabelMap[question.difficulty]}`,
    `- 推荐结构：先结论，再拆实现，再补验证`,
    `- 资料命中：${question.reference}`
  ].join('\n')
}

const initializeConversation = () => {
  clearMessages()

  const question = currentQuestion.value
  if (!question) return

  appendSystemMessage(
    `已进入第 ${currentQuestionIndex.value + 1} 题，共 ${totalCount.value} 题。当前模式：${modeLabelMap[interviewMode.value]}。`
  )
  appendAssistantMessage(buildOpeningContent(question), 'markdown')

  if (interviewMode.value === 'guided') {
    appendSystemMessage(`引导模式已开启。你可以随时点击“查看提示”获取回答结构建议。`)
  }
}

const syncFromRoute = () => {
  const persistedContext = loadWorkbenchContext()
  const nextTopic = normalizeTopic(route.query.topic)
  const nextMode = normalizeMode(route.query.mode)
  const nextSource = String(route.query.source || persistedContext?.activeDocumentId || 'library')
  const questionCount = Math.max(3, Math.min(6, Number(route.query.questionCount || 4)))
  const nextQuestionList = buildQuestionList(nextTopic, questionCount)
  const matchedSession = findInterviewSession({
    topic: nextTopic,
    mode: nextMode,
    source: nextSource,
    status: 'in_progress'
  })

  activeTopic.value = nextTopic
  interviewMode.value = nextMode
  currentSource.value = nextSource
  currentQuestionList.value = nextQuestionList
  currentDocType.value = (nextQuestionList[0]?.docType || String(route.query.docType || 'md').toLowerCase()) as 'md' | 'docx'

  if (matchedSession) {
    currentSessionId.value = matchedSession.id
    currentQuestionIndex.value = Math.min(matchedSession.currentQuestionIndex, Math.max(nextQuestionList.length - 1, 0))
    followUpIndex.value = matchedSession.followUpIndex
    hintVisible.value = matchedSession.hintVisible
    submittedQuestionIds.value = [...matchedSession.submittedQuestionIds]
    weaknessTags.value = [...matchedSession.weaknessTags]
    answerDraft.value = ''
  } else {
    currentSessionId.value = `session-${Date.now()}`
    currentQuestionIndex.value = 0
    followUpIndex.value = 0
    hintVisible.value = nextMode === 'guided'
    submittedQuestionIds.value = []
    weaknessTags.value = []
    answerDraft.value = ''

    createInterviewSession({
      id: currentSessionId.value,
      topic: nextTopic,
      mode: nextMode,
      source: nextSource,
      sourceDocumentId: persistedContext?.activeDocumentId || '',
      docType: currentDocType.value,
      questionCount,
      answeredCount: 0,
      currentQuestionIndex: 0,
      submittedQuestionIds: [],
      weaknessTags: [],
      followUpIndex: 0,
      hintVisible: nextMode === 'guided',
      status: 'in_progress'
    })
  }

  saveWorkbenchContext({
    activeTopic: nextTopic,
    activeDocumentId: persistedContext?.activeDocumentId || nextSource,
    currentMode: nextMode,
    sourcePage: 'mock-interview'
  })

  initializeConversation()
}

const moveToQuestion = (nextIndex: number) => {
  currentQuestionIndex.value = nextIndex
  answerDraft.value = ''
  followUpIndex.value = 0
  hintVisible.value = interviewMode.value === 'guided'
  initializeConversation()
}

const submitAnswer = () => {
  const question = currentQuestion.value
  const answer = answerDraft.value.trim()

  if (!question || !answer || isStreaming.value) return

  if (!submittedQuestionIds.value.includes(question.id)) {
    submittedQuestionIds.value = [...submittedQuestionIds.value, question.id]
  }

  addWeaknessTag(question.weaknessSignal)

  if (answer.length < 50) {
    addWeaknessTag('单题回答偏短，后续可以补结构、取舍和结果验证。')
  }

  appendUserMessage(answer)

  startStream({
    prompt: `${question.title}\n${question.prompt}\n${answer}`,
    topicLabel: topicLabelMap[activeTopic.value] || 'Vue 3',
    questionTitle: question.title,
    questionPrompt: question.prompt,
    answer,
    format: 'markdown'
  })

  answerDraft.value = ''
}

const clearAnswer = () => {
  if (isStreaming.value) return
  answerDraft.value = ''
}

const showHint = () => {
  const question = currentQuestion.value
  if (!question) return

  hintVisible.value = true
  appendSystemMessage(`回答提示：${question.hint}`)
}

const requestFollowUp = () => {
  const question = currentQuestion.value
  if (!question?.followUps.length) return

  followUpIndex.value = (followUpIndex.value + 1) % question.followUps.length
  appendSystemMessage(`推荐追问：${currentFollowUp.value}`)
}

const goNextQuestion = () => {
  if (!isLastQuestion.value) {
    moveToQuestion(currentQuestionIndex.value + 1)
    return
  }

  finishInterview()
}

const skipQuestion = () => {
  addWeaknessTag('存在跳题行为，说明当前主题还需要继续补练。')
  goNextQuestion()
}

const finishInterview = () => {
  stopStream()

  if (currentSessionId.value) {
    completeInterviewSession(currentSessionId.value, {
      answeredCount: answeredCount.value,
      currentQuestionIndex: currentQuestionIndex.value,
      submittedQuestionIds: submittedQuestionIds.value,
      weaknessTags: weaknessTags.value,
      followUpIndex: followUpIndex.value,
      hintVisible: hintVisible.value
    })

    saveReportSummary({
      id: `report-${currentSessionId.value}`,
      sessionId: currentSessionId.value,
      topic: activeTopic.value,
      source: currentSource.value,
      weaknessTags: weaknessTags.value,
      answeredCount: answeredCount.value,
      totalCount: totalCount.value,
      createdAt: new Date().toISOString()
    })
  }

  router.push({
    name: 'WorkbenchReport',
    query: {
      from: 'mock-interview',
      sessionId: currentSessionId.value,
      source: currentSource.value,
      topic: activeTopic.value,
      mode: interviewMode.value,
      answered: String(answeredCount.value),
      total: String(totalCount.value)
    }
  })
}

const canMoveNext = computed(() => isCurrentSubmitted.value)

watch(() => route.fullPath, syncFromRoute, { immediate: true })

watch(
  [currentQuestionIndex, followUpIndex, hintVisible, submittedQuestionIds, weaknessTags],
  persistCurrentSession,
  { deep: true }
)
</script>

<template>
  <WorkbenchContentShell has-aside aside-width="minmax(300px, 360px)">
    <InterviewContextBar :items="contextItems" />

    <section class="summary-strip">
      <div class="summary-card">
        <div class="summary-label">当前进度</div>
        <div class="summary-value">{{ currentQuestionIndex + 1 }} / {{ totalCount }}</div>
        <div class="summary-note">当前正在处理第 {{ currentQuestionIndex + 1 }} 题。</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">已完成题数</div>
        <div class="summary-value">{{ answeredCount }} 题</div>
        <div class="summary-note">提交回答后会累计本轮的薄弱点标签。</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">对话消息数</div>
        <div class="summary-value">{{ dialogueCount }} 条</div>
        <div class="summary-note">中间区域现在已经切成真实消息流舞台。</div>
      </div>
    </section>

    <section v-if="currentQuestion" class="round-card">
      <div class="section-kicker">当前轮次</div>
      <div class="round-head">
        <div>
          <h2>{{ currentQuestion.title }}</h2>
          <p>{{ currentQuestion.prompt }}</p>
        </div>
        <span class="difficulty-pill">{{ difficultyLabelMap[currentQuestion.difficulty] }}</span>
      </div>

      <div class="tag-list">
        <span v-for="tag in currentQuestion.tags" :key="tag" class="tag-chip">
          {{ tag }}
        </span>
      </div>

      <div v-if="currentFollowUp" class="followup-preview">
        <div class="followup-label">当前推荐追问</div>
        <div class="followup-text">{{ currentFollowUp }}</div>
      </div>
    </section>

    <section class="stream-stage">
      <div class="stream-head">
        <div>
          <div class="section-kicker">主对话舞台</div>
          <h3>AI 面试官流式追问区</h3>
        </div>
        <span class="stream-pill" :class="{ 'is-streaming': isStreaming }">
          {{ isStreaming ? '生成中' : '空闲中' }}
        </span>
      </div>

      <MessageList :messages="messages" :scroll-version="scrollVersion" />

      <div v-if="streamError" class="stream-error">
        {{ streamError }}
      </div>
    </section>

    <div class="panel-grid">
      <AnswerInputPanel
        :value="answerDraft"
        :submitted="isCurrentSubmitted"
        :streaming="isStreaming"
        @update:value="answerDraft = $event"
        @submit="submitAnswer"
        @clear="clearAnswer"
        @stop="stopStream"
      />

      <section class="status-panel">
        <div class="section-kicker">本题状态</div>
        <h3>当前这一题的训练状态</h3>

        <div class="status-list">
          <div class="status-item">
            <div class="status-name">训练模式</div>
            <div class="status-value">{{ modeLabelMap[interviewMode] }}</div>
          </div>
          <div class="status-item">
            <div class="status-name">提示状态</div>
            <div class="status-value">{{ hintVisible ? '已开启' : '未展开' }}</div>
          </div>
          <div class="status-item">
            <div class="status-name">消息状态</div>
            <div class="status-value">{{ isStreaming ? 'AI 正在流式生成追问' : '等待你的下一次输入' }}</div>
          </div>
          <div class="status-item">
            <div class="status-name">剩余题数</div>
            <div class="status-value">{{ remainingCount }} 题</div>
          </div>
        </div>
      </section>
    </div>

    <InterviewActionBar
      :can-move-next="canMoveNext"
      :is-last-question="isLastQuestion"
      :streaming="isStreaming"
      @hint="showHint"
      @followup="requestFollowUp"
      @skip="skipQuestion"
      @next="goNextQuestion"
      @finish="finishInterview"
    />

    <template #aside>
      <InterviewGuidePanel
        v-if="currentQuestion && currentGuide"
        :title="currentGuide.title"
        :desc="currentGuide.desc"
        :hint="currentQuestion.hint"
        :follow-ups="currentQuestion.followUps"
        :hint-visible="hintVisible"
      />

      <SourceReferenceCard
        v-if="currentQuestion"
        :source="currentQuestion.source"
        :doc-type="currentQuestion.docType.toUpperCase()"
        :reference="currentQuestion.reference"
        :tags="currentQuestion.tags"
      />

      <WeaknessTrackerCard
        :weakness-tags="weaknessTags"
        :answered-count="answeredCount"
        :total="totalCount"
      />
    </template>
  </WorkbenchContentShell>
</template>

<style lang="scss" scoped>
.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.summary-card,
.round-card,
.stream-stage,
.status-panel {
  padding: 20px;
  border: 1px solid #e8edf6;
  border-radius: 22px;
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 6%);
}

.summary-label,
.section-kicker,
.status-name,
.followup-label {
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.summary-value {
  margin-top: 10px;
  font-size: 34px;
  font-weight: 700;
  color: #1f2746;
}

.summary-note {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #7b88a0;
}

.round-card {
  margin-bottom: 16px;
}

.round-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.round-head h2,
.stream-head h3,
.status-panel h3 {
  margin: 8px 0 0;
  font-size: 22px;
  color: #1f2746;
}

.round-head p {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.8;
  color: #596781;
}

.difficulty-pill,
.stream-pill {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: #f2f5fb;
  color: #607293;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.stream-pill.is-streaming {
  background: #eef2ff;
  color: #6076ff;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.tag-chip {
  padding: 8px 14px;
  border: 1px solid #dde4f4;
  border-radius: 999px;
  background: #fbfcff;
  font-size: 13px;
  font-weight: 600;
  color: #607293;
}

.followup-preview {
  margin-top: 16px;
  padding: 16px;
  border-radius: 18px;
  background: #f8faff;
}

.followup-text {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.7;
  color: #4b5973;
}

.stream-stage {
  margin-bottom: 16px;
}

.stream-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.95fr);
  gap: 16px;
  margin-bottom: 16px;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}

.status-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: #f8faff;
}

.status-value {
  margin-top: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #46546f;
  text-transform: none;
  letter-spacing: 0;
}

.stream-error {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: #fff6f6;
  color: #b94d4d;
  font-size: 13px;
}

@media (max-width: 1440px) {
  .summary-strip {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1200px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .round-head,
  .stream-head {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

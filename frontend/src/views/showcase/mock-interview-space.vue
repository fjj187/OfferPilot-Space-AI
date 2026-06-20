<script lang="tsx" setup>
import type { CSSProperties } from 'vue'
import type {
  PersistedInterviewFeedbackStyle,
  PersistedMockSessionConfig,
  PersistedPracticePlan,
  PersistedReportSummary,
  PersistedTopicKey
} from '@/types/workbench'
import {
  isInterviewReportApiAvailable,
  listRemoteInterviewReports
} from '@/services/interview/interview-report-api'
import SpaceContentPanel from '@/components/showcase/mock-interview-space/SpaceContentPanel.vue'
import SpaceHeader from '@/components/showcase/mock-interview-space/SpaceHeader.vue'
import SpaceCosmosBigBang from '@/components/showcase/mock-interview-space/SpaceCosmosBigBang.vue'
import router from '@/router'
import { useRoute } from 'vue-router'
import SpaceOrbitNav from '@/components/showcase/mock-interview-space/SpaceOrbitNav.vue'
import SpaceReportPreviewModal from '@/components/showcase/mock-interview-space/SpaceReportPreviewModal.vue'
import SpaceScrollCapsule from '@/components/showcase/mock-interview-space/SpaceScrollCapsule.vue'
import SpaceVisualStage from '@/components/showcase/mock-interview-space/SpaceVisualStage.vue'
import { scenes } from '@/constants/showcase/mockInterviewSpaceScenes'
import { useInterviewStream } from '@/composables/interview/useInterviewStream'
import { useLibraryWorkspaceState } from '@/composables/workspace/useLibraryWorkspaceState'
import { useMockInterviewFlow } from '@/composables/showcase/useMockInterviewFlow'
import { useMockInterviewSpaceMockState } from '@/composables/showcase/useMockInterviewSpaceMockState'
import { useMockInterviewSpaceOrbit } from '@/composables/showcase/useMockInterviewSpaceOrbit'
import { useMockInterviewSpaceReportHydration } from '@/composables/showcase/useMockInterviewSpaceReportHydration'
import { useMockInterviewSpaceReportScene } from '@/composables/showcase/useMockInterviewSpaceReportScene'
import { useMockInterviewSpaceScroll } from '@/composables/showcase/useMockInterviewSpaceScroll'
import { useOverviewLaunchState } from '@/composables/workspace/useOverviewLaunchState'
import { useWorkbenchPersistence } from '@/composables/workspace/useWorkbenchPersistence'
import type { MaterialGroupCompileOptions } from '@/types/material'
import { useMaterialQuestionPoolState } from '@/composables/showcase/useMaterialQuestionPoolState'
import {
  buildMaterialQuestionGroup,
  defaultMaterialGroupCompileOptions
} from '@/services/material/material-question-group-builder'
import {
  buildMaterialTopicTabs,
  filterMaterialQuestionsByTopic
} from '@/services/material/material-question-topics'
import type { PracticeGroupCompileOptions } from '@/types/practice-pool'
import { usePracticeQuestionPoolState } from '@/composables/showcase/usePracticeQuestionPoolState'
import {
  buildPracticeQuestionGroup,
  defaultPracticeGroupCompileOptions
} from '@/services/practice/practice-question-group-builder'
import { interviewTopics } from '@/views/workbench/mock-interview.data'

interface OrbitSlot {
  left: number
  top: number
  visible: boolean
}

const route = useRoute()

const isCosmosBigBangPending = ref(false)
const isCosmosBigBangPlaying = ref(false)
const isCosmosContentRevealed = ref(route.query.welcome !== '1')

let bigBangOverlayResolver: (() => void) | null = null

const isCosmosChromeReady = computed(
  () => !isCosmosBigBangPending.value
)

const {
  messages: mockMessages,
  isStreaming: isMockStreaming,
  streamError: mockStreamError,
  streamMode: mockStreamMode,
  streamModeLabel: mockStreamModeLabel,
  scrollVersion: mockScrollVersion,
  setActiveSessionId,
  setActiveThreadId,
  appendUserMessage,
  appendSystemMessage,
  startStream: startMockStream,
  stopStream: stopMockStream,
  clearMessages: clearMockMessages
} = useInterviewStream()

const topicLabelMap = interviewTopics.reduce<Record<string, string>>((map, item) => {
  map[item.key] = item.label
  return map
}, {})

const {
  loadWorkbenchContext,
  getReportSummaryBySessionId,
  loadReportSummaries,
  saveWorkbenchContext
} = useWorkbenchPersistence()

const remoteReportSummaries = ref<PersistedReportSummary[]>([])
const remoteReportsLoaded = ref(false)

const mergeReportSummaries = () => {
  const summaryMap = new Map<string, PersistedReportSummary>()
  loadReportSummaries().forEach((item) => {
    summaryMap.set(item.sessionId, item)
  })
  if (remoteReportsLoaded.value) {
    remoteReportSummaries.value.forEach((item) => {
      summaryMap.set(item.sessionId, item)
    })
  }
  return [...summaryMap.values()].sort((prev, next) => {
    return new Date(next.createdAt).getTime() - new Date(prev.createdAt).getTime()
  })
}

const loadRemoteReportSummaries = async () => {
  if (!isInterviewReportApiAvailable()) {
    remoteReportsLoaded.value = true
    return
  }
  try {
    remoteReportSummaries.value = await listRemoteInterviewReports()
  } catch {
    remoteReportSummaries.value = []
  } finally {
    remoteReportsLoaded.value = true
  }
}

const {
  activeTopic,
  activeDocument,
  currentMode,
  currentSourceKey,
  currentSourceLabel,
  currentModeLabel,
  currentTopicLabel,
  inProgressSession,
  latestCompletedSession,
  latestReportSummary,
  progressPercent: overviewProgressPercent,
  statusLabel: overviewStatusLabel,
  summaryItems: overviewSummaryItems,
  primaryActionLabel: overviewPrimaryActionLabel
} = useOverviewLaunchState({
  resolveReportSummaries: mergeReportSummaries
})
const currentWorkbenchContext = computed(() => loadWorkbenchContext())

const initialWorkbenchContext = currentWorkbenchContext.value
const initialSceneIdBySourcePage: Record<string, string> = {
  overview: 'overview',
  library: 'library',
  'mock-interview-space': 'mock',
  practice: 'feedback',
  report: 'report'
}
const initialSceneId = initialSceneIdBySourcePage[initialWorkbenchContext?.sourcePage || 'overview'] || 'overview'
const initialSceneIndex = scenes.findIndex(scene => scene.id === initialSceneId)

const {
  refFileInput,
  refFolderInput,
  filterTabs: libraryFilterTabs,
  customCategoryLabels: libraryCustomCategoryLabels,
  sourceLabelMap: librarySourceLabelMap,
  topicLabelMap: libraryTopicLabelMap,
  activeFilter: libraryActiveFilter,
  documentList: libraryDocumentList,
  filteredDocuments,
  selectedDocumentId,
  setSelectedDocumentId,
  selectedDocument,
  showImportFeedback,
  importFeedbackText,
  workspaceTitle: libraryWorkspaceTitle,
  workspaceDesc: libraryWorkspaceDesc,
  nextStepTitle: libraryNextStepTitle,
  nextStepDesc: libraryNextStepDesc,
  derivedStats: libraryDerivedStats,
  formatBytes: formatLibraryBytes,
  pickFiles: pickLibraryFiles,
  pickFolder: pickLibraryFolder,
  handleFileChange: handleLibraryFileChange,
  updateDocumentCategories: updateLibraryDocumentCategories,
  removeDocument: removeLibraryDocument
} = useLibraryWorkspaceState({
  preferredTopic: activeTopic,
  preferredSource: currentSourceKey
})

const currentTrainingDocument = computed(() => selectedDocument.value || activeDocument.value)

const materialCompileOptions = ref<MaterialGroupCompileOptions>(defaultMaterialGroupCompileOptions())
const materialTopicFilter = ref<PersistedTopicKey | 'all'>('all')

const resolveMaterialTopicFilter = (): PersistedTopicKey[] | undefined => {
  if (materialTopicFilter.value === 'all') return undefined
  return [materialTopicFilter.value]
}
const {
  poolVersion: materialPoolVersion,
  resolvePoolForDocument,
  getPoolStatusLabel,
  prepareMaterialQuestions,
  touchPoolVersion: touchMaterialPoolVersion
} = useMaterialQuestionPoolState((documentId) => (
  libraryDocumentList.value.find(item => item.id === documentId) || null
))

const selectedMaterialPool = computed(() => {
  void materialPoolVersion.value
  return resolvePoolForDocument(currentTrainingDocument.value)
})

const librarySceneDerivedStats = computed(() => {
  void materialPoolVersion.value

  return libraryDerivedStats.value.map((item) => {
    if (!item.label.includes('练习题')) return item

    const questionTotal = libraryDocumentList.value.reduce((sum, doc) => {
      const pool = resolvePoolForDocument(doc)
      return sum + (pool?.questions.length ?? 0)
    }, 0)

    return {
      ...item,
      value: String(questionTotal),
      note: questionTotal > 0
        ? '跨全部资料汇总，右侧可选题开练'
        : '选中资料并点击「生成练习题」后汇总'
    }
  })
})

const materialPreviewCompileOptions = computed(() => ({
  count: materialCompileOptions.value.count,
  orderMode: materialCompileOptions.value.orderMode,
  shuffleSeed: materialCompileOptions.value.shuffleSeed ?? 0,
  difficultyFilter: materialCompileOptions.value.difficultyFilter,
  singleDifficulty: materialCompileOptions.value.singleDifficulty,
  topicFilter: resolveMaterialTopicFilter()
}))

const materialGroupPreview = computed(() => {
  const pool = selectedMaterialPool.value
  const document = currentTrainingDocument.value
  const compileOptions = materialPreviewCompileOptions.value
  if (!pool || pool.status !== 'ready' || !document) return null
  return buildMaterialQuestionGroup(pool, compileOptions, document.name)
})

const materialPoolStatusLabel = computed(() => getPoolStatusLabel(selectedMaterialPool.value))
const materialIsPreparing = computed(() => selectedMaterialPool.value?.status === 'preparing')
const canStartMaterialMock = computed(() => selectedMaterialPool.value?.status === 'ready'
  && Boolean(materialGroupPreview.value?.group.items.length))

const materialPreviewItems = computed(() => (
  materialGroupPreview.value?.group.items.map((item, index) => ({
    order: index + 1,
    questionId: item.questionId,
    title: item.title,
    difficulty: item.difficulty || 'medium',
    matchReason: typeof item.matchReason === 'string' ? item.matchReason : String(item.matchReason)
  })) || []
))

const materialPreviewSignature = computed(() => {
  const compileOptions = materialPreviewCompileOptions.value
  const itemSignature = materialPreviewItems.value
    .map(item => `${ item.order }:${ item.questionId }`)
    .join('|')
  return `${ compileOptions.count }:${ compileOptions.orderMode }:${ compileOptions.shuffleSeed }:${ materialTopicFilter.value }|${ itemSignature }`
})

const materialPoolQuestionTotal = computed(() => (
  selectedMaterialPool.value?.status === 'ready'
    ? selectedMaterialPool.value.questions.length
    : 0
))

const materialTopicTabs = computed(() => {
  const pool = selectedMaterialPool.value
  if (!pool || pool.status !== 'ready') return []
  return buildMaterialTopicTabs(pool.questions)
})

const materialFilteredQuestionTotal = computed(() => {
  const pool = selectedMaterialPool.value
  if (!pool || pool.status !== 'ready') return 0
  if (materialTopicFilter.value === 'all') return pool.questions.length
  return filterMaterialQuestionsByTopic(pool.questions, [materialTopicFilter.value]).length
})

const materialPreviewCount = computed(() => materialPreviewItems.value.length)

const materialCompileCountMax = computed(() => {
  const poolSize = materialFilteredQuestionTotal.value
  return Math.max(1, poolSize)
})

const materialOrderMode = computed(() => materialCompileOptions.value.orderMode)
const materialTopicFilterValue = computed(() => materialTopicFilter.value)

const materialGroupShortfallText = computed(() => {
  if (!materialGroupPreview.value?.isShortfall) return ''
  return `题库不足，仅找到 ${ materialGroupPreview.value.actualCount } / ${ materialGroupPreview.value.requestedCount } 题。`
})

const currentContextDocument = computed(() => {
  const activeDocumentId = currentWorkbenchContext.value?.activeDocumentId || ''
  if (!activeDocumentId) return null
  return libraryDocumentList.value.find(item => item.id === activeDocumentId) || null
})

const {
  currentGuide,
  currentFeedbackStyle,
  currentMockSessionConfig,
  hasNextMockFollowUp,
  hasMockSetup,
  currentPracticePlan,
  currentSessionId,
  displayAllMessages,
  displayMessages,
  answeredCount: mockAnsweredCount,
  currentQuestionPosition: mockCurrentQuestionPosition,
  isMockAwaitingSetup,
  mockAnswerDraft,
  mockSessionStatusText,
  totalCount: mockTotalCount,
  generatedThreadCount,
  mockPanelMeta,
  questionThreads: mockQuestionThreads,
  allQuestionThreads: mockAllQuestionThreads,
  activeQuestionThread,
  activeQuestionInstruction,
  activeMockHintLabel,
  activeMockHintText,
  activeQuestionReference,
  activeQuestionThreadId,
  primaryQuestion,
  clearMockAnswer,
  clearMockHistory,
  finalizeFinishedMockSession,
  finishMockSession,
  hasRestorableHistoryPreview,
  historyPreviewSessionId,
  isMockCurrentSubmitted,
  exitHistoryPreview,
  openLatestHistoryPreview,
  rotateMockFollowUp,
  selectQuestionThread,
  submitMockAnswer,
  updateFeedbackStyle
} = useMockInterviewSpaceMockState({
  isStreaming: isMockStreaming,
  activeDocument: currentContextDocument,
  messages: mockMessages,
  setActiveSessionId,
  setActiveThreadId,
  appendUserMessage,
  appendSystemMessage,
  startStream: startMockStream,
  clearMessages: clearMockMessages
})

const displayedLibraryDocuments = ref([...filteredDocuments.value])
const isLibraryListVisible = ref(true)
const libraryPageSize = 5
const libraryCurrentPage = ref(1)
let libraryListTransitionTimer: ReturnType<typeof setTimeout> | null = null

const libraryPageCount = computed(() => {
  return Math.max(1, Math.ceil(filteredDocuments.value.length / libraryPageSize))
})

const pagedLibraryDocuments = computed(() => {
  const startIndex = (libraryCurrentPage.value - 1) * libraryPageSize
  return filteredDocuments.value.slice(startIndex, startIndex + libraryPageSize)
})

const syncDisplayedLibraryDocuments = (nextList: typeof filteredDocuments.value, animate = true) => {
  if (libraryListTransitionTimer) {
    window.clearTimeout(libraryListTransitionTimer)
    libraryListTransitionTimer = null
  }

  if (!animate) {
    displayedLibraryDocuments.value = [...nextList]
    isLibraryListVisible.value = true
    return
  }

  isLibraryListVisible.value = false
  libraryListTransitionTimer = window.setTimeout(() => {
    displayedLibraryDocuments.value = [...nextList]
    isLibraryListVisible.value = true
    libraryListTransitionTimer = null
  }, 180)
}

watch(filteredDocuments, (nextList, previousList) => {
  const nextPageCount = Math.max(1, Math.ceil(nextList.length / libraryPageSize))

  if (libraryCurrentPage.value > nextPageCount) {
    libraryCurrentPage.value = nextPageCount
  }

  const shouldAnimate = Boolean(previousList)
  syncDisplayedLibraryDocuments(pagedLibraryDocuments.value, shouldAnimate)
}, {
  immediate: true,
  deep: true
})

watch(libraryActiveFilter, () => {
  libraryCurrentPage.value = 1
})

watch(libraryCurrentPage, () => {
  syncDisplayedLibraryDocuments(pagedLibraryDocuments.value)
})

watch(selectedDocumentId, () => {
  touchMaterialPoolVersion()
})

const activeInterviewDocumentMeta = computed(() => {
  const document = currentContextDocument.value
  if (!document) return []
  return [
    `资料: ${ document.name }`,
    `类型: ${ document.type.toUpperCase() }`,
    `主题: ${ currentTopicLabel.value }`
  ]
})

const mockQuestionPrompt = computed(() => {
  if (isMockAwaitingSetup.value) return ''
  if (activeQuestionInstruction.value) return activeQuestionInstruction.value
  return activeQuestionThread.value?.prompt || primaryQuestion.value?.prompt || ''
})
const mockHintText = computed(() => {
  if (isMockAwaitingSetup.value) return ''
  return activeMockHintText.value
})
const mockHintLabel = computed(() => {
  if (isMockAwaitingSetup.value) return '作答建议'
  return activeMockHintLabel.value
})

const getLocalReportSummaryBySessionId = (sessionId: string) => {
  return mergeReportSummaries().find(item => item.sessionId === sessionId)
    || getReportSummaryBySessionId(sessionId)
    || undefined
}

const reportTargetSession = computed(() => latestCompletedSession.value || inProgressSession.value || null)

const {
  reportAnswerSnapshotFromRemote,
  resolveReportSummary
} = useMockInterviewSpaceReportHydration({
  reportSession: reportTargetSession,
  getLocalReportSummary: getLocalReportSummaryBySessionId
})

const getMergedReportSummaryBySessionId = (sessionId: string) => resolveReportSummary(sessionId)

const handleMockOpenHistory = () => {
  if (openLatestHistory()) return
  window.$ModalMessage?.warning?.('当前无对话历史', {
    duration: 2200,
    closable: false
  })
}
const handleClearMockHistory = async () => {
  await clearAllMockHistory()
  await loadRemoteReportSummaries()
  window.$ModalMessage?.success?.('对话历史已清空', {
    duration: 2200,
    closable: false
  })
}
const {
  reportAnswerSnapshot,
  reportQuestionReviews,
  reportFocusAreas,
  reportHeaderMeta,
  reportLatestHistory,
  reportOverviewStats,
  reportPrimaryWeakness,
  reportSceneSummary,
  reportSnapshotItems,
  reportSummaryBody,
  reportSummaryHeadline,
  reportSuggestionList,
  reportWeaknessTags
} = useMockInterviewSpaceReportScene({
  activeDocument: currentContextDocument,
  currentModeLabel,
  currentSourceLabel,
  currentTopicLabel,
  inProgressSession,
  latestCompletedSession,
  latestReportSummary,
  getReportSummaryBySessionId: getMergedReportSummaryBySessionId,
  loadReportSummaries: mergeReportSummaries,
  reportAnswerSnapshotFromRemote
})

const practiceCompileOptions = ref<PracticeGroupCompileOptions>(defaultPracticeGroupCompileOptions())

const {
  poolVersion: practicePoolVersion,
  resolvePoolForSession,
  getPoolStatusLabel: getPracticePoolStatusLabel,
  isPracticePoolStale,
  preparePracticeQuestions
} = usePracticeQuestionPoolState()

const selectedPracticePool = computed(() => {
  void practicePoolVersion.value
  const sessionId = reportSceneSummary.value?.sessionId || ''
  if (!sessionId) return null
  return resolvePoolForSession(sessionId, reportSceneSummary.value)
})

const practicePoolStaleText = computed(() => (
  isPracticePoolStale(selectedPracticePool.value)
    ? selectedPracticePool.value?.errorMessage || ''
    : ''
))

const practicePreviewCompileOptions = computed(() => ({
  count: practiceCompileOptions.value.count,
  orderMode: practiceCompileOptions.value.orderMode,
  shuffleSeed: practiceCompileOptions.value.shuffleSeed ?? 0
}))

const resolvePracticePlanForPool = (
  pool: ReturnType<typeof resolvePoolForSession>,
  report: typeof reportSceneSummary.value
) => report?.practicePlan || pool?.planSnapshot || null

const practiceGroupPreview = computed(() => {
  const pool = selectedPracticePool.value
  const plan = resolvePracticePlanForPool(pool, reportSceneSummary.value)
  if (!pool || pool.status !== 'ready' || !plan) return null

  const compileOptions = {
    ...practicePreviewCompileOptions.value,
    count: Math.max(
      1,
      practicePreviewCompileOptions.value.count || pool.questions.length || plan.questionCount || 1
    )
  }

  return buildPracticeQuestionGroup(plan, {
    reportSummary: reportSceneSummary.value,
    pool,
    compileOptions,
    sourceSessionId: reportSceneSummary.value?.sessionId || pool.sessionId
  })
})

const practicePoolStatusLabel = computed(() => getPracticePoolStatusLabel(selectedPracticePool.value))
const practiceIsPreparing = computed(() => selectedPracticePool.value?.status === 'preparing')
const canStartPractice = computed(() => selectedPracticePool.value?.status === 'ready'
  && Boolean(practiceGroupPreview.value?.group.items.length))

const practicePreviewItems = computed(() => (
  practiceGroupPreview.value?.group.items.map((item, index) => ({
    order: index + 1,
    questionId: item.questionId,
    title: item.title,
    focusArea: item.focusArea,
    matchReason: typeof item.matchReason === 'string' ? item.matchReason : String(item.matchReason)
  })) || []
))

const practicePreviewSignature = computed(() => {
  const compileOptions = practicePreviewCompileOptions.value
  const itemSignature = practicePreviewItems.value
    .map(item => `${ item.order }:${ item.questionId }`)
    .join('|')
  return `${ compileOptions.count }:${ compileOptions.orderMode }:${ compileOptions.shuffleSeed }|${ itemSignature }`
})

const practicePoolQuestionTotal = computed(() => (
  selectedPracticePool.value?.status === 'ready'
    ? selectedPracticePool.value.questions.length
    : 0
))

const practicePoolPlanSnapshot = computed(() => {
  const pool = selectedPracticePool.value
  if (!pool || pool.status !== 'ready') return null
  return pool.planSnapshot
})

const practiceCompileCountMax = computed(() => Math.max(1, practicePoolQuestionTotal.value))

const practiceGroupShortfallText = computed(() => {
  if (!practiceGroupPreview.value?.isShortfall) return ''
  return `题池不足，仅找到 ${ practiceGroupPreview.value.actualCount } / ${ practiceGroupPreview.value.requestedCount } 题。`
})

const clampPracticeCompileCount = (value: number) => {
  const max = practiceCompileCountMax.value
  return Math.min(max, Math.max(1, value))
}

const handlePracticeCompileCountChange = (value: number) => {
  practiceCompileOptions.value = {
    ...practiceCompileOptions.value,
    count: clampPracticeCompileCount(value)
  }
}

watch(practiceCompileCountMax, (max) => {
  // 题池生成中 total 为 0，勿把用户刚选的出题数压回 1
  if (practicePoolQuestionTotal.value === 0) return
  if (practiceCompileOptions.value.count > max) {
    practiceCompileOptions.value = {
      ...practiceCompileOptions.value,
      count: max
    }
  }
})

const handlePreparePracticeQuestions = async (plan: PersistedPracticePlan) => {
  const report = reportSceneSummary.value
  if (!report?.sessionId) {
    window.$ModalMessage?.warning?.('请先完成一轮模拟面试并生成报告', {
      duration: 3200
    })
    return
  }

  const generateCount = Math.max(1, plan.questionCount || practiceCompileOptions.value.count)
  practiceCompileOptions.value = {
    ...practiceCompileOptions.value,
    count: generateCount
  }
  const result = await preparePracticeQuestions(
    report,
    plan,
    generateCount
  )
  if (!result.ok) {
    window.$ModalMessage?.warning?.(result.message, {
      duration: 3200
    })
    return
  }

  const poolSize = result.pool.questions.length
  if (!poolSize) return

  if (result.isShortfall) {
    window.$ModalMessage?.warning?.(
      `题池不足，仅生成 ${ result.actualCount } / ${ result.requestedCount } 题`,
      {
        duration: 3200
      }
    )
  }

  practiceCompileOptions.value = {
    ...practiceCompileOptions.value,
    count: clampPracticeCompileCount(
      practiceCompileOptions.value.count > poolSize ? poolSize : practiceCompileOptions.value.count
    ),
    orderMode: 'random',
    shuffleSeed: Date.now()
  }
  if (result.isShortfall) {
    window.$ModalMessage?.info?.(
      `已生成 ${ result.pool.questions.length } 题，少于请求的 ${ practiceCompileOptions.value.count } 题`,
      {
        duration: 3200
      }
    )
  }
}

const overviewPracticeRouteNote = computed(() => {
  const plan = reportSceneSummary.value?.practicePlan
  if (!plan?.weaknessTag) {
    return '完成一轮模拟面试并生成报告后，专项训练会按弱项自动推荐题目。'
  }
  return `最近一轮已识别弱项「${ plan.weaknessTag }」，专项训练会按报告配置从题库中自动选题。`
})

const {
  finishAndOpenReport,
  flowMode,
  openLatestHistory,
  restartLastMockRound,
  startMockRound,
  clearAllMockHistory
} = useMockInterviewFlow({
  activeSessionId: currentSessionId,
  currentContext: currentWorkbenchContext,
  currentMockSessionConfig,
  currentPracticePlan,
  currentTopic: activeTopic,
  currentMode,
  exitHistoryPreview,
  finalizeFinishedMockSession,
  finishMockRound: finishMockSession,
  hasMockSetup,
  hasRestorableHistory: hasRestorableHistoryPreview,
  openLatestHistoryPreview,
  previewSessionId: historyPreviewSessionId,
  saveWorkbenchContext,
  clearAllMockHistoryState: clearMockHistory
})

const handleMockFinish = async () => {
  if (!(await finishAndOpenReport())) return
  await loadRemoteReportSummaries()
  requestSceneChange(findSceneIndexById('report'), {
    pauseAutoplay: true,
    scrollToContent: true
  })
}

const sceneIndexById = scenes.reduce<Record<string, number>>((map, scene, index) => {
  map[scene.id] = index
  return map
}, {})

const findSceneIndexById = (id: string) => sceneIndexById[id] ?? -1

const transitionMs = 420
const centerSlot = 2
const orbitMotionTransition = `left ${ transitionMs }ms cubic-bezier(0.2, 0.9, 0.24, 1.02), top ${ transitionMs }ms cubic-bezier(0.2, 0.9, 0.24, 1.02), opacity 0.3s ease`

const orbitSlots = ref<OrbitSlot[]>([
  {
    left: 20.4,
    top: 53.8,
    visible: true
  },
  {
    left: 36.8,
    top: 69.2,
    visible: true
  },
  {
    left: 50.0,
    top: 74.1,
    visible: true
  },
  {
    left: 64.9,
    top: 70.0,
    visible: true
  },
  {
    left: 81.2,
    top: 56.1,
    visible: true
  }
])
const offscreenOrbitLeft = {
  left: -18,
  top: 47
}
const offscreenOrbitRight = {
  left: 118,
  top: 48
}

const pageRef = ref<HTMLElement | null>(null)
const contentSectionRef = ref<HTMLElement | null>(null)
const contentPanelRef = ref<HTMLElement | null>(null)
const contentLeadRef = ref<HTMLElement | null>(null)
const visualStageRef = ref<InstanceType<typeof SpaceVisualStage> | null>(null)
const headerRef = ref<HTMLElement | null>(null)
const isReportPreviewVisible = ref(false)
const isScrollCapsuleVisible = ref(true)
const scrollCapsuleHideLock = ref(false)
const forceScrollCapsuleVisible = ref(false)
/** 入场 animation 结束后置 true，避免 forwards 占用 opacity/transform 导致滚动渐隐失效 */
const isScrollCapsuleRevealSettled = ref(route.query.welcome !== '1')
const mockSceneResetVersion = ref(0)

let scrollCapsuleRevealTimer: ReturnType<typeof setTimeout> | null = null
let scrollCapsuleRevealSettleTimer: ReturnType<typeof setTimeout> | null = null

const clearScrollCapsuleRevealSettleTimer = () => {
  if (!scrollCapsuleRevealSettleTimer) return
  window.clearTimeout(scrollCapsuleRevealSettleTimer)
  scrollCapsuleRevealSettleTimer = null
}

const scheduleScrollCapsuleRevealSettle = () => {
  clearScrollCapsuleRevealSettleTimer()
  isScrollCapsuleRevealSettled.value = false
  scrollCapsuleRevealSettleTimer = window.setTimeout(() => {
    isScrollCapsuleRevealSettled.value = true
    scrollCapsuleRevealSettleTimer = null
  }, 900)
}

watch(isCosmosContentRevealed, (revealed) => {
  if (!revealed) {
    clearScrollCapsuleRevealSettleTimer()
    isScrollCapsuleRevealSettled.value = false
    return
  }
  if (isScrollCapsuleRevealSettled.value) return
  scheduleScrollCapsuleRevealSettle()
}, {
  immediate: true
})

/** 宇宙页首屏顶栏（未滚动）标准样式，登录门控与之保持一致 */
const cosmosRestingHeaderStyle = {
  opacity: '1',
  transform: 'translateY(0)',
  pointerEvents: 'auto',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  '--header-mask-opacity': '1',
  '--header-border-opacity': '0.08',
  '--header-bg-opacity': '0.92'
} as CSSProperties

const sceneShellStyle = computed<CSSProperties>(() => ({
  background: activeScene.value.shellBackground,
  '--scene-line': activeScene.value.theme.line,
  '--scene-primary': activeScene.value.theme.primary,
  '--scene-secondary': activeScene.value.theme.secondary,
  '--scene-dot': activeScene.value.theme.dot,
  '--scene-dot-active': activeScene.value.theme.activeDot
} as CSSProperties))

const headerStyle = computed<CSSProperties>(() => {
  const fade = headerFade.value

  // 登录门控 + 宇宙首屏：统一使用宇宙页静止顶栏样式
  if (!isCosmosChromeReady.value || fade < 0.02) {
    return cosmosRestingHeaderStyle
  }

  return {
    opacity: '0',
    transform: 'translateY(0)',
    pointerEvents: 'none',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    '--header-mask-opacity': '0',
    '--header-border-opacity': '0',
    '--header-bg-opacity': '0'
  } as CSSProperties
})

const syncVisualLayers = (immediate = false) => {
  visualStageRef.value?.syncVisualLayers(immediate)
}

/** 星球层默认 opacity 为 0，必须在 SpaceVisualStage 挂载后同步一次 */
const bootstrapVisualStage = () => {
  requestAnimationFrame(() => {
    refreshScrollMetrics()
    syncVisualLayers(true)
    updateScrollCapsuleVisibility()
  })
}

const scheduleVisualStageBootstrap = async () => {
  await nextTick()
  await nextTick()
  bootstrapVisualStage()
}

watch(visualStageRef, (stage) => {
  if (stage && !isCosmosBigBangPending.value) {
    void scheduleVisualStageBootstrap()
  }
})

const clearTransitionTimers = () => {
  clearScrollTimers()
  clearOrbitTimers()
  if (scrollCapsuleRevealTimer) {
    window.clearTimeout(scrollCapsuleRevealTimer)
    scrollCapsuleRevealTimer = null
  }
  clearScrollCapsuleRevealSettleTimer()
}

let orbitScrollToSceneContent: (delay?: number, duration?: number) => void = () => {}

const {
  activeScene,
  activeSceneIndexBySlot,
  autoplay,
  autoplayPausedByContent,
  clearOrbitTimers,
  copyScene,
  displayScene,
  goToNext,
  goToPrev,
  handleOrbitStopClick,
  isCopyVisible,
  isFastOrbitTransition,
  isOrbitPlayBursting,
  lastOrbitDirection,
  orbitClass,
  orbitGhosts,
  orbitProgress,
  orbitStopStyle,
  orderedSceneIndexes,
  pauseAutoplay,
  pauseAutoplayFromContent,
  requestSceneChange,
  snapToScene,
  startAutoplay,
  toggleAutoplay
} = useMockInterviewSpaceOrbit({
  scenes,
  initialActiveIndex: initialSceneIndex >= 0 ? initialSceneIndex : 0,
  centerSlot,
  transitionMs,
  orbitSlots,
  offscreenOrbitLeft,
  offscreenOrbitRight,
  orbitMotionTransition,
  scrollToSceneContent: (...args) => orbitScrollToSceneContent(...args)
})

const {
  headerFade,
  isAutoScrolling,
  isUserScrolling,
  clearScrollTimers,
  handleWheelDuringAutoScroll,
  hasReturnedToOrbitZone,
  refreshScrollMetrics,
  scrollToContentPreview,
  scrollToSceneContent,
  updateHeaderFade
} = useMockInterviewSpaceScroll({
  pageRef,
  headerRef,
  contentSectionRef,
  contentPanelRef,
  contentLeadRef,
  pauseAutoplay,
  pauseAutoplayFromContent
})

const isOrbitPlayReady = computed(() => !autoplay.value && (!autoplayPausedByContent.value || hasReturnedToOrbitZone()))

orbitScrollToSceneContent = (...args) => scrollToSceneContent(...args)

const resolveHeaderElement = (element: HTMLElement | null) => {
  headerRef.value = element
}

const resolveContentSectionElement = (element: HTMLElement | null) => {
  contentSectionRef.value = element
}

const resolveContentPanelElement = (element: HTMLElement | null) => {
  contentPanelRef.value = element
}

const resolveContentLeadElement = (element: HTMLElement | null) => {
  contentLeadRef.value = element
}

const revealScrollCapsule = (duration = 3000) => {
  if (scrollCapsuleRevealTimer) {
    window.clearTimeout(scrollCapsuleRevealTimer)
    scrollCapsuleRevealTimer = null
  }

  forceScrollCapsuleVisible.value = true
  scrollCapsuleHideLock.value = false
  isScrollCapsuleVisible.value = true

  scrollCapsuleRevealTimer = window.setTimeout(() => {
    forceScrollCapsuleVisible.value = false
    scrollCapsuleRevealTimer = null
    updateScrollCapsuleVisibility()
  }, duration)
}

const releaseScrollCapsuleReveal = () => {
  if (scrollCapsuleRevealTimer) {
    window.clearTimeout(scrollCapsuleRevealTimer)
    scrollCapsuleRevealTimer = null
  }

  forceScrollCapsuleVisible.value = false
}

const persistSceneContext = (sceneId: string) => {
  const context = loadWorkbenchContext()
  const sourcePageBySceneId: Record<string, string> = {
    overview: 'overview',
    library: 'library',
    mock: 'mock-interview-space',
    feedback: 'practice',
    report: 'report'
  }

  const sourcePage = sourcePageBySceneId[sceneId]
  if (!sourcePage) return

  saveWorkbenchContext({
    activeTopic: activeTopic.value,
    activeDocumentId: context?.activeDocumentId || '',
    currentMode: currentMode.value,
    sourcePage,
    practicePlan: context?.practicePlan || null,
    mockEntryMode: context?.mockEntryMode || 'direct',
    mockSessionConfig: context?.mockSessionConfig || null
  })
}

const buildDirectMockSessionConfig = (
  feedbackStyle: PersistedInterviewFeedbackStyle = currentFeedbackStyle.value
): PersistedMockSessionConfig => ({
  entryMode: 'direct',
  activeDocumentId: currentTrainingDocument.value?.id || '',
  feedbackStyle
})

const buildPracticeMockSessionConfig = (
  plan: PersistedPracticePlan,
  feedbackStyle: PersistedInterviewFeedbackStyle = currentFeedbackStyle.value
): PersistedMockSessionConfig => ({
  entryMode: 'practice',
  activeDocumentId: currentTrainingDocument.value?.id || '',
  feedbackStyle,
  zone: plan.zone,
  questionType: plan.questionType,
  questionCount: plan.questionCount,
  difficulty: plan.difficulty
})

const buildMaterialMockSessionConfig = (
  activeDocumentId: string,
  questionCount: number,
  feedbackStyle: PersistedInterviewFeedbackStyle = currentFeedbackStyle.value
): PersistedMockSessionConfig => ({
  entryMode: 'material',
  activeDocumentId,
  feedbackStyle,
  questionCount
})

const resolveInitialSceneId = () => {
  const sceneIdBySourcePage: Record<string, string> = {
    overview: 'overview',
    library: 'library',
    'mock-interview-space': 'mock',
    practice: 'feedback',
    report: 'report'
  }

  const sourcePage = loadWorkbenchContext()?.sourcePage || 'overview'
  return sceneIdBySourcePage[sourcePage] || 'overview'
}

const openSceneContent = (sceneId: string) => {
  if (sceneId === 'mock' && flowMode.value === 'report') {
    finalizeFinishedMockSession()
    mockSceneResetVersion.value += 1
  }
  if (sceneId !== 'mock') {
    exitHistoryPreview()
  }
  persistSceneContext(sceneId)
  requestSceneChange(findSceneIndexById(sceneId), {
    pauseAutoplay: true,
    scrollToContent: true
  })
}

const resetCosmosToOverviewHome = (options?: {
  startAutoplay?: boolean
  instant?: boolean
}) => {
  const overviewIndex = findSceneIndexById('overview')
  if (overviewIndex < 0) return

  persistSceneContext('overview')
  if (options?.instant) {
    snapToScene(overviewIndex)
  } else {
    requestSceneChange(overviewIndex, {
      pauseAutoplay: false,
      scrollToContent: false
    })
  }

  nextTick(() => {
    if (pageRef.value) {
      pageRef.value.scrollTop = 0
    }
    refreshScrollMetrics()
    updateHeaderFade()
    releaseScrollCapsuleReveal()
    scrollCapsuleHideLock.value = false
    isScrollCapsuleVisible.value = true
    updateScrollCapsuleVisibility()
    if (options?.startAutoplay !== false) {
      startAutoplay()
    }
  })
}

const handleBigBangOverlayComplete = () => {
  bigBangOverlayResolver?.()
  bigBangOverlayResolver = null
  isCosmosBigBangPlaying.value = false
}

const runCosmosBigBangEntrance = async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    isCosmosContentRevealed.value = true
    isScrollCapsuleRevealSettled.value = true
    bootstrapVisualStage()
    return
  }

  isCosmosContentRevealed.value = false
  isCosmosBigBangPlaying.value = true

  await nextTick()
  await nextTick()

  const overlayPromise = new Promise<void>((resolve) => {
    bigBangOverlayResolver = resolve
  })
  const planetsPromise = visualStageRef.value?.playBigBangReveal() ?? Promise.resolve()

  await Promise.all([overlayPromise, planetsPromise])

  isCosmosContentRevealed.value = true
  refreshScrollMetrics()
  updateHeaderFade()
  releaseScrollCapsuleReveal()
  scrollCapsuleHideLock.value = false
  isScrollCapsuleVisible.value = true
  updateScrollCapsuleVisibility()
}

const runWelcomeEntranceIfNeeded = async () => {
  if (route.query.welcome !== '1') {
    isCosmosContentRevealed.value = true
    return
  }

  isCosmosBigBangPending.value = true
  isCosmosContentRevealed.value = false
  resetCosmosToOverviewHome({
    startAutoplay: false,
    instant: true
  })

  const restQuery = {
    ...route.query
  }
  delete restQuery.welcome
  await router.replace({
    path: route.path,
    query: restQuery
  })

  await runCosmosBigBangEntrance()
  isCosmosBigBangPending.value = false
  startAutoplay()
}

const clampMaterialCompileCount = (value: number) => {
  const max = materialCompileCountMax.value
  return Math.max(1, Math.min(max, value || 1))
}

const handleMaterialCompileCountChange = (value: number) => {
  materialCompileOptions.value = {
    ...materialCompileOptions.value,
    count: clampMaterialCompileCount(value)
  }
}

const handleMaterialOrderModeChange = (orderMode: 'chapter' | 'random') => {
  materialCompileOptions.value = {
    ...materialCompileOptions.value,
    orderMode,
    shuffleSeed: orderMode === 'random' ? Date.now() : 0
  }
}

const handleMaterialTopicFilterChange = (value: PersistedTopicKey | 'all') => {
  materialTopicFilter.value = value
  materialCompileOptions.value = {
    ...materialCompileOptions.value,
    topicFilter: value === 'all' ? undefined : [value]
  }
  if (materialPoolQuestionTotal.value === 0) return
  if (materialCompileOptions.value.count > materialCompileCountMax.value) {
    materialCompileOptions.value = {
      ...materialCompileOptions.value,
      count: materialCompileCountMax.value
    }
  }
}

watch(selectedDocumentId, () => {
  materialTopicFilter.value = 'all'
})

watch(materialFilteredQuestionTotal, (total) => {
  if (materialPoolQuestionTotal.value === 0) return
  if (total > 0 && materialCompileOptions.value.count > total) {
    materialCompileOptions.value = {
      ...materialCompileOptions.value,
      count: total
    }
  }
})

watch(materialCompileCountMax, (max) => {
  // 题池生成中 total 为 0，勿把用户刚选的出题数压回 1
  if (materialPoolQuestionTotal.value === 0) return
  if (materialCompileOptions.value.count > max) {
    materialCompileOptions.value = {
      ...materialCompileOptions.value,
      count: max
    }
  }
})

const handleDeleteLibraryDocument = (documentId: string) => {
  removeLibraryDocument(documentId)
  touchMaterialPoolVersion()
}

const handleUpdateLibraryDocumentCategories = (payload: {
  documentId: string
  name: string
  tags: string[]
}) => {
  updateLibraryDocumentCategories(payload.documentId, {
    name: payload.name,
    tags: payload.tags
  })
}

const handlePrepareMaterialQuestions = async () => {
  const document = currentTrainingDocument.value
  if (!document) {
    window.$ModalMessage?.warning?.('请先选择一份资料', {
      duration: 2600
    })
    return
  }

  const result = await prepareMaterialQuestions(document.id)
  if (!result.ok) {
    window.$ModalMessage?.warning?.(result.message, {
      duration: 3200
    })
    return
  }

  const poolSize = materialFilteredQuestionTotal.value || result.pool.questions.length
  if (!poolSize) return

  materialCompileOptions.value = {
    ...materialCompileOptions.value,
    topicFilter: resolveMaterialTopicFilter(),
    count: clampMaterialCompileCount(
      materialCompileOptions.value.count > poolSize ? poolSize : materialCompileOptions.value.count
    )
  }
  if (materialCompileOptions.value.orderMode === 'random') {
    materialCompileOptions.value = {
      ...materialCompileOptions.value,
      shuffleSeed: Date.now()
    }
  }

  const roundCount = materialCompileOptions.value.count
  window.$ModalMessage?.success?.(`练习题生成成功，本轮 ${ roundCount } 题`, {
    duration: 2200,
    closable: false
  })
}

const handleStartMaterialMockFromLibrary = () => {
  const document = currentTrainingDocument.value
  const pool = selectedMaterialPool.value
  if (!document) {
    window.$ModalMessage?.warning?.('请先选择一份资料', {
      duration: 2600
    })
    return
  }
  if (!pool || pool.status !== 'ready') {
    window.$ModalMessage?.warning?.('请先生成练习题', {
      duration: 2600
    })
    return
  }

  const buildResult = buildMaterialQuestionGroup(pool, materialPreviewCompileOptions.value, document.name)
  if (!buildResult.group.items.length) {
    window.$ModalMessage?.warning?.('当前筛选条件下没有可用题目', {
      duration: 3200
    })
    return
  }

  const practiceQuestionGroup = {
    ...buildResult.group,
    status: 'in_progress' as const
  }
  const activeDocumentId = document.id
  const activeTopicKey = (
    materialTopicFilter.value !== 'all'
      ? materialTopicFilter.value
      : document.topicKeys[0] || activeTopic.value
  )

  startMockRound({
    activeDocumentId,
    activeTopic: activeTopicKey,
    currentMode: 'standard',
    mockEntryMode: 'material',
    practicePlan: null,
    mockSessionConfig: buildMaterialMockSessionConfig(activeDocumentId, buildResult.actualCount),
    sourcePage: 'mock-interview-space'
  })
  saveWorkbenchContext({
    activeTopic: activeTopicKey,
    activeDocumentId,
    currentMode: 'standard',
    sourcePage: 'mock-interview-space',
    practicePlan: null,
    practiceQuestionGroup,
    mockEntryMode: 'material',
    mockSessionConfig: buildMaterialMockSessionConfig(activeDocumentId, buildResult.actualCount)
  })
  requestSceneChange(findSceneIndexById('mock'), {
    pauseAutoplay: true,
    scrollToContent: true
  })

  if (buildResult.isShortfall) {
    window.$ModalMessage?.info?.(
      `题库不足，本轮将练 ${ buildResult.actualCount } / ${ buildResult.requestedCount } 题。`,
      {
        duration: 3200
      }
    )
  }
}

const openMockSceneFromLibrary = () => {
  const activeDocumentId = currentTrainingDocument.value?.id || currentWorkbenchContext.value?.activeDocumentId || ''
  startMockRound({
    activeDocumentId,
    activeTopic: activeTopic.value,
    currentMode: currentMode.value,
    mockEntryMode: 'direct',
    practicePlan: null,
    mockSessionConfig: buildDirectMockSessionConfig(),
    sourcePage: 'mock-interview-space'
  })
  requestSceneChange(findSceneIndexById('mock'), {
    pauseAutoplay: true,
    scrollToContent: true
  })
}

const handleOverviewPrimaryAction = () => {
  openSceneContent('library')
}

const handleOverviewSecondaryAction = () => {
  openSceneContent('library')
}

const handleOverviewReportAction = () => {
  openSceneContent('report')
}

const handleReportContinueMock = () => {
  if (!restartLastMockRound()) {
    const latestSession = latestCompletedSession.value
    const summaryPlan = reportSceneSummary.value?.practicePlan || null
    const restoredDocumentId = reportSceneSummary.value?.sourceDocumentId
      || latestSession?.sourceDocumentId
      || currentContextDocument.value?.id
      || currentWorkbenchContext.value?.activeDocumentId
      || ''
    startMockRound({
      activeDocumentId: restoredDocumentId,
      activeTopic: latestSession?.topic || activeTopic.value,
      currentMode: latestSession?.mode || currentMode.value,
      mockEntryMode: summaryPlan ? 'practice' : 'direct',
      practicePlan: summaryPlan,
      mockSessionConfig: summaryPlan
        ? {
          ...buildPracticeMockSessionConfig(summaryPlan),
          activeDocumentId: restoredDocumentId
        }
        : {
          entryMode: 'direct',
          activeDocumentId: restoredDocumentId,
          feedbackStyle: currentFeedbackStyle.value
        },
      sourcePage: 'mock-interview-space'
    })
  }
  requestSceneChange(findSceneIndexById('mock'), {
    pauseAutoplay: true,
    scrollToContent: true
  })
}

const practiceTopicByZone: Record<PersistedPracticePlan['zone'], keyof typeof topicLabelMap> = {
  vue: 'vue3',
  javascript: 'browser',
  typescript: 'typescript',
  engineering: 'engineering',
  performance: 'performance'
}

const handlePracticeStart = (plan: PersistedPracticePlan) => {
  const pool = selectedPracticePool.value
  if (!pool || pool.status !== 'ready') {
    window.$ModalMessage?.warning?.('请先生成补练题', {
      duration: 2600
    })
    return
  }

  const effectivePlan = resolvePracticePlanForPool(pool, reportSceneSummary.value) || plan
  const buildResult = buildPracticeQuestionGroup(effectivePlan, {
    reportSummary: reportSceneSummary.value,
    pool,
    compileOptions: practiceCompileOptions.value,
    sourceSessionId: reportSceneSummary.value?.sessionId
  })
  if (!buildResult.group.items.length) {
    window.$ModalMessage?.warning?.('当前题池没有可用题目', {
      duration: 3200
    })
    return
  }
  const practiceQuestionGroup = {
    ...buildResult.group,
    status: 'in_progress' as const
  }

  startMockRound({
    activeDocumentId: currentTrainingDocument.value?.id || currentWorkbenchContext.value?.activeDocumentId || '',
    activeTopic: practiceTopicByZone[effectivePlan.zone] || activeTopic.value,
    currentMode: 'standard',
    mockEntryMode: 'practice',
    practicePlan: effectivePlan,
    mockSessionConfig: buildPracticeMockSessionConfig(effectivePlan),
    sourcePage: 'mock-interview-space'
  })
  saveWorkbenchContext({
    activeTopic: practiceTopicByZone[effectivePlan.zone] || activeTopic.value,
    activeDocumentId: currentTrainingDocument.value?.id || currentWorkbenchContext.value?.activeDocumentId || '',
    currentMode: 'standard',
    sourcePage: 'mock-interview-space',
    practicePlan: effectivePlan,
    practiceQuestionGroup,
    mockEntryMode: 'practice',
    mockSessionConfig: buildPracticeMockSessionConfig(effectivePlan)
  })
  requestSceneChange(findSceneIndexById('mock'), {
    pauseAutoplay: true,
    scrollToContent: true
  })
}

const handleReportContinuePractice = () => {
  const sessionId = reportSceneSummary.value?.sessionId
  const pool = sessionId
    ? resolvePoolForSession(sessionId, reportSceneSummary.value)
    : null
  const summaryPlan = resolvePracticePlanForPool(pool, reportSceneSummary.value)

  if (summaryPlan && pool?.status === 'ready' && pool.questions.length) {
    handlePracticeStart(summaryPlan)
    return
  }

  openSceneContent('feedback')
  if (summaryPlan) {
    window.$ModalMessage?.info?.('请先在专项训练页点击「生成补练题」', {
      duration: 3200
    })
  }
}

const handleReportBackToLibrary = () => {
  openSceneContent('library')
}

const handleReportOpenHistory = () => {
  handleMockOpenHistory()
  if (flowMode.value === 'history_preview') {
    requestSceneChange(findSceneIndexById('mock'), {
      pauseAutoplay: true,
      scrollToContent: true
    })
  }
}

const handleReportOpenWorkbenchReport = () => {
  isReportPreviewVisible.value = true
}

const handleMockStop = () => {
  if (!isMockStreaming.value) return
  stopMockStream()
  appendSystemMessage('本次生成已停止。你可以补充回答后重新提交，或者直接结束本轮查看复盘。')
}

const handleMockFeedbackStyleChange = (feedbackStyle: PersistedInterviewFeedbackStyle) => {
  updateFeedbackStyle(feedbackStyle)
}

const handleReportPreviewContinuePractice = () => {
  isReportPreviewVisible.value = false
  handleReportContinuePractice()
}

const handleReportPreviewContinueMock = () => {
  isReportPreviewVisible.value = false
  handleReportContinueMock()
}

const handleOrbitSceneSelect = (index: number) => {
  revealScrollCapsule()
  const nextScene = scenes[index]
  if (nextScene) {
    if (nextScene.id === 'mock' && flowMode.value === 'report') {
      finalizeFinishedMockSession()
      mockSceneResetVersion.value += 1
    }
    if (nextScene.id !== 'mock') {
      exitHistoryPreview()
    }
    persistSceneContext(nextScene.id)
  }
  handleOrbitStopClick(index)
}

const handleScrollCapsuleClick = () => {
  releaseScrollCapsuleReveal()
  scrollCapsuleHideLock.value = true
  isScrollCapsuleVisible.value = false
  scrollToContentPreview()
}

const handleVisualResize = () => {
  refreshScrollMetrics()
  syncVisualLayers(true)
  updateScrollCapsuleVisibility()
}

const updateScrollCapsuleVisibility = () => {
  if (forceScrollCapsuleVisible.value) {
    isScrollCapsuleVisible.value = true
    return
  }

  const page = pageRef.value
  const panel = contentPanelRef.value || contentSectionRef.value
  if (!page || !panel) {
    isScrollCapsuleVisible.value = true
    scrollCapsuleHideLock.value = false
    return
  }

  const triggerTop = Math.max(140, panel.offsetTop - 180)
  const releaseTop = Math.max(0, triggerTop - 140)
  const scrollTop = page.scrollTop

  if (!scrollCapsuleHideLock.value && scrollTop >= triggerTop) {
    scrollCapsuleHideLock.value = true
    isScrollCapsuleVisible.value = false
    return
  }

  if (scrollCapsuleHideLock.value && scrollTop <= releaseTop) {
    scrollCapsuleHideLock.value = false
    isScrollCapsuleVisible.value = true
    return
  }

  isScrollCapsuleVisible.value = !scrollCapsuleHideLock.value
}

const handlePageScroll = () => {
  updateHeaderFade()
  updateScrollCapsuleVisibility()
}

watch(orderedSceneIndexes, async () => {
  await nextTick()
  refreshScrollMetrics()
  syncVisualLayers()
  updateScrollCapsuleVisibility()
})

watch(displayScene, async () => {
  await nextTick()
  refreshScrollMetrics()
  updateHeaderFade()
  updateScrollCapsuleVisibility()
})

onMounted(async () => {
  const isWelcomeEntrance = route.query.welcome === '1'
  const context = loadWorkbenchContext()
  const restoredSceneId = resolveInitialSceneId()
  const restoredSceneIndex = findSceneIndexById(restoredSceneId)
  const shouldRestoreContentScene = restoredSceneId !== 'overview'
  saveWorkbenchContext({
    activeTopic: activeTopic.value,
    activeDocumentId: context?.activeDocumentId || '',
    currentMode: currentMode.value,
    sourcePage: context?.sourcePage || 'overview',
    practicePlan: context?.practicePlan || null,
    mockEntryMode: context?.mockEntryMode || 'direct',
    mockSessionConfig: context?.mockSessionConfig || null
  })

  requestSceneChange(restoredSceneIndex, {
    pauseAutoplay: shouldRestoreContentScene,
    scrollToContent: false
  })

  nextTick(() => {
    if (pageRef.value) {
      pageRef.value.scrollTop = 0
    }
    releaseScrollCapsuleReveal()
    scrollCapsuleHideLock.value = false
    isScrollCapsuleVisible.value = true
    if (!isWelcomeEntrance) {
      void scheduleVisualStageBootstrap()
    }
    updateScrollCapsuleVisibility()
  })
  if (!shouldRestoreContentScene && !isWelcomeEntrance) {
    startAutoplay()
  }
  updateHeaderFade()
  window.addEventListener('resize', handleVisualResize)
  pageRef.value?.addEventListener('scroll', handlePageScroll, {
    passive: true
  })
  pageRef.value?.addEventListener('wheel', handleWheelDuringAutoScroll, {
    passive: false
  })
  void loadRemoteReportSummaries()
  await runWelcomeEntranceIfNeeded()
})

onBeforeUnmount(() => {
  if (libraryListTransitionTimer) {
    window.clearTimeout(libraryListTransitionTimer)
    libraryListTransitionTimer = null
  }
  clearTransitionTimers()
  window.removeEventListener('resize', handleVisualResize)
  visualStageRef.value?.clearVisualLayerTweens()
  pageRef.value?.removeEventListener('scroll', handlePageScroll)
  pageRef.value?.removeEventListener('wheel', handleWheelDuringAutoScroll)
})
</script>

<template>
  <div
    ref="pageRef"
    class="interview-space-showcase"
    :class="{
      'is-auto-scrolling': isAutoScrolling,
      'is-fast-orbit-transition': isFastOrbitTransition,
      'is-user-scrolling': isUserScrolling
    }"
    :style="sceneShellStyle"
  >
    <input
      ref="refFileInput"
      type="file"
      accept=".md,.docx"
      multiple
      class="hidden"
      @change="handleLibraryFileChange"
    >
    <input
      ref="refFolderInput"
      type="file"
      accept=".md,.docx"
      multiple
      webkitdirectory
      class="hidden"
      @change="handleLibraryFileChange"
    >

    <SpaceHeader
      :header-style="headerStyle"
      :is-auto-scrolling="isAutoScrolling"
      :is-user-scrolling="isUserScrolling"
      @resolve-element="resolveHeaderElement"
    />

    <div class="showcase-body">
      <SpaceCosmosBigBang
        v-if="isCosmosBigBangPlaying"
        @complete="handleBigBangOverlayComplete"
      />

      <div
        class="cosmos-gate-root"
        :class="{
          'is-big-bang-active': isCosmosBigBangPending,
          'is-content-revealed': isCosmosContentRevealed,
          'is-scroll-capsule-reveal-settled': isScrollCapsuleRevealSettled
        }"
      >
        <SpaceScrollCapsule
          :is-user-scrolling="isUserScrolling"
          :visible="isScrollCapsuleVisible"
          @scroll="handleScrollCapsuleClick"
        />

        <main class="hero-stage">
          <section class="copy-column">
            <Transition
              mode="out-in"
              name="scene-copy"
            >
              <div
                v-if="isCopyVisible"
                :key="copyScene.id"
                class="copy-inner"
                :class="{ 'is-overview-copy': copyScene.id === 'overview' }"
              >
                <h1>{{ copyScene.title }}</h1>
                <p class="summary">{{ copyScene.summary }}</p>

                <ul class="bullet-list">
                  <li
                    v-for="bullet in copyScene.bullets"
                    :key="bullet"
                  >
                    {{ bullet }}
                  </li>
                </ul>
              </div>
            </Transition>
          </section>

          <SpaceVisualStage
            ref="visualStageRef"
            :active-scene-index-by-slot="activeSceneIndexBySlot"
            :center-slot="centerSlot"
            :last-orbit-direction="lastOrbitDirection"
            :ordered-scene-indexes="orderedSceneIndexes"
            :scenes="scenes"
            :transition-ms="transitionMs"
          />
        </main>

        <SpaceOrbitNav
          :autoplay="autoplay"
          :is-fast-orbit-transition="isFastOrbitTransition"
          :is-orbit-play-bursting="isOrbitPlayBursting"
          :is-play-ready="isOrbitPlayReady"
          :orbit-class="orbitClass"
          :orbit-ghosts="orbitGhosts"
          :orbit-progress="orbitProgress"
          :orbit-stop-style="orbitStopStyle"
          :scenes="scenes"
          @next="goToNext"
          @prev="goToPrev"
          @select="handleOrbitSceneSelect"
          @toggle="toggleAutoplay"
        />

        <SpaceContentPanel
          :active-document="currentContextDocument"
          :active-interview-document-meta="activeInterviewDocumentMeta"
          :current-topic-label="currentTopicLabel"
          :display-scene="displayScene"
          :displayed-library-documents="displayedLibraryDocuments"
          :format-library-bytes="formatLibraryBytes"
          :import-feedback-text="importFeedbackText"
          :is-library-list-visible="isLibraryListVisible"
          :library-current-page="libraryCurrentPage"
          :library-filtered-count="filteredDocuments.length"
          :is-mock-current-submitted="isMockCurrentSubmitted"
          :is-mock-streaming="isMockStreaming"
          :library-active-filter="libraryActiveFilter"
          :library-derived-stats="librarySceneDerivedStats"
          :library-filter-tabs="libraryFilterTabs"
          :library-custom-category-labels="libraryCustomCategoryLabels"
          :library-next-step-desc="libraryNextStepDesc"
          :library-next-step-title="libraryNextStepTitle"
          :library-page-count="libraryPageCount"
          :library-source-label-map="librarySourceLabelMap"
          :library-topic-label-map="libraryTopicLabelMap"
          :library-workspace-desc="libraryWorkspaceDesc"
          :library-workspace-title="libraryWorkspaceTitle"
          :mock-answer-draft="mockAnswerDraft"
          :mock-all-messages="displayAllMessages"
          :mock-hint-text="mockHintText"
          :mock-hint-label="mockHintLabel"
          :mock-question-reference="activeQuestionReference"
          :mock-messages="displayMessages"
          :mock-panel-meta="mockPanelMeta"
          :mock-feedback-style="currentFeedbackStyle"
          :mock-question-threads="mockAllQuestionThreads"
          :mock-active-question-thread-id="activeQuestionThreadId"
          :mock-practice-plan="currentPracticePlan"
          :mock-has-next-question="hasNextMockFollowUp"
          :mock-has-recent-history="hasRestorableHistoryPreview"
          :mock-is-awaiting-setup="isMockAwaitingSetup"
          :mock-session-status-text="mockSessionStatusText"
          :mock-answered-count="mockAnsweredCount"
          :mock-current-question-position="mockCurrentQuestionPosition"
          :mock-total-count="mockTotalCount"
          :mock-generated-thread-count="generatedThreadCount"
          :mock-is-viewing-history-preview="flowMode === 'history_preview'"
          :mock-scene-reset-version="mockSceneResetVersion"
          :mock-question-prompt="mockQuestionPrompt"
          :mock-scroll-version="mockScrollVersion"
          :mock-stream-error="mockStreamError"
          :mock-stream-mode="mockStreamMode"
          :mock-stream-mode-label="mockStreamModeLabel"
          :overview-primary-action-label="overviewPrimaryActionLabel"
          :overview-progress-percent="overviewProgressPercent"
          :overview-status-label="overviewStatusLabel"
          :overview-summary-items="overviewSummaryItems"
          :overview-practice-route-note="overviewPracticeRouteNote"
          :report-header-meta="reportHeaderMeta"
          :report-answer-snapshot="reportAnswerSnapshot"
          :report-question-reviews="reportQuestionReviews"
          :report-focus-areas="reportFocusAreas"
          :report-latest-history="reportLatestHistory"
          :report-overview-stats="reportOverviewStats"
          :report-primary-weakness="reportPrimaryWeakness"
          :report-scene-summary="reportSceneSummary"
          :report-snapshot-items="reportSnapshotItems"
          :report-summary-body="reportSummaryBody"
          :report-summary-headline="reportSummaryHeadline"
          :report-suggestion-list="reportSuggestionList"
          :report-weakness-tags="reportWeaknessTags"
          :selected-document="selectedDocument"
          :selected-document-id="selectedDocumentId"
          :show-import-feedback="showImportFeedback"
          :topic-label-map="topicLabelMap"
          :material-compile-count="materialCompileOptions.count"
          :material-compile-count-max="materialCompileCountMax"
          :material-order-mode="materialOrderMode"
          :material-topic-filter="materialTopicFilterValue"
          :material-topic-tabs="materialTopicTabs"
          :material-filtered-question-total="materialFilteredQuestionTotal"
          :material-pool-question-total="materialPoolQuestionTotal"
          :material-preview-count="materialPreviewCount"
          :material-preview-signature="materialPreviewSignature"
          :material-group-shortfall-text="materialGroupShortfallText"
          :material-is-preparing="materialIsPreparing"
          :material-pool-status-label="materialPoolStatusLabel"
          :material-preview-items="materialPreviewItems"
          :can-start-material-mock="canStartMaterialMock"
          :practice-compile-count="practiceCompileOptions.count"
          :practice-pool-plan-snapshot="practicePoolPlanSnapshot"
          :practice-pool-question-total="practicePoolQuestionTotal"
          :practice-preview-signature="practicePreviewSignature"
          :practice-group-shortfall-text="practiceGroupShortfallText"
          :practice-is-preparing="practiceIsPreparing"
          :practice-pool-status-label="practicePoolStatusLabel"
          :practice-pool-stale-text="practicePoolStaleText"
          :practice-preview-items="practicePreviewItems"
          :can-start-practice="canStartPractice"
          @back-library="handleReportBackToLibrary"
          @back-overview="openSceneContent('overview')"
          @clear-mock-answer="clearMockAnswer"
          @clear-mock-history="handleClearMockHistory"
          @open-mock-library="openSceneContent('library')"
          @open-mock-practice="openSceneContent('feedback')"
          @continue-mock="handleReportContinueMock"
          @continue-practice="handleReportContinuePractice"
          @open-history="handleReportOpenHistory"
          @open-library="handleOverviewSecondaryAction"
          @open-mock="openMockSceneFromLibrary"
          @open-practice="openSceneContent('feedback')"
          @open-report="handleOverviewReportAction"
          @open-workbench-report="handleReportOpenWorkbenchReport"
          @pick-files="pickLibraryFiles"
          @pick-folder="pickLibraryFolder"
          @primary-action="handleOverviewPrimaryAction"
          @resolve-content-lead="resolveContentLeadElement"
          @resolve-content-panel="resolveContentPanelElement"
          @resolve-content-section="resolveContentSectionElement"
          @select-document="setSelectedDocumentId($event)"
          @delete-document="handleDeleteLibraryDocument"
          @update-document-categories="handleUpdateLibraryDocumentCategories"
          @select-mock-question-thread="selectQuestionThread"
          @start-practice="handlePracticeStart"
          @next-mock-question="rotateMockFollowUp"
          @stop-mock-stream="handleMockStop"
          @submit-mock-answer="submitMockAnswer"
          @finish-mock-session="handleMockFinish"
          @update-mock-feedback-style="handleMockFeedbackStyleChange"
          @update-active-filter="libraryActiveFilter = $event"
          @update-library-page="libraryCurrentPage = $event"
          @update-material-compile-count="handleMaterialCompileCountChange"
          @update-material-order-mode="handleMaterialOrderModeChange"
          @update-material-topic-filter="handleMaterialTopicFilterChange"
          @prepare-material="handlePrepareMaterialQuestions"
          @start-material-mock="handleStartMaterialMockFromLibrary"
          @prepare-practice="handlePreparePracticeQuestions"
          @update-practice-compile-count="handlePracticeCompileCountChange"
          @update-mock-answer-draft="mockAnswerDraft = $event"
        />

        <SpaceReportPreviewModal
          v-model:show="isReportPreviewVisible"
          :has-summary="Boolean(reportSceneSummary)"
          :summary-headline="reportSummaryHeadline"
          :summary-body="reportSummaryBody"
          :header-meta="reportHeaderMeta"
          :focus-areas="reportFocusAreas"
          :weakness-tags="reportWeaknessTags"
          :answer-snapshot="reportAnswerSnapshot"
          :question-reviews="reportQuestionReviews"
          :suggestion-list="reportSuggestionList"
          :snapshot-items="reportSnapshotItems"
          @continue-practice="handleReportPreviewContinuePractice"
          @continue-mock="handleReportPreviewContinueMock"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.interview-space-showcase {
  --ease-orbit: cubic-bezier(0.2, 0.9, 0.22, 1);
  --ease-cinematic: cubic-bezier(0.18, 0.92, 0.2, 1);
  --ease-reform: cubic-bezier(0.16, 1, 0.24, 1);
  --scene-takeover-duration: 0.98s;
  --scene-flare-duration: 0.9s;
  --panel-collapse-duration: 0.9s;
  --panel-reform-duration: 1.08s;
  --scroll-sync-duration: 0.92s;
  --space-header-height: 59px;
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 100vh;
  height: 100%;
  color: #fff;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  /* 登录后仍可滚动，但不占位显示滚动条，避免内容区被挤窄 */
  scrollbar-width: none;
  -ms-overflow-style: none;
  transition: background var(--scene-takeover-duration) var(--ease-orbit);
  background-color: #071123;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  > .space-header {
    position: sticky;
    top: 0;
    z-index: 12;
    flex-shrink: 0;
  }
}

.showcase-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

.cosmos-gate-root {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 0;
}

.cosmos-gate-root.is-big-bang-active:not(.is-content-revealed) {
  .copy-column,
  .orbit-rail,
  .content-stack {
    opacity: 0;
    transform: translateY(20px) scale(0.97);
    pointer-events: none;
  }

  .scroll-capsule {
    opacity: 0;
    transform: translateY(calc(-50% + 20px)) scale(0.97);
    pointer-events: none;
  }
}

.cosmos-gate-root.is-content-revealed {
  .copy-column {
    animation: cosmos-content-reveal 0.72s var(--ease-orbit) forwards;
  }

  .orbit-rail {
    animation: cosmos-content-reveal 0.82s var(--ease-orbit) 0.08s forwards;
  }

  .content-stack {
    animation: cosmos-content-reveal 0.88s var(--ease-orbit) 0.14s forwards;
  }
}

.cosmos-gate-root.is-content-revealed:not(.is-scroll-capsule-reveal-settled) .scroll-capsule {
  animation: cosmos-scroll-capsule-reveal 0.62s var(--ease-orbit) 0.2s both;
}

.cosmos-gate-root.is-scroll-capsule-reveal-settled .scroll-capsule {
  animation: none;
}

@keyframes cosmos-content-reveal {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.97);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes cosmos-scroll-capsule-reveal {
  from {
    opacity: 0;
    transform: translateY(calc(-50% + 20px)) scale(0.97);
  }

  to {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}

.interview-space-showcase.is-auto-scrolling {
  scroll-behavior: auto;
}

.interview-space-showcase.is-user-scrolling {
  --scroll-performance-mode: 1;
}

.hero-stage {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(320px, 520px) 1fr;
  gap: 20px;
  min-height: calc(100vh - 92px);
  padding: 10px 34px 240px;
}

.copy-column {
  position: relative;
  padding-top: 12px;
  min-height: 420px;
}

.copy-inner {
  position: absolute;
  inset: 0 auto auto 0;
  width: min(520px, 100%);
}

.copy-column h1 {
  display: flex;
  align-items: flex-start;
  min-height: calc(2 * 0.98em);
  max-width: 10ch;
  margin: 0;
  font-size: clamp(39px, 4.5vw, 68px);
  line-height: 0.98;
  font-weight: 600;
}

.summary {
  max-width: 520px;
  margin-top: 22px;
  color: rgb(250 250 255 / 0.9);
  font-size: 18px;
  line-height: 1.6;
  font-weight: 400;
}

.bullet-list {
  display: grid;
  gap: 10px;
  margin-top: 22px;
  padding-left: 20px;
}

.bullet-list li {
  color: rgb(251 252 255 / 0.92);
  font-size: 16px;
  line-height: 1.4;
}

.scene-copy-enter-active {
  transition:
    opacity 0.42s var(--ease-orbit),
    transform 0.42s var(--ease-orbit),
    filter 0.42s var(--ease-orbit);
}

.scene-copy-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease,
    filter 0.24s ease;
}

.scene-copy-enter-from,
.scene-copy-leave-to {
  opacity: 0;
  filter: blur(5px);
  transform: translateY(10px);
}

@media (max-width: 1100px) {
  .hero-stage {
    grid-template-columns: 1fr;
    padding-bottom: 320px;
  }

}

@media (max-width: 780px) {
  .hero-stage {
    padding-left: 18px;
    padding-right: 18px;
  }

  .copy-column h1 {
    font-size: clamp(46px, 15vw, 74px);
  }

}
</style>



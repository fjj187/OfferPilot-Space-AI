<script lang="tsx" setup>
import type { CSSProperties } from 'vue'
import type { PersistedMockSessionConfig, PersistedPracticePlan } from '@/types/workbench'
import SpaceContentPanel from '@/components/showcase/mock-interview-space/SpaceContentPanel.vue'
import SpaceHeader from '@/components/showcase/mock-interview-space/SpaceHeader.vue'
import SpaceOrbitNav from '@/components/showcase/mock-interview-space/SpaceOrbitNav.vue'
import SpaceReportPreviewModal from '@/components/showcase/mock-interview-space/SpaceReportPreviewModal.vue'
import SpaceScrollCapsule from '@/components/showcase/mock-interview-space/SpaceScrollCapsule.vue'
import SpaceVisualStage from '@/components/showcase/mock-interview-space/SpaceVisualStage.vue'
import { scenes } from '@/constants/showcase/mockInterviewSpaceScenes'
import { useInterviewStream } from '@/composables/useInterviewStream'
import { useLibraryWorkspaceState } from '@/composables/useLibraryWorkspaceState'
import { useMockInterviewFlow } from '@/composables/showcase/useMockInterviewFlow'
import { useMockInterviewSpaceMockState } from '@/composables/showcase/useMockInterviewSpaceMockState'
import { useMockInterviewSpaceOrbit } from '@/composables/showcase/useMockInterviewSpaceOrbit'
import { useMockInterviewSpaceReportScene } from '@/composables/showcase/useMockInterviewSpaceReportScene'
import { useMockInterviewSpaceScroll } from '@/composables/showcase/useMockInterviewSpaceScroll'
import { useOverviewLaunchState } from '@/composables/useOverviewLaunchState'
import { useWorkbenchPersistence } from '@/composables/useWorkbenchPersistence'
import { interviewTopics } from '@/views/workbench/mock-interview.data'

interface OrbitSlot {
  left: number
  top: number
  visible: boolean
}

const {
  messages: mockMessages,
  isStreaming: isMockStreaming,
  streamError: mockStreamError,
  streamMode: mockStreamMode,
  streamModeLabel: mockStreamModeLabel,
  scrollVersion: mockScrollVersion,
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
} = useOverviewLaunchState()

const {
  loadWorkbenchContext,
  getReportSummaryBySessionId,
  loadReportSummaries,
  saveWorkbenchContext
} = useWorkbenchPersistence()
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
  handleFileChange: handleLibraryFileChange
} = useLibraryWorkspaceState({
  preferredTopic: activeTopic,
  preferredSource: currentSourceKey
})

const currentTrainingDocument = computed(() => selectedDocument.value || activeDocument.value)
const currentContextDocument = computed(() => {
  const activeDocumentId = currentWorkbenchContext.value?.activeDocumentId || ''
  if (!activeDocumentId) return null
  return libraryDocumentList.value.find(item => item.id === activeDocumentId) || null
})

const {
  currentGuide,
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
  mockPanelMeta,
  questionThreads: mockQuestionThreads,
  activeQuestionThread,
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
  submitMockAnswer
} = useMockInterviewSpaceMockState({
  isStreaming: isMockStreaming,
  activeDocument: currentContextDocument,
  messages: mockMessages,
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

const activeInterviewDocumentMeta = computed(() => {
  const document = currentContextDocument.value
  if (!document) return []
  return [
    `资料: ${ document.name }`,
    `类型: ${ document.type.toUpperCase() }`,
    `主题: ${ currentTopicLabel.value }`
  ]
})

const mockQuestionPrompt = computed(() => isMockAwaitingSetup.value ? '' : (activeQuestionThread.value?.prompt || primaryQuestion.value?.prompt || ''))
const mockHintText = computed(() => isMockAwaitingSetup.value ? '' : (primaryQuestion.value?.hint || currentGuide.value?.desc || ''))
const handleMockFinish = () => {
  if (!finishAndOpenReport()) return
  requestSceneChange(findSceneIndexById('report'), {
    pauseAutoplay: true,
    scrollToContent: true
  })
}
const handleMockOpenHistory = () => {
  if (openLatestHistory()) return
  window.$ModalMessage?.warning?.('当前无对话历史', {
    duration: 2200,
    closable: false
  })
}
const handleClearMockHistory = () => {
  clearAllMockHistory()
}
const {
  reportAnswerSnapshot,
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
  getReportSummaryBySessionId,
  loadReportSummaries
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

const router = useRouter()
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
const mockSceneResetVersion = ref(0)

let scrollCapsuleRevealTimer: ReturnType<typeof setTimeout> | null = null

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
  const blurActive = fade < 0.02
  return {
    opacity: String(1 - fade),
    transform: `translateY(${ fade * -14 }px)`,
    pointerEvents: fade > 0.98 ? 'none' : 'auto',
    backdropFilter: blurActive ? 'blur(14px)' : 'none',
    WebkitBackdropFilter: blurActive ? 'blur(14px)' : 'none',
    '--header-mask-opacity': String(1 - fade),
    '--header-border-opacity': String(0.08 * (1 - fade)),
    '--header-bg-opacity': String(Math.max(0, 0.92 - fade * 0.92))
  } as CSSProperties
})

const syncVisualLayers = (immediate = false) => {
  visualStageRef.value?.syncVisualLayers(immediate)
}

const clearTransitionTimers = () => {
  clearScrollTimers()
  clearOrbitTimers()
  if (scrollCapsuleRevealTimer) {
    window.clearTimeout(scrollCapsuleRevealTimer)
    scrollCapsuleRevealTimer = null
  }
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

const handleBack = () => {
  router.push({
    name: 'WorkbenchMockInterview'
  })
}

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

const buildDirectMockSessionConfig = (): PersistedMockSessionConfig => ({
  entryMode: 'direct',
  activeDocumentId: currentTrainingDocument.value?.id || ''
})

const buildPracticeMockSessionConfig = (plan: PersistedPracticePlan): PersistedMockSessionConfig => ({
  entryMode: 'practice',
  activeDocumentId: currentTrainingDocument.value?.id || '',
  zone: plan.zone,
  questionType: plan.questionType,
  questionCount: plan.questionCount,
  difficulty: plan.difficulty
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
          activeDocumentId: restoredDocumentId
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
  startMockRound({
    activeDocumentId: currentTrainingDocument.value?.id || currentWorkbenchContext.value?.activeDocumentId || '',
    activeTopic: practiceTopicByZone[plan.zone] || activeTopic.value,
    currentMode: 'standard',
    mockEntryMode: 'practice',
    practicePlan: plan,
    mockSessionConfig: buildPracticeMockSessionConfig(plan),
    sourcePage: 'mock-interview-space'
  })
  requestSceneChange(findSceneIndexById('mock'), {
    pauseAutoplay: true,
    scrollToContent: true
  })
}

const handleReportContinuePractice = () => {
  const summaryPlan = reportSceneSummary.value?.practicePlan
  if (summaryPlan) {
    handlePracticeStart(summaryPlan)
    return
  }
  openSceneContent('feedback')
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

onMounted(() => {
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
    refreshScrollMetrics()
    syncVisualLayers(true)
    releaseScrollCapsuleReveal()
    scrollCapsuleHideLock.value = false
    isScrollCapsuleVisible.value = true
    updateScrollCapsuleVisibility()
  })
  if (!shouldRestoreContentScene) {
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
    :class="{ 'is-auto-scrolling': isAutoScrolling, 'is-fast-orbit-transition': isFastOrbitTransition, 'is-user-scrolling': isUserScrolling }"
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
      @back="handleBack"
      @resolve-element="resolveHeaderElement"
    />

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
      :library-derived-stats="libraryDerivedStats"
      :library-filter-tabs="libraryFilterTabs"
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
      :mock-messages="displayMessages"
      :mock-panel-meta="mockPanelMeta"
      :mock-question-threads="mockQuestionThreads"
      :mock-active-question-thread-id="activeQuestionThreadId"
      :mock-practice-plan="currentPracticePlan"
      :mock-has-next-question="hasNextMockFollowUp"
      :mock-has-recent-history="hasRestorableHistoryPreview"
      :mock-is-awaiting-setup="isMockAwaitingSetup"
      :mock-session-status-text="mockSessionStatusText"
      :mock-answered-count="mockAnsweredCount"
      :mock-current-question-position="mockCurrentQuestionPosition"
      :mock-total-count="mockTotalCount"
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
      :report-header-meta="reportHeaderMeta"
      :report-answer-snapshot="reportAnswerSnapshot"
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
      @select-mock-question-thread="selectQuestionThread"
      @start-practice="handlePracticeStart"
      @next-mock-question="rotateMockFollowUp"
      @stop-mock-stream="handleMockStop"
      @submit-mock-answer="submitMockAnswer"
      @finish-mock-session="handleMockFinish"
      @update-active-filter="libraryActiveFilter = $event"
      @update-library-page="libraryCurrentPage = $event"
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
      :suggestion-list="reportSuggestionList"
      :snapshot-items="reportSnapshotItems"
      @continue-practice="handleReportPreviewContinuePractice"
      @continue-mock="handleReportPreviewContinueMock"
    />
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
  position: relative;
  flex: 1;
  min-height: 0;
  height: 100%;
  color: #fff;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  transition: background var(--scene-takeover-duration) var(--ease-orbit);
  background-color: #071123;
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



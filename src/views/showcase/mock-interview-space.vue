<script lang="tsx" setup>
import type { CSSProperties } from 'vue'
import SpaceContentPanel from '@/components/showcase/mock-interview-space/SpaceContentPanel.vue'
import SpaceHeader from '@/components/showcase/mock-interview-space/SpaceHeader.vue'
import SpaceOrbitNav from '@/components/showcase/mock-interview-space/SpaceOrbitNav.vue'
import SpaceScrollCapsule from '@/components/showcase/mock-interview-space/SpaceScrollCapsule.vue'
import SpaceVisualStage from '@/components/showcase/mock-interview-space/SpaceVisualStage.vue'
import { scenes } from '@/constants/showcase/mockInterviewSpaceScenes'
import { useInterviewStream } from '@/composables/useInterviewStream'
import { useLibraryWorkspaceState } from '@/composables/useLibraryWorkspaceState'
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
  scrollVersion: mockScrollVersion,
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
  primaryActionLabel: overviewPrimaryActionLabel,
  reportQuery
} = useOverviewLaunchState()

const {
  getReportSummaryBySessionId,
  loadReportSummaries
} = useWorkbenchPersistence()

const {
  refFileInput,
  refFolderInput,
  filterTabs: libraryFilterTabs,
  sourceLabelMap: librarySourceLabelMap,
  topicLabelMap: libraryTopicLabelMap,
  activeFilter: libraryActiveFilter,
  filteredDocuments,
  selectedDocumentId,
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

const {
  currentGuide,
  answeredCount: mockAnsweredCount,
  mockAnswerDraft,
  mockSessionStatusText,
  totalCount: mockTotalCount,
  mockPanelMeta,
  primaryQuestion,
  clearMockAnswer,
  finishMockSession,
  isMockCurrentSubmitted,
  submitMockAnswer
} = useMockInterviewSpaceMockState({
  isStreaming: isMockStreaming,
  activeDocument: currentTrainingDocument,
  appendUserMessage,
  appendSystemMessage,
  startStream: startMockStream,
  clearMessages: clearMockMessages
})

const displayedLibraryDocuments = ref([...filteredDocuments.value])
const isLibraryListVisible = ref(true)
let libraryListTransitionTimer: ReturnType<typeof setTimeout> | null = null

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
  const shouldAnimate = Boolean(previousList)
  syncDisplayedLibraryDocuments(nextList, shouldAnimate)
}, {
  immediate: true,
  deep: true
})

const activeInterviewDocumentMeta = computed(() => {
  const document = currentTrainingDocument.value
  if (!document) return []
  return [
    `资料: ${ document.name }`,
    `类型: ${ document.type.toUpperCase() }`,
    `主题: ${ currentTopicLabel.value }`
  ]
})

const mockQuestionPrompt = computed(() => primaryQuestion.value?.prompt || '')
const mockHintText = computed(() => primaryQuestion.value?.hint || currentGuide.value?.desc || '')
const handleMockFinish = () => {
  const summary = finishMockSession()
  if (!summary) return
  openSceneContent('report')
}
const {
  reportHeaderMeta,
  reportLatestHistory,
  reportOverviewStats,
  reportPrimaryWeakness,
  reportSceneSummary,
  reportSnapshotItems,
  reportSuggestionList,
  reportWeaknessTags
} = useMockInterviewSpaceReportScene({
  activeDocument: currentTrainingDocument,
  currentModeLabel,
  currentSourceLabel,
  currentTopicLabel,
  inProgressSession,
  latestCompletedSession,
  latestReportSummary,
  getReportSummaryBySessionId,
  loadReportSummaries
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
const isScrollCapsuleVisible = ref(true)
const scrollCapsuleHideLock = ref(false)
const forceScrollCapsuleVisible = ref(false)

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

const openSceneContent = (sceneId: string) => {
  requestSceneChange(findSceneIndexById(sceneId), {
    pauseAutoplay: true,
    scrollToContent: true
  })
}

const handleOverviewPrimaryAction = () => {
  openSceneContent('mock')
}

const handleOverviewSecondaryAction = () => {
  openSceneContent('library')
}

const handleOverviewReportAction = () => {
  openSceneContent('report')
}

const handleReportContinueMock = () => {
  openSceneContent('mock')
}

const handleReportBackToLibrary = () => {
  openSceneContent('library')
}

const handleReportOpenHistory = () => {
  router.push({
    name: 'WorkbenchHistory'
  })
}

const handleReportOpenWorkbenchReport = () => {
  router.push({
    name: 'WorkbenchReport',
    query: reportQuery.value
  })
}

const handleOrbitSceneSelect = (index: number) => {
  revealScrollCapsule()
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
  nextTick(() => {
    refreshScrollMetrics()
    syncVisualLayers(true)
    updateScrollCapsuleVisibility()
  })
  startAutoplay()
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
      :active-document="currentTrainingDocument"
      :active-interview-document-meta="activeInterviewDocumentMeta"
      :current-topic-label="currentTopicLabel"
      :display-scene="displayScene"
      :displayed-library-documents="displayedLibraryDocuments"
      :format-library-bytes="formatLibraryBytes"
      :import-feedback-text="importFeedbackText"
      :is-library-list-visible="isLibraryListVisible"
      :is-mock-current-submitted="isMockCurrentSubmitted"
      :is-mock-streaming="isMockStreaming"
      :library-active-filter="libraryActiveFilter"
      :library-derived-stats="libraryDerivedStats"
      :library-filter-tabs="libraryFilterTabs"
      :library-next-step-desc="libraryNextStepDesc"
      :library-next-step-title="libraryNextStepTitle"
      :library-source-label-map="librarySourceLabelMap"
      :library-topic-label-map="libraryTopicLabelMap"
      :library-workspace-desc="libraryWorkspaceDesc"
      :library-workspace-title="libraryWorkspaceTitle"
      :mock-answer-draft="mockAnswerDraft"
      :mock-hint-text="mockHintText"
      :mock-messages="mockMessages"
      :mock-panel-meta="mockPanelMeta"
      :mock-session-status-text="mockSessionStatusText"
      :mock-answered-count="mockAnsweredCount"
      :mock-total-count="mockTotalCount"
      :mock-question-prompt="mockQuestionPrompt"
      :mock-scroll-version="mockScrollVersion"
      :mock-stream-error="mockStreamError"
      :overview-primary-action-label="overviewPrimaryActionLabel"
      :overview-progress-percent="overviewProgressPercent"
      :overview-status-label="overviewStatusLabel"
      :overview-summary-items="overviewSummaryItems"
      :report-header-meta="reportHeaderMeta"
      :report-latest-history="reportLatestHistory"
      :report-overview-stats="reportOverviewStats"
      :report-primary-weakness="reportPrimaryWeakness"
      :report-scene-summary="reportSceneSummary"
      :report-snapshot-items="reportSnapshotItems"
      :report-suggestion-list="reportSuggestionList"
      :report-weakness-tags="reportWeaknessTags"
      :selected-document="selectedDocument"
      :selected-document-id="selectedDocumentId"
      :show-import-feedback="showImportFeedback"
      :topic-label-map="topicLabelMap"
      @back-library="handleReportBackToLibrary"
      @back-overview="openSceneContent('overview')"
      @clear-mock-answer="clearMockAnswer"
      @continue-mock="handleReportContinueMock"
      @open-history="handleReportOpenHistory"
      @open-library="handleOverviewSecondaryAction"
      @open-report="handleOverviewReportAction"
      @open-workbench-report="handleReportOpenWorkbenchReport"
      @pick-files="pickLibraryFiles"
      @pick-folder="pickLibraryFolder"
      @primary-action="handleOverviewPrimaryAction"
      @resolve-content-lead="resolveContentLeadElement"
      @resolve-content-panel="resolveContentPanelElement"
      @resolve-content-section="resolveContentSectionElement"
      @select-document="selectedDocumentId = $event"
      @stop-mock-stream="stopMockStream"
      @submit-mock-answer="submitMockAnswer"
      @finish-mock-session="handleMockFinish"
      @update-active-filter="libraryActiveFilter = $event"
      @update-mock-answer-draft="mockAnswerDraft = $event"
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



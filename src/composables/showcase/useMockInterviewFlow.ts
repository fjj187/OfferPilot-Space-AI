import { computed, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type {
  PersistedInterviewMode,
  PersistedMockEntryMode,
  PersistedMockSessionConfig,
  PersistedPracticePlan,
  PersistedTopicKey,
  PersistedWorkbenchContext
} from '@/types/workbench'
import type {
  FinishMockRoundResult,
  MockInterviewReplayConfig
} from '@/composables/showcase/useMockInterviewSpaceMockState'

export type MockInterviewFlowMode = 'idle' | 'mock' | 'report' | 'history_preview'

export interface MockInterviewFlowSnapshot {
  sessionId: string
  summaryId: string
}

export interface StartMockRoundPayload {
  activeDocumentId: string
  activeTopic: PersistedTopicKey
  currentMode: PersistedInterviewMode
  mockEntryMode: PersistedMockEntryMode
  practicePlan: PersistedPracticePlan | null
  mockSessionConfig: PersistedMockSessionConfig | null
  sourcePage?: string
}

interface UseMockInterviewFlowOptions {
  activeSessionId: Ref<string>
  currentContext: ComputedRef<PersistedWorkbenchContext | null>
  currentMockSessionConfig: ComputedRef<PersistedMockSessionConfig | null>
  currentPracticePlan: ComputedRef<PersistedPracticePlan | null>
  currentTopic: Ref<PersistedTopicKey>
  currentMode: Ref<PersistedInterviewMode>
  exitHistoryPreview: () => void
  finalizeFinishedMockSession: () => void
  finishMockRound: () => FinishMockRoundResult | null
  hasMockSetup: ComputedRef<boolean>
  hasRestorableHistory: ComputedRef<boolean>
  openLatestHistoryPreview: () => boolean
  previewSessionId: Ref<string>
  saveWorkbenchContext: (payload: Omit<PersistedWorkbenchContext, 'updatedAt'>) => PersistedWorkbenchContext
  clearAllMockHistoryState: () => void
}

const resolveFlowModeByContext = (context: PersistedWorkbenchContext | null): MockInterviewFlowMode => {
  if (context?.sourcePage === 'report') return 'report'
  if (context?.sourcePage === 'mock-interview-space' || context?.sourcePage === 'practice') return 'mock'
  return 'idle'
}

export function useMockInterviewFlow(options: UseMockInterviewFlowOptions) {
  const flowMode = ref<MockInterviewFlowMode>(resolveFlowModeByContext(options.currentContext.value))
  const lastReplayConfig = ref<MockInterviewReplayConfig | null>(null)
  const currentRoundSnapshot = ref<MockInterviewFlowSnapshot | null>(null)

  const syncReplayConfigFromContext = () => {
    const context = options.currentContext.value
    const config = options.currentMockSessionConfig.value
    if (!config) return
    lastReplayConfig.value = {
      topic: context?.activeTopic || options.currentTopic.value,
      mode: context?.currentMode || options.currentMode.value,
      entryMode: config.entryMode,
      activeDocumentId: context?.activeDocumentId || config.activeDocumentId || '',
      feedbackStyle: config.feedbackStyle,
      zone: config.zone,
      questionType: config.questionType,
      questionCount: config.questionCount,
      difficulty: config.difficulty,
      practicePlan: options.currentPracticePlan.value
    }
  }

  const startMockRound = (payload: StartMockRoundPayload) => {
    options.exitHistoryPreview()
    options.saveWorkbenchContext({
      activeTopic: payload.activeTopic,
      activeDocumentId: payload.activeDocumentId,
      currentMode: payload.currentMode,
      sourcePage: payload.sourcePage || 'mock-interview-space',
      practicePlan: payload.practicePlan,
      mockEntryMode: payload.mockEntryMode,
      mockSessionConfig: payload.mockSessionConfig
    })
    flowMode.value = 'mock'
    if (payload.mockSessionConfig) {
      lastReplayConfig.value = {
        topic: payload.activeTopic,
        mode: payload.currentMode,
        ...payload.mockSessionConfig,
        practicePlan: payload.practicePlan
      }
    }
  }

  const finishAndOpenReport = () => {
    const result = options.finishMockRound()
    if (!result) return null
    lastReplayConfig.value = result.replayConfig
    currentRoundSnapshot.value = {
      sessionId: result.sessionId,
      summaryId: result.summary.id
    }
    options.saveWorkbenchContext({
      activeTopic: result.replayConfig.topic,
      activeDocumentId: result.replayConfig.activeDocumentId || '',
      currentMode: result.replayConfig.mode,
      sourcePage: 'report',
      practicePlan: result.summary.practicePlan || result.replayConfig.practicePlan || null,
      mockEntryMode: result.replayConfig.entryMode,
      mockSessionConfig: {
        entryMode: result.replayConfig.entryMode,
        activeDocumentId: result.replayConfig.activeDocumentId,
        feedbackStyle: result.replayConfig.feedbackStyle,
        zone: result.replayConfig.zone,
        questionType: result.replayConfig.questionType,
        questionCount: result.replayConfig.questionCount,
        difficulty: result.replayConfig.difficulty
      }
    })
    flowMode.value = 'report'
    options.finalizeFinishedMockSession()
    return result
  }

  const restartLastMockRound = () => {
    if (!lastReplayConfig.value) return false
    startMockRound({
      activeDocumentId: lastReplayConfig.value.activeDocumentId || '',
      activeTopic: lastReplayConfig.value.topic,
      currentMode: lastReplayConfig.value.mode,
      mockEntryMode: lastReplayConfig.value.entryMode,
      practicePlan: lastReplayConfig.value.practicePlan,
      mockSessionConfig: {
        entryMode: lastReplayConfig.value.entryMode,
        activeDocumentId: lastReplayConfig.value.activeDocumentId,
        feedbackStyle: lastReplayConfig.value.feedbackStyle,
        zone: lastReplayConfig.value.zone,
        questionType: lastReplayConfig.value.questionType,
        questionCount: lastReplayConfig.value.questionCount,
        difficulty: lastReplayConfig.value.difficulty
      },
      sourcePage: 'mock-interview-space'
    })
    return true
  }

  const openLatestHistory = () => {
    const opened = options.openLatestHistoryPreview()
    if (!opened) return false
    flowMode.value = 'history_preview'
    return true
  }

  const exitHistory = () => {
    options.exitHistoryPreview()
    flowMode.value = options.hasMockSetup.value ? 'mock' : 'idle'
  }

  const clearAllMockHistory = () => {
    options.clearAllMockHistoryState()
    currentRoundSnapshot.value = null
    lastReplayConfig.value = options.hasMockSetup.value ? lastReplayConfig.value : null
    flowMode.value = options.hasMockSetup.value ? 'mock' : 'idle'
  }

  watch(
    () => options.currentContext.value?.updatedAt,
    () => {
      if (!lastReplayConfig.value) {
        syncReplayConfigFromContext()
      }
      if (options.previewSessionId.value) {
        flowMode.value = 'history_preview'
        return
      }
      if (options.currentContext.value?.sourcePage === 'report') {
        flowMode.value = 'report'
        return
      }
      if (options.activeSessionId.value || options.hasMockSetup.value) {
        flowMode.value = 'mock'
        return
      }
      flowMode.value = resolveFlowModeByContext(options.currentContext.value)
    },
    {
      immediate: true
    }
  )

  watch(
    () => options.previewSessionId.value,
    (sessionId) => {
      if (sessionId) {
        flowMode.value = 'history_preview'
        return
      }
      if (flowMode.value === 'history_preview') {
        flowMode.value = options.hasMockSetup.value ? 'mock' : 'idle'
      }
    }
  )

  return {
    activeSessionId: computed(() => options.activeSessionId.value),
    currentRoundSnapshot,
    flowMode,
    hasRestorableHistory: computed(() => options.hasRestorableHistory.value),
    lastReplayConfig,
    clearAllMockHistory,
    exitHistory,
    finishAndOpenReport,
    openLatestHistory,
    restartLastMockRound,
    startMockRound
  }
}

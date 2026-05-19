import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import type { InterviewMessage } from '@/types/message'
import type {
  PersistedInterviewSession,
  PersistedLibraryDocument,
  PersistedReportSummary,
  PersistedWorkbenchContext
} from '@/types/workbench'
import { useMockInterviewSpaceMockState } from '@/composables/showcase/useMockInterviewSpaceMockState'

type MockStore = {
  workbenchContext: PersistedWorkbenchContext | null
  interviewSessions: PersistedInterviewSession[]
  reportSummaries: PersistedReportSummary[]
  libraryDocuments: PersistedLibraryDocument[]
}

const mockStore: MockStore = {
  workbenchContext: null,
  interviewSessions: [],
  reportSummaries: [],
  libraryDocuments: []
}

vi.mock('@/utils/storage/workbench-storage', () => ({
  WORKBENCH_STORAGE_KEYS: {
    libraryDocuments: 'offerpilot.library.documents',
    workbenchContext: 'offerpilot.workbench.context',
    interviewSessions: 'offerpilot.interview.sessions',
    reportSummaries: 'offerpilot.report.summaries'
  },
  getPersistedLibraryDocuments: () => mockStore.libraryDocuments,
  setPersistedLibraryDocuments: (documents: PersistedLibraryDocument[]) => {
    mockStore.libraryDocuments = documents
  },
  getPersistedWorkbenchContext: () => mockStore.workbenchContext,
  setPersistedWorkbenchContext: (context: PersistedWorkbenchContext) => {
    mockStore.workbenchContext = context
  },
  removePersistedWorkbenchContext: () => {
    mockStore.workbenchContext = null
  },
  getPersistedInterviewSessions: () => mockStore.interviewSessions,
  setPersistedInterviewSessions: (sessions: PersistedInterviewSession[]) => {
    mockStore.interviewSessions = sessions
  },
  getPersistedReportSummaries: () => mockStore.reportSummaries,
  setPersistedReportSummaries: (summaries: PersistedReportSummary[]) => {
    mockStore.reportSummaries = summaries
  },
  clearWorkbenchStorage: () => {
    mockStore.workbenchContext = null
    mockStore.interviewSessions = []
    mockStore.reportSummaries = []
    mockStore.libraryDocuments = []
  }
}))

const createDocument = (): PersistedLibraryDocument => ({
  id: 'doc-vue-composable',
  name: 'Vue composable 设计.md',
  type: 'md',
  size: 1024,
  importedAt: '2026-05-19T00:00:00.000Z',
  status: 'parsed',
  topicKeys: ['vue3'],
  sourceKey: 'library',
  tags: ['composable', '状态管理'],
  summary: '围绕 composable 状态拆分与副作用管理的资料。',
  rawText: '第一段资料正文，介绍 composable 的输入输出、内部状态和生命周期清理。'
})

describe('useMockInterviewSpaceMockState', () => {
  beforeEach(() => {
    mockStore.workbenchContext = {
      activeTopic: 'vue3',
      activeDocumentId: 'doc-vue-composable',
      currentMode: 'standard',
      sourcePage: 'mock-interview-space',
      practicePlan: null,
      mockEntryMode: 'direct',
      mockSessionConfig: {
        entryMode: 'direct',
        activeDocumentId: 'doc-vue-composable',
        feedbackStyle: 'corrective'
      },
      updatedAt: '2026-05-19T00:00:00.000Z'
    }
    mockStore.interviewSessions = []
    mockStore.reportSummaries = []
    mockStore.libraryDocuments = []
  })

  it('keeps the active thread and in-progress session when feedback style changes', async () => {
    const isStreaming = ref(false)
    const activeDocument = ref<PersistedLibraryDocument | null>(createDocument())
    const messages = ref<InterviewMessage[]>([])
    const setActiveThreadId = vi.fn()

    const state = useMockInterviewSpaceMockState({
      isStreaming,
      activeDocument,
      messages,
      setActiveThreadId,
      appendUserMessage: (content, threadId) => {
        messages.value = [
          ...messages.value,
          {
            id: `user-${ messages.value.length }`,
            role: 'user',
            format: 'plain',
            status: 'done',
            content,
            displayContent: content,
            threadId: threadId || '',
            createdAt: '2026-05-19T00:00:00.000Z'
          }
        ]
      },
      appendSystemMessage: (content, format = 'plain', threadId) => {
        messages.value = [
          ...messages.value,
          {
            id: `system-${ messages.value.length }`,
            role: 'system',
            format,
            status: 'done',
            content,
            displayContent: content,
            threadId: threadId || '',
            createdAt: '2026-05-19T00:00:00.000Z'
          }
        ]
      },
      startStream: vi.fn(),
      clearMessages: () => {
        messages.value = []
      }
    })

    await nextTick()

    expect(state.currentSessionId.value).toBeTruthy()
    expect(state.questionThreads.value).toHaveLength(1)

    const initialSessionId = state.currentSessionId.value
    const initialThreadId = state.activeQuestionThreadId.value

    state.rotateMockFollowUp()
    await nextTick()

    expect(state.questionThreads.value).toHaveLength(2)
    expect(state.activeQuestionThreadId.value).not.toBe(initialThreadId)

    const threadIdBeforeStyleChange = state.activeQuestionThreadId.value
    const threadCountBeforeStyleChange = state.questionThreads.value.length

    state.updateFeedbackStyle('guided')
    await nextTick()

    expect(state.currentFeedbackStyle.value).toBe('guided')
    expect(state.currentSessionId.value).toBe(initialSessionId)
    expect(state.activeQuestionThreadId.value).toBe(threadIdBeforeStyleChange)
    expect(state.questionThreads.value).toHaveLength(threadCountBeforeStyleChange)
    expect(mockStore.interviewSessions).toHaveLength(1)
    expect(mockStore.interviewSessions[0]?.id).toBe(initialSessionId)
    expect(mockStore.workbenchContext?.mockSessionConfig?.feedbackStyle).toBe('guided')
  })
})

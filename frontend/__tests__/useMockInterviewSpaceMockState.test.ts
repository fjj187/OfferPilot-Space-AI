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

vi.mock('@/services/interview/interview-report-api', () => ({
  isInterviewReportApiAvailable: () => false,
  generateRemoteInterviewReport: vi.fn()
}))

vi.mock('@/services/interview/interview-session-api', () => ({
  clearRemoteInterviewHistory: vi.fn(async () => true)
}))

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

  it('advances to the next sequential question instead of jumping to the first unanswered one', async () => {
    const isStreaming = ref(false)
    const activeDocument = ref<PersistedLibraryDocument | null>(createDocument())
    const messages = ref<InterviewMessage[]>([])
    const setActiveThreadId = vi.fn()

    mockStore.workbenchContext = {
      activeTopic: 'vue3',
      activeDocumentId: 'doc-vue-composable',
      currentMode: 'standard',
      sourcePage: 'mock-interview-space',
      practicePlan: null,
      mockEntryMode: 'material',
      mockSessionConfig: {
        entryMode: 'material',
        activeDocumentId: 'doc-vue-composable',
        feedbackStyle: 'corrective'
      },
      practiceQuestionGroup: {
        id: 'material-group-1',
        source: 'material_document',
        items: Array.from({ length: 5 }, (_, index) => ({
          questionId: `material-q-${ index }`,
          order: index,
          title: `资料题 ${ index + 1 }`,
          prompt: `资料题 ${ index + 1 } 的内容？`,
          matchReason: 'tag_match'
        })),
        currentIndex: 4,
        status: 'in_progress',
        createdAt: '2026-05-19T00:00:00.000Z',
        updatedAt: '2026-05-19T00:00:00.000Z'
      },
      updatedAt: '2026-05-19T00:00:00.000Z'
    }

    const state = useMockInterviewSpaceMockState({
      isStreaming,
      activeDocument,
      messages,
      setActiveThreadId,
      appendUserMessage: vi.fn(),
      appendSystemMessage: vi.fn(),
      startStream: vi.fn(),
      clearMessages: vi.fn()
    })

    await nextTick()

    expect(state.allQuestionThreads.value).toHaveLength(5)
    expect(state.generatedThreadCount.value).toBe(5)

    const fourthThread = state.allQuestionThreads.value[3]
    state.selectQuestionThread(fourthThread.id)
    await nextTick()

    expect(state.activeQuestionThread.value?.sequence).toBe(4)

    state.rotateMockFollowUp()
    await nextTick()

    expect(state.activeQuestionThread.value?.sequence).toBe(5)
    expect(state.activeQuestionThread.value?.id).toBe(state.allQuestionThreads.value[4]?.id)
  })

  it('persists questionReviews when finishing a material practice round', async () => {
    const isStreaming = ref(false)
    const activeDocument = ref<PersistedLibraryDocument | null>(createDocument())
    const messages = ref<InterviewMessage[]>([])
    const setActiveThreadId = vi.fn()

    mockStore.workbenchContext = {
      activeTopic: 'vue3',
      activeDocumentId: 'doc-vue-composable',
      currentMode: 'standard',
      sourcePage: 'mock-interview-space',
      practicePlan: null,
      mockEntryMode: 'material',
      mockSessionConfig: {
        entryMode: 'material',
        activeDocumentId: 'doc-vue-composable',
        feedbackStyle: 'corrective'
      },
      practiceQuestionGroup: {
        id: 'material-group-review',
        source: 'material_document',
        items: [
          {
            questionId: 'material-q-0',
            order: 0,
            title: '资料题 1',
            prompt: '资料题 1 的内容？',
            matchReason: 'tag_match',
            referenceAnswer: '资料解析一'
          },
          {
            questionId: 'material-q-1',
            order: 1,
            title: '资料题 2',
            prompt: '资料题 2 的内容？',
            matchReason: 'tag_match',
            referenceAnswer: '资料解析二'
          }
        ],
        currentIndex: 1,
        status: 'in_progress',
        createdAt: '2026-05-19T00:00:00.000Z',
        updatedAt: '2026-05-19T00:00:00.000Z'
      },
      updatedAt: '2026-05-19T00:00:00.000Z'
    }

    const state = useMockInterviewSpaceMockState({
      isStreaming,
      activeDocument,
      messages,
      setActiveThreadId,
      appendUserMessage: vi.fn(),
      appendSystemMessage: vi.fn(),
      startStream: vi.fn(),
      clearMessages: vi.fn()
    })

    await nextTick()

    const threads = state.questionThreads.value
    expect(threads).toHaveLength(2)

    messages.value = [
      {
        id: 'user-1',
        role: 'user',
        format: 'plain',
        status: 'done',
        content: '我的回答一',
        displayContent: '我的回答一',
        threadId: threads[0]!.id,
        createdAt: '2026-05-19T00:00:00.000Z'
      },
      {
        id: 'assistant-1',
        role: 'assistant',
        format: 'plain',
        status: 'done',
        content: '反馈一',
        displayContent: '反馈一',
        threadId: threads[0]!.id,
        createdAt: '2026-05-19T00:00:01.000Z'
      },
      {
        id: 'user-2',
        role: 'user',
        format: 'plain',
        status: 'done',
        content: '我的回答二',
        displayContent: '我的回答二',
        threadId: threads[1]!.id,
        createdAt: '2026-05-19T00:00:02.000Z'
      }
    ]

    const result = await state.finishMockSession()
    await nextTick()

    expect(result?.summary.questionReviews).toHaveLength(2)
    expect(result?.summary.questionReviews?.[0]).toMatchObject({
      questionId: 'material-q-0',
      referenceAnswer: '资料解析一'
    })
    expect(result?.summary.questionReviews?.[0]?.userAnswer).toContain('第 1 轮回答')
    expect(result?.summary.questionReviews?.[0]?.userAnswer).toContain('我的回答一')
    expect(result?.summary.questionReviews?.[0]?.aiFeedback).toContain('反馈一')
    expect(result?.summary.questionReviews?.[0]?.aiFeedback).not.toContain('第 1 轮反馈')
    expect(result?.summary.questionReviews?.[1]).toMatchObject({
      questionId: 'material-q-1',
      referenceAnswer: '资料解析二'
    })
    expect(result?.summary.questionReviews?.[1]?.userAnswer).toContain('我的回答二')
    expect(mockStore.reportSummaries[0]?.questionReviews).toHaveLength(2)
  })

  it('clears dialogue sessions but keeps report summaries and practice unlock', async () => {
    const isStreaming = ref(false)
    const activeDocument = ref<PersistedLibraryDocument | null>(createDocument())
    const messages = ref<InterviewMessage[]>([])
    const setActiveThreadId = vi.fn()

    mockStore.reportSummaries = [{
      id: 'report-1',
      sessionId: 'session-completed-1',
      topic: 'vue3',
      source: 'mock-interview-space',
      weaknessTags: ['指标量化'],
      primaryWeakness: '指标量化',
      answeredCount: 3,
      totalCount: 3,
      practicePlan: {
        weaknessTag: '指标量化',
        zone: 'vue',
        questionType: 'concept',
        questionCount: 10,
        difficulty: 'medium',
        reason: '最近一轮复盘弱项'
      },
      createdAt: '2026-05-20T00:00:00.000Z'
    }]
    mockStore.interviewSessions = [{
      id: 'session-completed-1',
      topic: 'vue3',
      mode: 'standard',
      source: 'mock-interview-space',
      status: 'completed',
      questionCount: 3,
      answeredCount: 3,
      startedAt: '2026-05-20T00:00:00.000Z',
      finishedAt: '2026-05-20T00:10:00.000Z',
      weaknessTags: ['指标量化'],
      questionThreadsSnapshot: [{
        id: 'thread-1',
        questionId: 'q-1',
        order: 0,
        sequence: 1,
        title: '第 1 题',
        prompt: '题面',
        origin: 'primary',
        createdAt: '2026-05-20T00:00:00.000Z'
      }],
      messagesSnapshot: [],
      submittedQuestionIds: ['thread-1']
    }]

    const state = useMockInterviewSpaceMockState({
      isStreaming,
      activeDocument,
      messages,
      setActiveThreadId,
      appendUserMessage: vi.fn(),
      appendSystemMessage: vi.fn(),
      startStream: vi.fn(),
      clearMessages: () => {
        messages.value = []
      }
    })

    await state.clearMockHistory()
    await nextTick()

    expect(mockStore.reportSummaries).toHaveLength(1)
    expect(mockStore.interviewSessions.some(item => item.id === 'session-completed-1')).toBe(false)
    expect(mockStore.workbenchContext?.practicePlan?.weaknessTag).toBe('指标量化')
  })
})

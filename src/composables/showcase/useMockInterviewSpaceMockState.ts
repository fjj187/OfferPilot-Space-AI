import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useWorkbenchPersistence } from '@/composables/useWorkbenchPersistence'
import type { InterviewGuide, InterviewQuestion } from '@/views/workbench/mock-interview.data'
import type { PersistedLibraryDocument, PersistedTopicKey } from '@/types/workbench'
import {
  difficultyLabelMap,
  interviewGuides,
  modeLabelMap as interviewModeLabelMap,
  interviewTopics,
  questionBank
} from '@/views/workbench/mock-interview.data'

type MockInterviewMode = 'standard' | 'stress' | 'guided'

interface StartMockStreamPayload {
  prompt: string
  topicLabel: string
  questionTitle: string
  questionPrompt: string
  answer: string
  sourceContext?: string
  sourceDocumentName?: string
  format: 'markdown'
}

interface UseMockInterviewSpaceMockStateOptions {
  isStreaming: Ref<boolean>
  activeDocument: Ref<PersistedLibraryDocument | null>
  appendUserMessage: (content: string) => void
  appendSystemMessage: (content: string) => void
  startStream: (payload: StartMockStreamPayload) => void
  clearMessages: () => void
}

export function useMockInterviewSpaceMockState(options: UseMockInterviewSpaceMockStateOptions) {
  const {
    loadWorkbenchContext,
    saveWorkbenchContext,
    findInterviewSession,
    getInterviewSessionById,
    createInterviewSession,
    updateInterviewSession,
    completeInterviewSession,
    saveReportSummary
  } = useWorkbenchPersistence()
  const topicLabelMap = interviewTopics.reduce<Record<string, string>>((map, item) => {
    map[item.key] = item.label
    return map
  }, {})

  const activeTopicKey = computed<PersistedTopicKey>(() => {
    return options.activeDocument.value?.topicKeys[0]
      || questionBank[0]?.topic
      || interviewTopics[0]?.key
      || 'vue3'
  })
  const activeMode = ref<MockInterviewMode>('standard')
  const topicQuestions = computed(() => {
    const questions = questionBank.filter(item => item.topic === activeTopicKey.value)
    const document = options.activeDocument.value
    if (!document) return questions

    const matchedByDocument = questions.filter(item => (
      item.source === document.sourceKey
      || item.docType === document.type
      || document.tags.some(tag => item.tags.includes(tag))
    ))

    return matchedByDocument.length ? matchedByDocument : questions
  })
  const primaryQuestion = computed<InterviewQuestion | null>(() => topicQuestions.value[0] || questionBank[0] || null)
  const currentGuide = computed<InterviewGuide | null>(() => {
    return interviewGuides.find(item => item.topic === activeTopicKey.value) || interviewGuides[0] || null
  })
  const activeDocumentContext = computed(() => {
    const document = options.activeDocument.value
    if (!document) return ''

    const rawExcerpt = document.rawText?.slice(0, 900).replace(/\s+/g, ' ').trim()
    return [
      `当前训练资料：${ document.name }`,
      `资料类型：${ document.type.toUpperCase() }`,
      `资料状态：${ document.status }`,
      `资料摘要：${ document.summary }`,
      `主题&标签：${ [...new Set([...document.topicKeys, ...document.tags])].join(' / ') }`,
      rawExcerpt ? `资料原文片段：${ rawExcerpt }` : ''
    ].filter(Boolean).join('\n')
  })

  const mockAnswerDraft = ref('')
  const mockFollowUpIndex = ref(0)
  const mockSubmittedQuestionIds = ref<string[]>([])
  const mockWeaknessSignals = ref<string[]>([])
  const currentSessionId = ref('')

  const currentSourceKey = computed(() => {
    return options.activeDocument.value?.sourceKey || loadWorkbenchContext()?.sourcePage || 'library'
  })

  const answeredCount = computed(() => mockSubmittedQuestionIds.value.length)
  const totalCount = computed(() => primaryQuestion.value ? 1 : 0)
  const currentSession = computed(() => {
    if (!currentSessionId.value) return null
    return getInterviewSessionById(currentSessionId.value)
  })
  const mockSessionStatusText = computed(() => {
    const status = currentSession.value?.status
    if (status === 'completed') return '本轮已完成，可查看复盘'
    if (status === 'in_progress') return answeredCount.value ? '本轮进行中，可结束并生成摘要' : '本轮已创建，等待你的第一条回答'
    return '当前还没有开始记录'
  })

  const mockPanelMeta = computed(() => {
    const question = primaryQuestion.value
    if (!question) return []

    return [
      `阶段: ${ question.stageLabel }`,
      `难度: ${ difficultyLabelMap[question.difficulty] }`,
      `模式: ${ interviewModeLabelMap[activeMode.value as keyof typeof interviewModeLabelMap] || '标准模拟' }`,
      `题源: ${ question.reference }`,
      ...(options.activeDocument.value ? [`资料: ${ options.activeDocument.value.name }`] : [])
    ]
  })

  const currentMockFollowUp = computed(() => {
    const followUps = primaryQuestion.value?.followUps || []
    if (!followUps.length) return ''
    return followUps[mockFollowUpIndex.value] || followUps[0] || ''
  })

  const isMockCurrentSubmitted = computed(() => {
    const question = primaryQuestion.value
    return !!question && mockSubmittedQuestionIds.value.includes(question.id)
  })

  const mockPanelWeakness = computed(() => {
    const fallback = primaryQuestion.value?.weaknessSignal || '当前还没有形成稳定弱项信号。'
    return mockWeaknessSignals.value.length ? mockWeaknessSignals.value.slice(0, 3) : [fallback]
  })

  const initializeMockConversation = () => {
    options.clearMessages()
  }

  const persistMockSession = (status?: 'in_progress' | 'completed') => {
    if (!currentSessionId.value) return

    const sessionPatch = {
      answeredCount: answeredCount.value,
      currentQuestionIndex: 0,
      submittedQuestionIds: [...mockSubmittedQuestionIds.value],
      weaknessTags: [...mockWeaknessSignals.value],
      followUpIndex: mockFollowUpIndex.value,
      hintVisible: activeMode.value === 'guided',
      sourceDocumentId: options.activeDocument.value?.id || ''
    }

    if (status === 'completed') {
      completeInterviewSession(currentSessionId.value, sessionPatch)
      return
    }

    updateInterviewSession(currentSessionId.value, sessionPatch)
  }

  const syncMockSession = () => {
    const question = primaryQuestion.value
    const context = loadWorkbenchContext()

    if (!question) {
      currentSessionId.value = ''
      return
    }

    const matchedSession = findInterviewSession({
      topic: activeTopicKey.value,
      mode: activeMode.value,
      source: currentSourceKey.value,
      status: 'in_progress'
    })

    if (matchedSession) {
      currentSessionId.value = matchedSession.id
      mockFollowUpIndex.value = matchedSession.followUpIndex
      mockSubmittedQuestionIds.value = [...matchedSession.submittedQuestionIds]
      mockWeaknessSignals.value = [...matchedSession.weaknessTags]
    } else {
      currentSessionId.value = `space-session-${ Date.now() }`
      mockFollowUpIndex.value = 0
      mockSubmittedQuestionIds.value = []
      mockWeaknessSignals.value = []

      createInterviewSession({
        id: currentSessionId.value,
        topic: activeTopicKey.value,
        mode: activeMode.value,
        source: currentSourceKey.value,
        sourceDocumentId: options.activeDocument.value?.id || '',
        docType: options.activeDocument.value?.type || question.docType,
        questionCount: 1,
        answeredCount: 0,
        currentQuestionIndex: 0,
        submittedQuestionIds: [],
        weaknessTags: [],
        followUpIndex: 0,
        hintVisible: activeMode.value === 'guided',
        status: 'in_progress'
      })
    }

    saveWorkbenchContext({
      activeTopic: activeTopicKey.value,
      activeDocumentId: options.activeDocument.value?.id || context?.activeDocumentId || '',
      currentMode: activeMode.value,
      sourcePage: 'mock-interview-space'
    })
  }

  const submitMockAnswer = () => {
    if (!currentSessionId.value || currentSession.value?.status === 'completed') {
      syncMockSession()
    }

    const question = primaryQuestion.value
    const answer = mockAnswerDraft.value.trim()
    if (!question || !answer || options.isStreaming.value) return

    if (!mockSubmittedQuestionIds.value.includes(question.id)) {
      mockSubmittedQuestionIds.value = [...mockSubmittedQuestionIds.value, question.id]
    }

    if (answer.length < 60) {
      mockWeaknessSignals.value = [...new Set(['回答偏短，可继续补结构、案例和结果。', ...mockWeaknessSignals.value])]
    }
    else {
      mockWeaknessSignals.value = [...new Set([question.weaknessSignal, ...mockWeaknessSignals.value])]
    }

    options.appendUserMessage(answer)
    options.startStream({
      prompt: [
        question.title,
        activeDocumentContext.value,
        answer
      ].filter(Boolean).join('\n\n'),
      topicLabel: topicLabelMap[activeTopicKey.value] || 'Vue 3',
      questionTitle: question.title,
      questionPrompt: question.prompt,
      answer,
      sourceContext: activeDocumentContext.value,
      sourceDocumentName: options.activeDocument.value?.name,
      format: 'markdown'
    })
    persistMockSession()
    mockAnswerDraft.value = ''
  }

  const clearMockAnswer = () => {
    if (options.isStreaming.value) return
    mockAnswerDraft.value = ''
  }

  const rotateMockFollowUp = () => {
    const followUps = primaryQuestion.value?.followUps || []
    if (!followUps.length) return

    mockFollowUpIndex.value = (mockFollowUpIndex.value + 1) % followUps.length
    if (currentMockFollowUp.value) {
      options.appendSystemMessage(`当前推荐追问：${ currentMockFollowUp.value }`)
    }
    persistMockSession()
  }

  const finishMockSession = () => {
    if (!currentSessionId.value) return null

    options.clearMessages()
    persistMockSession('completed')

    const summary = saveReportSummary({
      id: `report-${ currentSessionId.value }`,
      sessionId: currentSessionId.value,
      topic: activeTopicKey.value,
      source: currentSourceKey.value,
      weaknessTags: [...mockWeaknessSignals.value],
      answeredCount: answeredCount.value,
      totalCount: totalCount.value,
      createdAt: new Date().toISOString()
    })

    currentSessionId.value = ''
    mockAnswerDraft.value = ''
    mockFollowUpIndex.value = 0
    mockSubmittedQuestionIds.value = []
    mockWeaknessSignals.value = []

    return summary
  }

  watch(
    () => `${ primaryQuestion.value?.id || '' }:${ options.activeDocument.value?.id || '' }`,
    () => {
      mockAnswerDraft.value = ''
      initializeMockConversation()
      syncMockSession()
    },
    {
      immediate: true
    }
  )

  watch(
    [mockSubmittedQuestionIds, mockWeaknessSignals],
    () => {
      persistMockSession()
    },
    {
      deep: true
    }
  )

  return {
    activeTopicKey,
    answeredCount,
    currentGuide,
    currentMockFollowUp,
    currentSessionId,
    mockAnswerDraft,
    mockFollowUpIndex,
    mockPanelMeta,
    mockSessionStatusText,
    mockPanelWeakness,
    mockSubmittedQuestionIds,
    mockWeaknessSignals,
    primaryQuestion,
    clearMockAnswer,
    finishMockSession,
    isMockCurrentSubmitted,
    rotateMockFollowUp,
    submitMockAnswer,
    totalCount
  }
}

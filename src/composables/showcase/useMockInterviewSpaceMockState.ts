import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useWorkbenchPersistence } from '@/composables/useWorkbenchPersistence'
import type { InterviewMessage } from '@/types/message'
import type { InterviewGuide, InterviewQuestion } from '@/views/workbench/mock-interview.data'
import type {
  PersistedInterviewMode,
  PersistedLibraryDocument,
  PersistedMockSessionConfig,
  PersistedPracticeDifficulty,
  PersistedPracticeFocusArea,
  PersistedPracticePlan,
  PersistedPracticeQuestionType,
  PersistedPracticeZone,
  PersistedReportSummary,
  PersistedTopicKey
} from '@/types/workbench'
import {
  difficultyLabelMap,
  interviewGuides,
  interviewTopics,
  questionBank
} from '@/views/workbench/mock-interview.data'

type MockInterviewMode = 'standard' | 'stress' | 'guided'

interface StartMockStreamPayload {
  threadId?: string
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
  messages: Ref<InterviewMessage[]>
  setActiveThreadId: (threadId: string) => void
  appendUserMessage: (content: string, threadId?: string) => void
  appendSystemMessage: (content: string, format?: 'plain' | 'markdown', threadId?: string) => void
  startStream: (payload: StartMockStreamPayload) => void
  clearMessages: () => void
}

export interface MockInterviewQuestionThread {
  id: string
  questionId?: string
  sequence: number
  title: string
  prompt: string
  origin: 'primary' | 'followup'
  order: number
  createdAt: string
}

export interface MockInterviewReplayConfig extends PersistedMockSessionConfig {
  topic: PersistedTopicKey
  mode: PersistedInterviewMode
  practicePlan: PersistedPracticePlan | null
}

export interface FinishMockRoundResult {
  sessionId: string
  summary: PersistedReportSummary
  replayConfig: MockInterviewReplayConfig
}

export function useMockInterviewSpaceMockState(options: UseMockInterviewSpaceMockStateOptions) {
  const {
    loadWorkbenchContext,
    saveWorkbenchContext,
    loadInterviewSessions,
    findInterviewSession,
    getInterviewSessionById,
    createInterviewSession,
    updateInterviewSession,
    completeInterviewSession,
    saveReportSummary,
    removeInterviewSession,
    removeReportSummariesBySessionId
  } = useWorkbenchPersistence()
  const topicLabelMap = interviewTopics.reduce<Record<string, string>>((map, item) => {
    map[item.key] = item.label
    return map
  }, {})
  const practiceZoneByTopic: Record<PersistedTopicKey, PersistedPracticeZone> = {
    vue3: 'vue',
    typescript: 'typescript',
    engineering: 'engineering',
    browser: 'javascript',
    performance: 'performance',
    scenario: 'javascript'
  }
  const topicByPracticeZone: Record<PersistedPracticeZone, PersistedTopicKey> = {
    vue: 'vue3',
    javascript: 'browser',
    typescript: 'typescript',
    engineering: 'engineering',
    performance: 'performance'
  }
  const workbenchContext = computed(() => loadWorkbenchContext())
  const currentPracticePlan = computed<PersistedPracticePlan | null>(() => workbenchContext.value?.practicePlan || null)
  const currentMockEntryMode = computed(() => {
    if (workbenchContext.value?.mockEntryMode) return workbenchContext.value.mockEntryMode
    return currentPracticePlan.value ? 'practice' : 'direct'
  })
  const currentMockSessionConfig = computed<PersistedMockSessionConfig | null>(() => {
    const storedConfig = workbenchContext.value?.mockSessionConfig
    if (storedConfig) return storedConfig
    if (!currentPracticePlan.value) return null
    return {
      entryMode: 'practice',
      activeDocumentId: options.activeDocument.value?.id || '',
      zone: currentPracticePlan.value.zone,
      questionType: currentPracticePlan.value.questionType,
      questionCount: currentPracticePlan.value.questionCount,
      difficulty: currentPracticePlan.value.difficulty
    }
  })
  const currentSessionConfigKey = computed(() => {
    const config = currentMockSessionConfig.value
    if (!config) return `direct|${ options.activeDocument.value?.id || '' }`
    return [
      config.entryMode,
      config.activeDocumentId || '',
      config.zone || '',
      config.questionType || '',
      String(config.questionCount || ''),
      config.difficulty || ''
    ].join('|')
  })
  const hasMockSetup = computed(() => {
    return Boolean(options.activeDocument.value || currentMockSessionConfig.value || currentPracticePlan.value)
  })
  const currentReplayConfig = computed<MockInterviewReplayConfig>(() => ({
    topic: activeTopicKey.value,
    mode: activeMode.value,
    entryMode: currentMockEntryMode.value,
    activeDocumentId: options.activeDocument.value?.id || currentMockSessionConfig.value?.activeDocumentId || '',
    zone: currentMockSessionConfig.value?.zone,
    questionType: currentMockSessionConfig.value?.questionType,
    questionCount: currentMockSessionConfig.value?.questionCount,
    difficulty: currentMockSessionConfig.value?.difficulty,
    practicePlan: currentPracticePlan.value
  }))

  const activeTopicKey = computed<PersistedTopicKey>(() => {
    if (currentPracticePlan.value?.zone) {
      return topicByPracticeZone[currentPracticePlan.value.zone] || 'vue3'
    }
    return options.activeDocument.value?.topicKeys[0]
      || questionBank[0]?.topic
      || interviewTopics[0]?.key
      || 'vue3'
  })
  const activeMode = ref<MockInterviewMode>('standard')

  const matchesPracticeQuestionType = (question: InterviewQuestion, type: PersistedPracticeQuestionType) => {
    const subject = `${ question.stageLabel } ${ question.title } ${ question.prompt } ${ question.tags.join(' ') }`
    if (type === 'scenario') {
      return /场景|项目|追问|表达|沟通/.test(subject)
    }
    if (type === 'code') {
      return /源码|代码|实现|类型|泛型|响应式|性能|缓存/.test(subject)
    }
    return /理解|基础|核心|原理|概念/.test(subject)
  }

  const topicQuestions = computed(() => {
    if (!hasMockSetup.value) return []
    const questions = questionBank.filter(item => item.topic === activeTopicKey.value)
    const practicePlan = currentPracticePlan.value
    const sessionConfig = currentMockSessionConfig.value
    const questionType = sessionConfig?.questionType || practicePlan?.questionType
    const questionDifficulty = sessionConfig?.difficulty || practicePlan?.difficulty
    if (currentMockEntryMode.value === 'practice' && questionType && questionDifficulty) {
      const byDifficulty = questions.filter(item => item.difficulty === questionDifficulty)
      const baseQuestions = byDifficulty.length ? byDifficulty : questions
      const byType = baseQuestions.filter(item => matchesPracticeQuestionType(item, questionType))
      if (byType.length) return byType
      if (baseQuestions.length) return baseQuestions
    }

    const document = options.activeDocument.value
    if (!document) return questions

    const matchedByDocument = questions.filter(item => (
      item.source === document.sourceKey
      || item.docType === document.type
      || document.tags.some(tag => item.tags.includes(tag))
    ))

    return matchedByDocument.length ? matchedByDocument : questions
  })
  const primaryQuestion = computed<InterviewQuestion | null>(() => topicQuestions.value[0] || null)
  const currentGuide = computed<InterviewGuide | null>(() => {
    return interviewGuides.find(item => item.topic === activeTopicKey.value) || interviewGuides[0] || null
  })
  const activeDocumentContext = computed(() => {
    const document = options.activeDocument.value
    const practicePlan = currentPracticePlan.value
    if (!document) return ''

    const rawExcerpt = document.rawText?.slice(0, 900).replace(/\s+/g, ' ').trim()
    return [
      `当前训练资料：${ document.name }`,
      `资料类型：${ document.type.toUpperCase() }`,
      `资料状态：${ document.status }`,
      `资料摘要：${ document.summary }`,
      `主题&标签：${ [...new Set([...document.topicKeys, ...document.tags])].join(' / ') }`,
      practicePlan ? `专项训练目标：围绕“${ practicePlan.weaknessTag }”进行 ${ practicePlan.questionCount } 题 ${ practicePlan.difficulty } 难度 ${ practicePlan.questionType } 训练。` : '',
      rawExcerpt ? `资料原文片段：${ rawExcerpt }` : ''
    ].filter(Boolean).join('\n')
  })

  const mockAnswerDraft = ref('')
  const mockFollowUpIndex = ref(0)
  const mockSubmittedQuestionIds = ref<string[]>([])
  const mockWeaknessSignals = ref<string[]>([])
  const currentSessionId = ref('')
  const questionThreads = ref<MockInterviewQuestionThread[]>([])
  const activeQuestionThreadId = ref('')
  const generatedThreadCount = ref(0)
  const historyPreviewSessionId = ref('')
  const historyPreviewThreads = ref<MockInterviewQuestionThread[]>([])
  const historyPreviewMessages = ref<InterviewMessage[]>([])
  const historyPreviewSubmittedQuestionIds = ref<string[]>([])
  const historyPreviewActiveThreadId = ref('')

  const currentSourceKey = computed(() => {
    if (currentMockEntryMode.value === 'practice') return 'practice'
    return options.activeDocument.value?.sourceKey || loadWorkbenchContext()?.sourcePage || 'library'
  })
  const isMockAwaitingSetup = computed(() => {
    return !hasMockSetup.value && !historyPreviewSessionId.value
  })
  const isViewingHistoryPreview = computed(() => Boolean(historyPreviewSessionId.value))

  const activeQuestionThread = computed(() => {
    const threads = isViewingHistoryPreview.value ? historyPreviewThreads.value : questionThreads.value
    const currentThreadId = isViewingHistoryPreview.value ? historyPreviewActiveThreadId.value : activeQuestionThreadId.value
    return threads.find(item => item.id === currentThreadId) || threads[0] || null
  })
  const activeQuestion = computed<InterviewQuestion | null>(() => {
    const activeThreadQuestionId = activeQuestionThread.value?.questionId
    if (!activeThreadQuestionId) return topicQuestions.value[0] || null
    return topicQuestions.value.find(item => item.id === activeThreadQuestionId)
      || questionBank.find(item => item.id === activeThreadQuestionId)
      || topicQuestions.value[0]
      || null
  })
  const currentQuestionPosition = computed(() => activeQuestionThread.value?.sequence || 0)
  const displayAllMessages = computed(() => {
    return isViewingHistoryPreview.value ? historyPreviewMessages.value : options.messages.value
  })
  const displayMessages = computed(() => {
    const activeThreadId = activeQuestionThread.value?.id || ''
    if (!activeThreadId) return []
    return displayAllMessages.value.filter(item => item.threadId === activeThreadId)
  })
  const visibleQuestionThreads = computed(() => {
    if (isViewingHistoryPreview.value) return historyPreviewThreads.value
    return questionThreads.value.slice(0, generatedThreadCount.value || 0)
  })
  const latestGeneratedQuestionThread = computed(() => visibleQuestionThreads.value[visibleQuestionThreads.value.length - 1] || null)
  const nextPendingQuestionThread = computed(() => {
    return visibleQuestionThreads.value.find(item => !mockSubmittedQuestionIds.value.includes(item.id)) || null
  })
  const answeredCount = computed(() => {
    return isViewingHistoryPreview.value ? historyPreviewSubmittedQuestionIds.value.length : mockSubmittedQuestionIds.value.length
  })
  const totalCount = computed(() => {
    return isViewingHistoryPreview.value ? historyPreviewThreads.value.length : questionThreads.value.length
  })
  const currentSession = computed(() => {
    if (!currentSessionId.value) return null
    return getInterviewSessionById(currentSessionId.value)
  })
  const mockSessionStatusText = computed(() => {
    if (isViewingHistoryPreview.value) {
      return '当前正在查看上次模拟面试历史，你可以切换题目回看当时的提问与作答。'
    }
    if (isMockAwaitingSetup.value) {
      return '请先去资料页或专项刷题页选择对应资料或题型，再回来开始面试。'
    }
    const status = currentSession.value?.status
    if (status === 'completed') return '本轮已完成，可查看复盘'
    if (answeredCount.value && answeredCount.value === totalCount.value && generatedThreadCount.value === questionThreads.value.length) {
      return '您已作答完毕，可以生成对应报告，然后点击结束按钮。'
    }
    if (status === 'in_progress') return answeredCount.value ? '本轮进行中，可结束并生成摘要' : '本轮已创建，等待你的第一条回答'
    return '当前还没有开始记录'
  })

  const mockPanelMeta = computed(() => {
    const question = activeQuestion.value || primaryQuestion.value
    if (!question || isMockAwaitingSetup.value) return []
    const trainingModeLabel = currentMockEntryMode.value === 'practice' ? '专项刷题' : '模拟面试'
    const practiceQuestionTypeLabelMap: Record<PersistedPracticeQuestionType, string> = {
      concept: '概念理解题',
      code: '代码分析题',
      scenario: '场景追问题'
    }
    const practiceZoneLabelMap: Record<PersistedPracticeZone, string> = {
      vue: 'Vue',
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      engineering: '工程化',
      performance: '性能优化'
    }
    const practiceConfig = currentMockSessionConfig.value

    return [
      `模式: ${ trainingModeLabel }`,
      `难度: ${ difficultyLabelMap[practiceConfig?.difficulty || question.difficulty] }`,
      ...(currentMockEntryMode.value === 'practice' && practiceConfig?.zone ? [`专项专区: ${ practiceZoneLabelMap[practiceConfig.zone] }`] : []),
      ...(currentMockEntryMode.value === 'practice' && practiceConfig?.questionType ? [`题型: ${ practiceQuestionTypeLabelMap[practiceConfig.questionType] }`] : []),
      ...(currentMockEntryMode.value === 'practice' && practiceConfig?.questionCount ? [`题数: ${ practiceConfig.questionCount }题`] : []),
      ...(options.activeDocument.value ? [`资料: ${ options.activeDocument.value.name }`] : [])
    ]
  })

  const currentMockFollowUp = computed(() => {
    const followUps = primaryQuestion.value?.followUps || []
    if (!followUps.length) return ''
    return followUps[mockFollowUpIndex.value] || followUps[0] || ''
  })
  const hasNextMockFollowUp = computed(() => {
    if (isMockAwaitingSetup.value) return false
    if (isViewingHistoryPreview.value) return false
    return generatedThreadCount.value < questionThreads.value.length || answeredCount.value < totalCount.value
  })

  const isMockCurrentSubmitted = computed(() => {
    if (!activeQuestionThread.value) return false
    const submittedIds = isViewingHistoryPreview.value ? historyPreviewSubmittedQuestionIds.value : mockSubmittedQuestionIds.value
    return submittedIds.includes(activeQuestionThread.value.id)
  })

  const mockPanelWeakness = computed(() => {
    const fallback = primaryQuestion.value?.weaknessSignal || '当前还没有形成稳定弱项信号。'
    return mockWeaknessSignals.value.length ? mockWeaknessSignals.value.slice(0, 3) : [fallback]
  })

  const initializeMockConversation = () => {
    options.clearMessages()
  }

  const clearHistoryPreview = () => {
    historyPreviewSessionId.value = ''
    historyPreviewThreads.value = []
    historyPreviewMessages.value = []
    historyPreviewSubmittedQuestionIds.value = []
    historyPreviewActiveThreadId.value = ''
  }

  const resetMockRoundState = () => {
    clearHistoryPreview()
    options.clearMessages()
    currentSessionId.value = ''
    mockAnswerDraft.value = ''
    mockFollowUpIndex.value = 0
    mockSubmittedQuestionIds.value = []
    mockWeaknessSignals.value = []
    activeQuestionThreadId.value = ''
    generatedThreadCount.value = 0
  }

  const buildQuestionThreads = (question: InterviewQuestion): MockInterviewQuestionThread[] => {
    const createdAt = new Date().toISOString()
    return [
      {
        id: `${ question.id }-thread-0`,
        sequence: 1,
        title: `第 1 题 · ${ question.title }`,
        prompt: question.prompt,
        origin: 'primary',
        order: 0,
        createdAt
      },
      ...question.followUps.map((item, index) => ({
        id: `${ question.id }-thread-${ index + 1 }`,
        sequence: index + 2,
        title: `第 ${ index + 2 } 题 · ${ item }`,
        prompt: item,
        origin: 'followup' as const,
        order: index + 1,
        createdAt
      }))
    ]
  }

  const buildConfiguredQuestionThreads = (question: InterviewQuestion): MockInterviewQuestionThread[] => {
    if (currentMockEntryMode.value !== 'practice') {
      return buildQuestionThreads(question).map(item => ({
        ...item,
        questionId: item.questionId || question.id
      }))
    }

    const configuredCount = currentMockSessionConfig.value?.questionCount || currentPracticePlan.value?.questionCount || 1
    const sourceQuestions = topicQuestions.value.length ? topicQuestions.value : [question]
    return Array.from({
      length: configuredCount
    }, (_, index) => {
      const sourceQuestion = sourceQuestions[index % sourceQuestions.length] || question
      return {
        id: `${ sourceQuestion.id }-practice-thread-${ index }`,
        questionId: sourceQuestion.id,
        sequence: index + 1,
        title: `第 ${ index + 1 } / ${ configuredCount } 题 · ${ sourceQuestion.title }`,
        prompt: sourceQuestion.prompt,
        origin: 'primary' as const,
        order: index,
        createdAt: new Date().toISOString()
      }
    })
  }

  const ensureInitialPracticeQuestion = () => {
    const currentThread = questionThreads.value[0]
    if (!currentPracticePlan.value || !currentThread) return
    const hasThreadMessages = options.messages.value.some(item => item.threadId === currentThread.id)
    if (hasThreadMessages) return
    options.setActiveThreadId(currentThread.id)
    options.appendSystemMessage(`当前题目：${ currentThread.prompt }`, 'plain', currentThread.id)
  }

  const syncQuestionThreads = (question: InterviewQuestion | null) => {
    if (!question) {
      questionThreads.value = []
      activeQuestionThreadId.value = ''
      generatedThreadCount.value = 0
      return
    }

    const nextThreads = buildConfiguredQuestionThreads(question)
    questionThreads.value = nextThreads
    generatedThreadCount.value = nextThreads.length ? 1 : 0
    if (!nextThreads.some(item => item.id === activeQuestionThreadId.value)) {
      activeQuestionThreadId.value = nextThreads[0]?.id || ''
    }
    if (activeQuestionThreadId.value) {
      options.setActiveThreadId(activeQuestionThreadId.value)
    }
    ensureInitialPracticeQuestion()
  }

  const selectQuestionThread = (threadId: string) => {
    if (!visibleQuestionThreads.value.some(item => item.id === threadId)) return
    if (isViewingHistoryPreview.value) {
      historyPreviewActiveThreadId.value = threadId
      options.setActiveThreadId(threadId)
      return
    }
    activeQuestionThreadId.value = threadId
    options.setActiveThreadId(threadId)
  }

  const normalizeSnippet = (content: string, maxLength = 88) => {
    const normalized = content.replace(/\s+/g, ' ').trim()
    if (!normalized) return ''
    return normalized.length > maxLength ? `${ normalized.slice(0, maxLength) }...` : normalized
  }

  const resolvePracticeQuestionType = (weakness: string): PersistedPracticeQuestionType => {
    if (/追问|场景|项目|案例|沟通|表达/.test(weakness))
      return 'scenario'
    if (/代码|实现|语法|类型|泛型|响应式|性能/.test(weakness))
      return 'code'
    return 'concept'
  }

  const resolvePracticeDifficulty = (answerLength: number, weaknessCount: number): PersistedPracticeDifficulty => {
    if (answerLength < 80) return 'easy'
    if (weaknessCount >= 3) return 'hard'
    return 'medium'
  }

  const resolvePracticeFocusAreas = (
    latestAnswer: string,
    latestFeedback: string,
    primaryWeakness: string
  ): PersistedPracticeFocusArea[] => {
    const content = `${ primaryWeakness } ${ latestFeedback } ${ latestAnswer }`
    const focusAreas: PersistedPracticeFocusArea[] = []

    if (
      latestAnswer.trim().length < 90
      || /结构|拆分|分段|结论|表达|没讲清|不够完整/.test(content)
    ) {
      focusAreas.push('structure')
    }

    if (/场景|案例|项目|经历|细节|上下文|取舍|过程/.test(content)) {
      focusAreas.push('case_detail')
    }

    if (/结果|指标|收益|数据|效果|量化|验证/.test(content)) {
      focusAreas.push('result_metric')
    }

    if (/原理|为什么|设计|响应式|源码|底层|机制|追问/.test(content)) {
      focusAreas.push('principle_depth')
    }

    return [...new Set(focusAreas)].slice(0, 3)
  }

  const practiceFocusAreaLabelMap: Record<PersistedPracticeFocusArea, string> = {
    structure: '结构表达',
    case_detail: '案例细节',
    result_metric: '结果指标',
    principle_depth: '原理追问'
  }

  const buildReportSummary = (): PersistedReportSummary | null => {
    if (!currentSessionId.value) return null

    const question = primaryQuestion.value
    const topicLabel = topicLabelMap[activeTopicKey.value] || '当前主题'
    const primaryWeakness = mockWeaknessSignals.value[0] || question?.weaknessSignal || '当前还没有形成稳定弱项'
    const userMessages = options.messages.value.filter(item => item.role === 'user')
    const feedbackMessages = options.messages.value.filter(item => item.role === 'assistant' || item.role === 'system')
    const latestAnswer = userMessages[userMessages.length - 1]?.displayContent || ''
    const latestFeedback = feedbackMessages[feedbackMessages.length - 1]?.displayContent || ''
    const answerLength = latestAnswer.trim().length
    const answeredSummary = `${ answeredCount.value } / ${ totalCount.value || 1 }`
    const sourceDocumentName = options.activeDocument.value?.name || ''
    const sourceLabel = sourceDocumentName || '当前训练上下文'
    const questionAnswerSnapshot = visibleQuestionThreads.value.map((thread) => {
      const answerMessage = [...options.messages.value]
        .filter(item => item.threadId === thread.id && item.role === 'user')
        .pop()
      const answerText = normalizeSnippet(answerMessage?.displayContent || '', 88)
      return `${ thread.title }: ${ answerText || '未作答' }`
    })
    const summaryHeadline = `围绕 ${ sourceLabel } 的 ${ topicLabel } 训练已形成阶段性结果`
    const summaryBody = [
      `本轮围绕“${ question?.title || topicLabel }”共展开 ${ visibleQuestionThreads.value.length } 题，当前已完成 ${ answeredSummary }。`,
      latestAnswer
        ? `最近一次作答摘录为“${ normalizeSnippet(latestAnswer, 90) }”，当前最明显的短板是“${ primaryWeakness }”。`
        : `本轮已经浏览完题目，但还有未作答内容，当前最明显的短板先记为“${ primaryWeakness }”。`
    ].join('')
    const suggestedFocus = [
      answerLength < 80 ? '下一轮回答尽量按“结论 -> 拆分 -> 结果”三段式展开，避免答案过短。' : '',
      latestFeedback ? `优先处理最近一次反馈暴露的问题：${ normalizeSnippet(latestFeedback, 72) }` : '',
      sourceDocumentName ? `下一轮继续围绕《${ sourceDocumentName }》补练，把资料上下文真正转成可表达内容。` : '',
      answeredCount.value < totalCount.value ? '当前轮次还有未作答题目，这份报告会先按已展开题目生成阶段性结果。' : ''
    ].filter(Boolean)
    const practiceQuestionType = resolvePracticeQuestionType(primaryWeakness)
    const practiceDifficulty = resolvePracticeDifficulty(answerLength, mockWeaknessSignals.value.length)
    const weaknessFocusAreas = resolvePracticeFocusAreas(latestAnswer, latestFeedback, primaryWeakness)
    const focusArea = weaknessFocusAreas[0]
    const focusAreaText = focusArea ? practiceFocusAreaLabelMap[focusArea] : '当前弱项'

    return {
      id: `report-${ currentSessionId.value }`,
      sessionId: currentSessionId.value,
      topic: activeTopicKey.value,
      source: currentSourceKey.value,
      sourceDocumentId: options.activeDocument.value?.id || '',
      sourceDocumentName,
      weaknessTags: [...mockWeaknessSignals.value],
      weaknessFocusAreas,
      primaryWeakness,
      answeredCount: answeredCount.value,
      totalCount: totalCount.value,
      summaryHeadline,
      summaryBody,
      answerSnapshot: [
        ...questionAnswerSnapshot,
        latestFeedback ? `系统反馈: ${ normalizeSnippet(latestFeedback, 72) }` : ''
      ].filter(Boolean),
      suggestedFocus,
      practicePlan: {
        weaknessTag: primaryWeakness,
        focusArea,
        zone: practiceZoneByTopic[activeTopicKey.value] || 'vue',
        questionType: practiceQuestionType,
        questionCount: mockWeaknessSignals.value.length >= 3 ? 15 : answerLength < 80 ? 5 : 10,
        difficulty: practiceDifficulty,
        reason: sourceDocumentName
          ? `基于《${ sourceDocumentName }》这轮训练暴露的“${ focusAreaText } / ${ primaryWeakness }”生成定向补练计划。`
          : `基于当前 ${ topicLabel } 训练暴露的“${ focusAreaText } / ${ primaryWeakness }”生成定向补练计划。`
      },
      createdAt: new Date().toISOString()
    }
  }

  const persistMockSession = (status?: 'in_progress' | 'completed') => {
    if (!currentSessionId.value) return

    const sessionPatch = {
      answeredCount: answeredCount.value,
      currentQuestionIndex: Math.max(0, currentQuestionPosition.value - 1),
      submittedQuestionIds: [...mockSubmittedQuestionIds.value],
      questionThreadsSnapshot: visibleQuestionThreads.value.map(thread => ({
        id: thread.id,
        questionId: thread.questionId,
        order: thread.order,
        sequence: thread.sequence,
        title: thread.title,
        prompt: thread.prompt,
        origin: thread.origin,
        createdAt: thread.createdAt
      })),
      messagesSnapshot: [...options.messages.value],
      activeQuestionThreadId: activeQuestionThreadId.value,
      generatedThreadCount: generatedThreadCount.value,
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
    clearHistoryPreview()

    if (!question || isMockAwaitingSetup.value) {
      currentSessionId.value = ''
      mockFollowUpIndex.value = 0
      mockSubmittedQuestionIds.value = []
      mockWeaknessSignals.value = []
      activeQuestionThreadId.value = ''
      generatedThreadCount.value = 0
      return
    }

    const matchedSession = findInterviewSession({
      topic: activeTopicKey.value,
      mode: activeMode.value,
      source: currentSourceKey.value,
      sessionConfigKey: currentSessionConfigKey.value,
      status: 'in_progress'
    })

    if (matchedSession) {
      const submittedQuestionIds = matchedSession.submittedQuestionIds.filter(threadId => (
        questionThreads.value.some(item => item.id === threadId)
      ))
      const restoredGeneratedCount = Math.min(
        questionThreads.value.length,
        Math.max(1, submittedQuestionIds.length + 1)
      )

      currentSessionId.value = matchedSession.id
      mockFollowUpIndex.value = matchedSession.followUpIndex
      mockSubmittedQuestionIds.value = submittedQuestionIds
      mockWeaknessSignals.value = [...matchedSession.weaknessTags]
      generatedThreadCount.value = restoredGeneratedCount
      activeQuestionThreadId.value = questionThreads.value[Math.max(0, restoredGeneratedCount - 1)]?.id || questionThreads.value[0]?.id || ''
      if (activeQuestionThreadId.value) {
        options.setActiveThreadId(activeQuestionThreadId.value)
      }
    } else {
      currentSessionId.value = `space-session-${ Date.now() }`
      mockFollowUpIndex.value = 0
      mockSubmittedQuestionIds.value = []
      mockWeaknessSignals.value = []
      generatedThreadCount.value = questionThreads.value.length ? 1 : 0

      createInterviewSession({
        id: currentSessionId.value,
        topic: activeTopicKey.value,
        mode: activeMode.value,
        source: currentSourceKey.value,
        sessionConfigKey: currentSessionConfigKey.value,
        sourceDocumentId: options.activeDocument.value?.id || '',
        docType: options.activeDocument.value?.type || question.docType,
        questionCount: totalCount.value || 1,
        answeredCount: 0,
        currentQuestionIndex: 0,
        submittedQuestionIds: [],
        questionThreadsSnapshot: questionThreads.value.slice(0, generatedThreadCount.value || 0).map(thread => ({
          id: thread.id,
          questionId: thread.questionId,
          order: thread.order,
          sequence: thread.sequence,
          title: thread.title,
          prompt: thread.prompt,
          origin: thread.origin,
          createdAt: thread.createdAt
        })),
        messagesSnapshot: [],
        activeQuestionThreadId: questionThreads.value[0]?.id || '',
        generatedThreadCount: generatedThreadCount.value,
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
      sourcePage: context?.sourcePage || (currentMockEntryMode.value === 'practice' ? 'practice' : 'mock-interview-space'),
      practicePlan: currentPracticePlan.value,
      mockEntryMode: currentMockEntryMode.value,
      mockSessionConfig: currentMockSessionConfig.value
    })
  }

  const submitMockAnswer = () => {
    if (isViewingHistoryPreview.value) return
    if (!currentSessionId.value || currentSession.value?.status === 'completed') {
      syncMockSession()
    }

    const question = primaryQuestion.value
    const thread = activeQuestionThread.value
    const answer = mockAnswerDraft.value.trim()
    if (!question || !thread || !answer || options.isStreaming.value) return

    if (!mockSubmittedQuestionIds.value.includes(thread.id)) {
      mockSubmittedQuestionIds.value = [...mockSubmittedQuestionIds.value, thread.id]
    }

    if (answer.length < 60) {
      mockWeaknessSignals.value = [...new Set(['回答偏短，可继续补结构、案例和结果。', ...mockWeaknessSignals.value])]
    }
    else {
      mockWeaknessSignals.value = [...new Set([question.weaknessSignal, ...mockWeaknessSignals.value])]
    }

    options.setActiveThreadId(thread.id)
    options.appendUserMessage(answer, thread.id)
    options.startStream({
      threadId: thread.id,
      prompt: [
        thread.prompt,
        currentPracticePlan.value
          ? `专项训练要求：围绕“${ currentPracticePlan.value.weaknessTag }”进行 ${ currentPracticePlan.value.difficulty } 难度 ${ currentPracticePlan.value.questionType } 强化。`
          : '',
        activeDocumentContext.value,
        answer
      ].filter(Boolean).join('\n\n'),
      topicLabel: topicLabelMap[activeTopicKey.value] || 'Vue 3',
      questionTitle: thread.title,
      questionPrompt: thread.prompt,
      answer,
      sourceContext: activeDocumentContext.value,
      sourceDocumentName: options.activeDocument.value?.name,
      format: 'markdown'
    })
    persistMockSession()
    mockAnswerDraft.value = ''
  }

  const clearMockAnswer = () => {
    if (isViewingHistoryPreview.value) return
    if (options.isStreaming.value) return
    mockAnswerDraft.value = ''
  }

  const rotateMockFollowUp = () => {
    if (isViewingHistoryPreview.value) return
    const currentThread = activeQuestionThread.value
    const latestThread = latestGeneratedQuestionThread.value
    const allThreads = questionThreads.value
    const canGenerateNext = generatedThreadCount.value < allThreads.length

    if (canGenerateNext) {
      const nextThread = allThreads[generatedThreadCount.value]
      generatedThreadCount.value += 1
      const shouldOpenNext = !currentThread || currentThread.id === latestThread?.id
      if (shouldOpenNext && nextThread) {
        activeQuestionThreadId.value = nextThread.id
        mockFollowUpIndex.value = Math.max(0, nextThread.order - 1)
        options.setActiveThreadId(nextThread.id)
      }
      if (nextThread) {
        const hasThreadMessages = options.messages.value.some(item => item.threadId === nextThread.id)
        if (!hasThreadMessages) {
          options.appendSystemMessage(`当前题目：${ nextThread.prompt }`, 'plain', nextThread.id)
        }
      }
      persistMockSession()
      return
    }

    const pendingThread = nextPendingQuestionThread.value
    if (pendingThread && pendingThread.id !== currentThread?.id) {
      activeQuestionThreadId.value = pendingThread.id
      mockFollowUpIndex.value = Math.max(0, pendingThread.order - 1)
      options.setActiveThreadId(pendingThread.id)
      persistMockSession()
    }
  }

  const finishMockSession = () => {
    if (!currentSessionId.value) return null

    persistMockSession('completed')

    const nextSummary = buildReportSummary()
    if (!nextSummary) return null

    return {
      sessionId: currentSessionId.value,
      summary: saveReportSummary(nextSummary),
      replayConfig: {
        ...currentReplayConfig.value,
        activeDocumentId: options.activeDocument.value?.id || currentReplayConfig.value.activeDocumentId || ''
      }
    } satisfies FinishMockRoundResult
  }

  const finalizeFinishedMockSession = () => {
    resetMockRoundState()
    saveWorkbenchContext({
      activeTopic: activeTopicKey.value,
      activeDocumentId: '',
      currentMode: activeMode.value,
      sourcePage: 'report',
      practicePlan: null,
      mockEntryMode: 'direct',
      mockSessionConfig: null
    })
  }

  const resolveLatestRestorableSession = () => {
    return [...loadInterviewSessions()]
      .filter(item => (
        item.status === 'completed'
        && Boolean(item.questionThreadsSnapshot?.length)
      ))
      .sort((prev, next) => {
        const nextTime = new Date(next.finishedAt || next.startedAt).getTime()
        const prevTime = new Date(prev.finishedAt || prev.startedAt).getTime()
        return nextTime - prevTime
      })[0] || null
  }

  const hasRestorableHistoryPreview = computed(() => Boolean(resolveLatestRestorableSession()))

  const openLatestHistoryPreview = () => {
    const latestCompletedSession = resolveLatestRestorableSession()

    if (!latestCompletedSession?.questionThreadsSnapshot?.length) return false

    historyPreviewSessionId.value = latestCompletedSession.id
    historyPreviewThreads.value = latestCompletedSession.questionThreadsSnapshot.map((thread, index) => ({
      id: thread.id,
      questionId: thread.questionId,
      order: thread.order,
      sequence: thread.sequence,
      title: thread.title,
      prompt: thread.prompt,
      origin: thread.origin || (index === 0 ? 'primary' : 'followup'),
      createdAt: thread.createdAt || latestCompletedSession.startedAt
    }))
    historyPreviewMessages.value = [...(latestCompletedSession.messagesSnapshot || [])]
    historyPreviewSubmittedQuestionIds.value = [...latestCompletedSession.submittedQuestionIds]
    historyPreviewActiveThreadId.value = latestCompletedSession.activeQuestionThreadId
      || latestCompletedSession.questionThreadsSnapshot[0]?.id
      || ''
    options.setActiveThreadId(historyPreviewActiveThreadId.value)
    return true
  }

  const exitHistoryPreview = () => {
    if (!historyPreviewSessionId.value) return
    clearHistoryPreview()
    if (activeQuestionThreadId.value) {
      options.setActiveThreadId(activeQuestionThreadId.value)
    }
  }

  const clearMockHistory = () => {
    const context = loadWorkbenchContext()
    const allSessionIds = loadInterviewSessions().map(item => item.id)
    allSessionIds.forEach((sessionId) => {
      removeInterviewSession(sessionId)
      removeReportSummariesBySessionId(sessionId)
    })

    resetMockRoundState()

    saveWorkbenchContext({
      activeTopic: activeTopicKey.value,
      activeDocumentId: '',
      currentMode: activeMode.value,
      sourcePage: context?.sourcePage || 'mock-interview-space',
      practicePlan: null,
      mockEntryMode: 'direct',
      mockSessionConfig: null
    })
  }

  watch(
    () => `${ primaryQuestion.value?.id || '' }:${ options.activeDocument.value?.id || '' }:${ currentPracticePlan.value?.weaknessTag || '' }:${ currentSessionConfigKey.value }`,
    () => {
      mockAnswerDraft.value = ''
      initializeMockConversation()
      if (isMockAwaitingSetup.value) {
        questionThreads.value = []
        activeQuestionThreadId.value = ''
        generatedThreadCount.value = 0
        syncMockSession()
        return
      }
      syncQuestionThreads(primaryQuestion.value)
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

  watch(
    () => options.messages.value,
    () => {
      if (isViewingHistoryPreview.value) return
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
    currentQuestionPosition,
    currentMockFollowUp,
    currentPracticePlan,
    currentReplayConfig,
    currentMockSessionConfig,
    currentSessionId,
    hasMockSetup,
    isMockAwaitingSetup,
    hasNextMockFollowUp,
    mockAnswerDraft,
    mockFollowUpIndex,
    mockPanelMeta,
    mockSessionStatusText,
    mockPanelWeakness,
    mockSubmittedQuestionIds,
    mockWeaknessSignals,
    displayAllMessages,
    displayMessages,
    questionThreads: visibleQuestionThreads,
    activeQuestionThread,
    activeQuestionThreadId,
    primaryQuestion,
    clearMockAnswer,
    finishMockSession,
    finalizeFinishedMockSession,
    clearMockHistory,
    exitHistoryPreview,
    isMockCurrentSubmitted,
    isViewingHistoryPreview,
    hasRestorableHistoryPreview,
    historyPreviewSessionId,
    openLatestHistoryPreview,
    rotateMockFollowUp,
    selectQuestionThread,
    submitMockAnswer,
    totalCount
  }
}

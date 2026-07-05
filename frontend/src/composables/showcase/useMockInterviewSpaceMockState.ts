import { computed, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useWorkbenchPersistence } from '@/composables/workspace/useWorkbenchPersistence'
import type { InterviewMessage } from '@/types/message'
import type { InterviewGuide, InterviewQuestion } from '@/views/workbench/mock-interview.data'
import type {
  PersistedInterviewFeedbackStyle,
  PersistedInterviewMode,
  PersistedLibraryDocument,
  PersistedMockSessionConfig,
  PersistedPracticeDifficulty,
  PersistedPracticeFocusArea,
  PersistedPracticePlan,
  PersistedPracticeQuestionGroup,
  PersistedPracticeQuestionType,
  PersistedPracticeZone,
  PersistedReportQuestionReviewItem,
  PersistedReportSummary,
  PersistedTopicKey
} from '@/types/workbench'
import {
  practiceQuestionMatchReasonLabelMap
} from '@/services/practice/practice-question-group-builder'
import { getMaterialQuestionPool } from '@/services/storage/material-pool-storage'
import {
  extractInterviewFeedbackHint,
  extractLatestInterviewerPrompt
} from '@/services/interview/extract-interview-feedback-hint'
import {
  buildMaterialAnswerHint,
  extractMaterialReferenceAnswer,
  formatMaterialReference,
  looksLikeAnswerBody,
  normalizeQuestionHeading,
  resolveQuestionDisplayText,
  splitMaterialPrompt
} from '@/services/material/material-prompt'
import { countTrailingUnknownAnswers, isReferenceAnswerRequest } from '@/utils/interview/is-unknown-answer'
import {
  formatReportThreadLatestAiFeedback,
  formatReportThreadUserAnswer
} from '@/utils/report/format-report-thread-dialogue'
import {
  resolveReportReferenceAnswer,
  resolveReportQuestionReferenceAnswer
} from '@/utils/report/resolve-report-reference-answer'
import { buildMaterialPracticeExcerpt } from '@/utils/practice/build-material-practice-excerpt'
import { resolveDominantPracticeQuestionType } from '@/utils/practice/resolve-dominant-practice-question-type'
import { clearRemoteInterviewHistory } from '@/services/interview/interview-session-api'
import {
  generateRemoteInterviewReport,
  isInterviewReportApiAvailable
} from '@/services/interview/interview-report-api'
import {
  difficultyLabelMap,
  interviewGuides,
  interviewTopics,
  questionBank
} from '@/views/workbench/mock-interview.data'

type MockInterviewMode = 'standard' | 'stress' | 'guided'

interface StartMockStreamPayload {
  threadId?: string
  modelId?: string
  prompt: string
  topicLabel: string
  questionTitle: string
  questionPrompt: string
  answer: string
  sourceContext?: string
  sourceDocumentName?: string
  sourceDocumentSummary?: string
  sourceDocumentTags?: string[]
  sourceDocumentExcerpt?: string
  feedbackStyle?: PersistedInterviewFeedbackStyle
  format: 'markdown'
  questionIndex?: number
  questionCount?: number
  unknownAnswerStreak?: number
  forceRevealReferenceAnswer?: boolean
  referenceAnswerHint?: string
}

interface UseMockInterviewSpaceMockStateOptions {
  isStreaming: Ref<boolean>
  activeDocument: Ref<PersistedLibraryDocument | null>
  messages: Ref<InterviewMessage[]>
  selectedModelId?: ComputedRef<string>
  mockSessionIdOverride?: ComputedRef<string>
  mockThreadIdOverride?: ComputedRef<string>
  setActiveSessionId: (sessionId: string) => void
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

export const defaultMockFeedbackStyle: PersistedInterviewFeedbackStyle = 'corrective'

export const feedbackStyleLabelMap: Record<PersistedInterviewFeedbackStyle, string> = {
  followup: '追问型',
  corrective: '纠偏型',
  guided: '引导型'
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
    loadReportSummaries
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
  const currentPracticeQuestionGroup = computed<PersistedPracticeQuestionGroup | null>(() => (
    workbenchContext.value?.practiceQuestionGroup || null
  ))
  const isMaterialGroupMode = computed(() => {
    const group = currentPracticeQuestionGroup.value
    return Boolean(
      group?.source === 'material_document'
      && group.items.length
      && group.status !== 'completed'
    )
  })
  const isPracticeGroupMode = computed(() => {
    const group = currentPracticeQuestionGroup.value
    return Boolean(
      !isMaterialGroupMode.value
      && currentMockEntryMode.value === 'practice'
      && group?.items.length
      && (
        group?.source === 'practice_weakness'
        || group?.source === 'practice_report_pool'
        || !group?.source
      )
    )
  })
  const isTrainingGroupMode = computed(() => isMaterialGroupMode.value || isPracticeGroupMode.value)
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
      feedbackStyle: defaultMockFeedbackStyle,
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
      config.difficulty || '',
      currentPracticeQuestionGroup.value?.id || ''
    ].join('|')
  })

  const persistPracticeQuestionGroup = (patch: Partial<PersistedPracticeQuestionGroup>) => {
    const group = currentPracticeQuestionGroup.value
    const context = loadWorkbenchContext()
    if (!group || !context) return

    saveWorkbenchContext({
      activeTopic: context.activeTopic,
      activeDocumentId: context.activeDocumentId,
      currentMode: context.currentMode,
      sourcePage: context.sourcePage,
      practicePlan: context.practicePlan,
      practiceQuestionGroup: {
        ...group,
        ...patch,
        updatedAt: new Date().toISOString()
      },
      mockEntryMode: context.mockEntryMode,
      mockSessionConfig: context.mockSessionConfig
    })
  }
  const hasMockSetup = computed(() => {
    return Boolean(
      options.activeDocument.value
      || currentMockSessionConfig.value
      || currentPracticePlan.value
      || isTrainingGroupMode.value
    )
  })
  const currentReplayConfig = computed<MockInterviewReplayConfig>(() => ({
    topic: activeTopicKey.value,
    mode: activeMode.value,
    entryMode: currentMockEntryMode.value,
    activeDocumentId: options.activeDocument.value?.id || currentMockSessionConfig.value?.activeDocumentId || '',
    feedbackStyle: currentMockSessionConfig.value?.feedbackStyle || defaultMockFeedbackStyle,
    zone: currentMockSessionConfig.value?.zone,
    questionType: currentMockSessionConfig.value?.questionType,
    questionCount: currentMockSessionConfig.value?.questionCount,
    difficulty: currentMockSessionConfig.value?.difficulty,
    practicePlan: currentPracticePlan.value
  }))
  const currentFeedbackStyle = computed<PersistedInterviewFeedbackStyle>(() => {
    return currentMockSessionConfig.value?.feedbackStyle
      || workbenchContext.value?.mockSessionConfig?.feedbackStyle
      || defaultMockFeedbackStyle
  })

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

  const hasSharedDocumentTags = (question: InterviewQuestion, document: PersistedLibraryDocument) => {
    if (!document.tags.length || !question.tags.length) return false
    return document.tags.some(tag => question.tags.includes(tag))
  }

  const resolveMatchedDocumentTags = (question: InterviewQuestion, document: PersistedLibraryDocument) => {
    if (!document.tags.length || !question.tags.length) return []
    return document.tags.filter(tag => question.tags.includes(tag))
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

    const matchedByTags = questions.filter(item => hasSharedDocumentTags(item, document))
    if (matchedByTags.length) return matchedByTags

    const matchedByType = questions.filter(item => item.docType === document.type)
    if (matchedByType.length) return matchedByType

    return questions
  })
  const primaryQuestion = computed<InterviewQuestion | null>(() => topicQuestions.value[0] || null)
  const activeQuestionMatchReason = computed(() => {
    const question = activeQuestion.value || primaryQuestion.value
    const document = options.activeDocument.value

    if (!question || !document) {
      return {
        type: 'topic_fallback' as const,
        matchedTags: [] as string[]
      }
    }

    const matchedTags = resolveMatchedDocumentTags(question, document)
    if (matchedTags.length) {
      return {
        type: 'tag_match' as const,
        matchedTags
      }
    }

    if (question.docType === document.type) {
      return {
        type: 'type_match' as const,
        matchedTags: [] as string[]
      }
    }

    return {
      type: 'topic_fallback' as const,
      matchedTags: [] as string[]
    }
  })
  const activeTrainingDocumentCore = computed(() => {
    const document = options.activeDocument.value
    if (!document) return null
    return {
      name: document.name,
      type: document.type,
      tags: document.tags,
      summary: document.summary,
      rawText: document.rawText
    }
  })
  const currentGuide = computed<InterviewGuide | null>(() => {
    return interviewGuides.find(item => item.topic === activeTopicKey.value) || interviewGuides[0] || null
  })
  const activeDocumentContext = computed(() => {
    const document = options.activeDocument.value
    const coreDocument = activeTrainingDocumentCore.value
    const practicePlan = currentPracticePlan.value
    if (!document || !coreDocument) return ''

    const rawExcerpt = coreDocument.rawText.slice(0, 900).replace(/\s+/g, ' ').trim()
    return [
      `当前训练资料：${ coreDocument.name }`,
      `资料类型：${ coreDocument.type.toUpperCase() }`,
      `核心训练标签：${ coreDocument.tags.join(' / ') || '待补标签' }`,
      `资料摘要：${ coreDocument.summary }`,
      rawExcerpt ? `资料原文片段：${ rawExcerpt }` : '资料原文片段：当前为空，可继续补充正文内容。',
      `资料状态：${ document.status }`,
      `附加元数据：${ [...new Set([...document.topicKeys, ...coreDocument.tags])].join(' / ') }`,
      practicePlan ? `专项训练目标：围绕“${ practicePlan.weaknessTag }”进行 ${ practicePlan.questionCount } 题 ${ practicePlan.difficulty } 难度 ${ practicePlan.questionType } 训练。` : ''
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
    if (isMaterialGroupMode.value) return 'library-material'
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
  const activePracticeGroupItem = computed(() => {
    const group = currentPracticeQuestionGroup.value
    const thread = activeQuestionThread.value
    if (!group || !thread?.questionId) return null
    return group.items.find(item => item.questionId === thread.questionId)
      || group.items[group.currentIndex]
      || null
  })
  const activeQuestionReference = computed(() => {
    const thread = activeQuestionThread.value
    if (!thread) return ''

    if (!isMaterialGroupMode.value) {
      return splitMaterialPrompt(thread.prompt).reference
    }

    const item = activePracticeGroupItem.value
    if (item?.referenceAnswer?.trim()) {
      const heading = item.title || normalizeQuestionHeading(item.prompt)
      return formatMaterialReference(
        heading,
        extractMaterialReferenceAnswer(item.referenceAnswer, 400)
      )
    }

    if (!item?.sourceChunkId || !item.sourceDocumentId) return ''

    const pool = getMaterialQuestionPool(item.sourceDocumentId)
    const chunk = pool?.chunks.find(entry => entry.id === item.sourceChunkId)
    if (!chunk) return ''

    const heading = normalizeQuestionHeading(chunk.heading)
    if (!looksLikeAnswerBody(chunk.text)) return ''
    return formatMaterialReference(heading, chunk.text)
  })

  const activeQuestionInstruction = computed(() => {
    const thread = activeQuestionThread.value
    if (!thread) return ''

    if (isMaterialGroupMode.value) {
      const item = activePracticeGroupItem.value
      if (item?.title) return item.title
    }

    return resolveQuestionDisplayText(thread.prompt, thread.title)
  })

  const activeMaterialAnswerHint = computed(() => {
    if (!isMaterialGroupMode.value) return ''
    const item = activePracticeGroupItem.value
    if (!item) return ''
    return buildMaterialAnswerHint({
      title: item.title,
      questionType: item.questionType,
      difficulty: item.difficulty
    })
  })

  /** 本轮已提交后，从对话里的 AI 反馈摘出纠偏要点，供侧栏展示（不二次调模型） */
  const activeInterviewFeedbackHint = computed(() => {
    const threadId = activeQuestionThread.value?.id
    if (!threadId) return ''

    const hasUserAnswer = options.messages.value.some(
      item => item.threadId === threadId && item.role === 'user'
    )
    if (!hasUserAnswer) return ''

    const assistantMessage = [...options.messages.value]
      .filter(item => item.threadId === threadId && (item.role === 'assistant' || item.role === 'system'))
      .pop()
    if (!assistantMessage?.displayContent?.trim()) return ''

    return extractInterviewFeedbackHint(assistantMessage.displayContent)
  })

  const activeMockHintText = computed(() => {
    if (activeInterviewFeedbackHint.value) return activeInterviewFeedbackHint.value
    if (activeMaterialAnswerHint.value) return activeMaterialAnswerHint.value
    return primaryQuestion.value?.hint || currentGuide.value?.desc || ''
  })

  const activeMockHintLabel = computed(() => (
    activeInterviewFeedbackHint.value ? '本轮回馈' : '作答建议'
  ))

  const activeDocumentRequestContext = computed(() => {
    const coreDocument = activeTrainingDocumentCore.value
    if (!coreDocument) {
      return {
        summary: '',
        tags: [] as string[],
        excerpt: ''
      }
    }

    const materialItem = activePracticeGroupItem.value
    const materialChunkExcerpt = (() => {
      if (!materialItem?.sourceChunkId || !materialItem.sourceDocumentId) return ''
      const pool = getMaterialQuestionPool(materialItem.sourceDocumentId)
      const chunk = pool?.chunks.find(item => item.id === materialItem.sourceChunkId)
      return chunk?.text.slice(0, 400).replace(/\s+/g, ' ').trim() || ''
    })()

    return {
      summary: coreDocument.summary.trim(),
      tags: [...coreDocument.tags],
      excerpt: materialChunkExcerpt || coreDocument.rawText.slice(0, 320).replace(/\s+/g, ' ').trim()
    }
  })

  const activeQuestion = computed<InterviewQuestion | null>(() => {
    const activeThreadQuestionId = activeQuestionThread.value?.questionId
    if (!activeThreadQuestionId) return topicQuestions.value[0] || null
    return questionBank.find(item => item.id === activeThreadQuestionId)
      || topicQuestions.value.find(item => item.id === activeThreadQuestionId)
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
  const nextSequentialQuestionThread = computed(() => {
    const currentThread = activeQuestionThread.value
    if (!currentThread) return null
    const threads = isViewingHistoryPreview.value ? historyPreviewThreads.value : questionThreads.value
    return threads.find(item => item.sequence === currentThread.sequence + 1) || null
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
    const trainingModeLabel = isMaterialGroupMode.value
      ? '资料刷题'
      : currentMockEntryMode.value === 'practice'
        ? '专项刷题'
        : '模拟面试'
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
    const matchReasonLabelMap = {
      tag_match: '标签匹配',
      type_match: '类型兜底',
      topic_fallback: '主题保底'
    } as const
    const matchReason = activeQuestionMatchReason.value

    const practiceGroupItem = activePracticeGroupItem.value

    const isPracticeEntry = currentMockEntryMode.value === 'practice'

    return [
      `模式: ${ trainingModeLabel }`,
      ...(isPracticeEntry && currentPracticePlan.value?.weaknessTag
        ? [`专项: ${ currentPracticePlan.value.weaknessTag }`]
        : []),
      ...(!isPracticeEntry
        ? [`难度: ${ difficultyLabelMap[practiceConfig?.difficulty || question.difficulty] }`]
        : []),
      ...(isTrainingGroupMode.value && practiceGroupItem
        ? [`选题: ${ resolveGroupMatchReasonLabel(practiceGroupItem.matchReason) }`]
        : []),
      ...(isMaterialGroupMode.value && currentPracticeQuestionGroup.value?.documentSnapshot
        ? [`资料: ${ currentPracticeQuestionGroup.value.documentSnapshot.name }`]
        : []),
      ...(!isTrainingGroupMode.value && options.activeDocument.value ? [`命中: ${ matchReasonLabelMap[matchReason.type] }`] : []),
      ...(matchReason.matchedTags.length ? [`命中标签: ${ matchReason.matchedTags.join(' / ') }`] : []),
      ...(!isPracticeEntry && practiceConfig?.zone ? [`专项专区: ${ practiceZoneLabelMap[practiceConfig.zone] }`] : []),
      ...(!isPracticeEntry && practiceConfig?.questionType ? [`题型: ${ practiceQuestionTypeLabelMap[practiceConfig.questionType] }`] : []),
      ...(options.activeDocument.value && !isPracticeEntry ? [`资料: ${ options.activeDocument.value.name }`] : [])
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
    if (generatedThreadCount.value < questionThreads.value.length) return true
    return Boolean(nextSequentialQuestionThread.value)
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
    if (currentSessionId.value) {
      options.setActiveSessionId(currentSessionId.value)
    }
  }

  const restoreCurrentSessionMessages = () => {
    if (currentSessionId.value) {
      options.setActiveSessionId(currentSessionId.value)
    }
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

  const buildPracticeGroupQuestionThreads = (group: PersistedPracticeQuestionGroup): MockInterviewQuestionThread[] => {
    const total = group.items.length
    return group.items.map((item, index) => ({
      id: `${ item.questionId }-practice-thread-${ index }`,
      questionId: item.questionId,
      sequence: index + 1,
      title: `第 ${ index + 1 } / ${ total } 题 · ${ item.title }`,
      prompt: item.prompt,
      origin: 'primary' as const,
      order: index,
      createdAt: new Date().toISOString()
    }))
  }

  const resolveGroupMatchReasonLabel = (reason: PersistedPracticeQuestionGroup['items'][number]['matchReason']) => {
    if (typeof reason === 'string' && !(reason in practiceQuestionMatchReasonLabelMap)) {
      return reason
    }
    return practiceQuestionMatchReasonLabelMap[reason as keyof typeof practiceQuestionMatchReasonLabelMap] || String(reason)
  }

  const buildConfiguredQuestionThreads = (question: InterviewQuestion): MockInterviewQuestionThread[] => {
    const trainingGroup = currentPracticeQuestionGroup.value
    if (isTrainingGroupMode.value && trainingGroup?.items.length) {
      return buildPracticeGroupQuestionThreads(trainingGroup)
    }

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

  const resolvePracticeGroupVisibleCount = () => {
    const group = currentPracticeQuestionGroup.value
    if (!group?.items.length) return 1
    return Math.min(group.items.length, Math.max(1, group.currentIndex + 1))
  }

  const ensureInitialPracticeQuestion = () => {
    const currentThread = questionThreads.value[0]
    if (!currentPracticePlan.value || !currentThread) return
    const hasThreadMessages = options.messages.value.some(item => item.threadId === currentThread.id)
    if (hasThreadMessages) return
    options.setActiveThreadId(currentThread.id)
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
    generatedThreadCount.value = isTrainingGroupMode.value
      ? resolvePracticeGroupVisibleCount()
      : (nextThreads.length ? 1 : 0)
    if (!nextThreads.some(item => item.id === activeQuestionThreadId.value)) {
      activeQuestionThreadId.value = nextThreads[0]?.id || ''
    }
    if (activeQuestionThreadId.value) {
      options.setActiveThreadId(activeQuestionThreadId.value)
    }
    ensureInitialPracticeQuestion()
  }

  const selectQuestionThread = (threadId: string) => {
    const targetThread = questionThreads.value.find(item => item.id === threadId)
    if (!targetThread) return

    const canSelectThread = isTrainingGroupMode.value
      ? targetThread.order < generatedThreadCount.value
        || mockSubmittedQuestionIds.value.includes(threadId)
      : visibleQuestionThreads.value.some(item => item.id === threadId)

    if (!canSelectThread) return
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

  const resolvePracticeQuestionTypeFromWeakness = (weakness: string): PersistedPracticeQuestionType => {
    if (/追问|场景|项目|案例|沟通|表达/.test(weakness))
      return 'scenario'
    if (/代码|实现|语法|类型|泛型|响应式|性能/.test(weakness))
      return 'code'
    return 'concept'
  }

  const collectRoundQuestionTypes = (): PersistedPracticeQuestionType[] => {
    const group = currentPracticeQuestionGroup.value
    if (isTrainingGroupMode.value && group?.items.length) {
      return group.items
        .map(item => item.questionType)
        .filter((type): type is PersistedPracticeQuestionType => Boolean(type))
    }

    return questionThreads.value
      .map((thread) => {
        const questionId = thread.questionId
        if (!questionId) return undefined
        return questionBank.find(item => item.id === questionId)?.questionType
      })
      .filter((type): type is PersistedPracticeQuestionType => Boolean(type))
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

  const buildQuestionReviews = (): PersistedReportQuestionReviewItem[] => {
    const groupItems = currentPracticeQuestionGroup.value?.items || []
    const groupItemByQuestionId = new Map(
      groupItems.map(item => [item.questionId, item])
    )

    return questionThreads.value.map((thread) => {
      const questionId = thread.questionId || thread.id
      const groupItem = groupItemByQuestionId.get(questionId)
        || groupItems[thread.order]
        || groupItems.find(item => item.order === thread.order)
      const userAnswer = formatReportThreadUserAnswer(options.messages.value, thread.id)
      const aiFeedback = formatReportThreadLatestAiFeedback(options.messages.value, thread.id)
      const hasUserAnswer = Boolean(userAnswer)

      const referenceAnswer = resolveReportQuestionReferenceAnswer(
        groupItem,
        options.messages.value,
        thread.id
      )

      return {
        questionId,
        questionTitle: resolveQuestionDisplayText(thread.prompt, thread.title) || groupItem?.title || thread.title,
        userAnswer: hasUserAnswer ? userAnswer : '未作答',
        referenceAnswer: referenceAnswer || undefined,
        aiFeedback: hasUserAnswer ? (aiFeedback || undefined) : undefined
      }
    })
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
    const questionAnswerSnapshot = questionThreads.value.map((thread) => {
      const answerText = normalizeSnippet(
        formatReportThreadUserAnswer(options.messages.value, thread.id),
        120
      )
      return `${ thread.title }: ${ answerText || '未作答' }`
    })
    const summaryHeadline = `围绕 ${ sourceLabel } 的 ${ topicLabel } 训练已形成阶段性结果`
    const summaryBody = [
      `本轮共 ${ totalCount.value } 题，已完成 ${ answeredSummary }。`,
      latestAnswer
        ? `最近一次作答摘录为“${ normalizeSnippet(latestAnswer, 90) }”，当前最明显的短板是“${ primaryWeakness }”。`
        : `本轮已经浏览完题目，但还有未作答内容，当前最明显的短板先记为“${ primaryWeakness }”。`
    ].join('')
    const suggestedFocus = [
      answerLength < 80 ? '下一轮回答尽量按“结论 -> 拆分 -> 结果”三段式展开，避免答案过短。' : '',
      latestFeedback ? `优先处理最近一次反馈暴露的问题：${ normalizeSnippet(latestFeedback, 72) }` : '',
      sourceDocumentName ? `下一轮继续围绕《${ sourceDocumentName }》补练，把资料上下文真正转成可表达内容。` : '',
      answeredCount.value < totalCount.value ? '未作答题已在逐题复盘中附上参考答案，可先复盘再决定是否专项补练。' : ''
    ].filter(Boolean)
    const practiceQuestionType = resolveDominantPracticeQuestionType(
      collectRoundQuestionTypes(),
      resolvePracticeQuestionTypeFromWeakness(primaryWeakness)
    )
    const sourceDocumentId = options.activeDocument.value?.id || ''
    const sourceDocumentExcerpt = sourceDocumentId && isMaterialGroupMode.value
      ? buildMaterialPracticeExcerpt(
        sourceDocumentId,
        currentPracticeQuestionGroup.value?.items || [],
        { fallbackRawText: options.activeDocument.value?.rawText }
      )
      : ''
    const practiceDifficulty = resolvePracticeDifficulty(answerLength, mockWeaknessSignals.value.length)
    const weaknessFocusAreas = resolvePracticeFocusAreas(latestAnswer, latestFeedback, primaryWeakness)
    const focusArea = weaknessFocusAreas[0]
    const focusAreaText = focusArea ? practiceFocusAreaLabelMap[focusArea] : '当前弱项'

    return {
      id: `report-${ currentSessionId.value }`,
      sessionId: currentSessionId.value,
      topic: activeTopicKey.value,
      source: currentSourceKey.value,
      sourceDocumentId,
      sourceDocumentName,
      sourceDocumentExcerpt: sourceDocumentExcerpt || undefined,
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
      questionReviews: buildQuestionReviews(),
      suggestedFocus,
      practicePlan: {
        weaknessTag: primaryWeakness,
        focusArea,
        zone: practiceZoneByTopic[activeTopicKey.value] || 'vue',
        questionType: practiceQuestionType,
        // questionCount 仅作报告推荐题数；专项页组卷题数以用户选择为准
        questionCount: mockWeaknessSignals.value.length >= 3 ? 15 : answerLength < 80 ? 5 : 10,
        difficulty: practiceDifficulty,
        reason: sourceDocumentName
          ? `基于《${ sourceDocumentName }》这轮训练暴露的“${ focusAreaText } / ${ primaryWeakness }”生成定向补练建议（推荐题数见下，与专项页实际组卷题数可不同）。`
          : `基于当前 ${ topicLabel } 训练暴露的“${ focusAreaText } / ${ primaryWeakness }”生成定向补练建议（推荐题数见下，与专项页实际组卷题数可不同）。`
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
      questionThreadsSnapshot: (status === 'completed' ? questionThreads.value : visibleQuestionThreads.value).map(thread => ({
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
      const restoredGeneratedCount = isTrainingGroupMode.value
        ? resolvePracticeGroupVisibleCount()
        : Math.min(
          questionThreads.value.length,
          Math.max(1, submittedQuestionIds.length + 1)
        )

      if (isTrainingGroupMode.value && currentPracticeQuestionGroup.value) {
        const nextIndex = Math.min(
          currentPracticeQuestionGroup.value.items.length - 1,
          Math.max(currentPracticeQuestionGroup.value.currentIndex, submittedQuestionIds.length)
        )
        if (nextIndex !== currentPracticeQuestionGroup.value.currentIndex) {
          persistPracticeQuestionGroup({
            currentIndex: nextIndex,
            status: 'in_progress'
          })
        } else if (currentPracticeQuestionGroup.value.status === 'pending') {
          persistPracticeQuestionGroup({ status: 'in_progress' })
        }
      }

      currentSessionId.value = matchedSession.id
      restoreCurrentSessionMessages()
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
      restoreCurrentSessionMessages()
      mockFollowUpIndex.value = 0
      mockSubmittedQuestionIds.value = []
      mockWeaknessSignals.value = []
      generatedThreadCount.value = isTrainingGroupMode.value
        ? resolvePracticeGroupVisibleCount()
        : (questionThreads.value.length ? 1 : 0)

      if (isTrainingGroupMode.value && currentPracticeQuestionGroup.value?.status === 'pending') {
        persistPracticeQuestionGroup({ status: 'in_progress' })
      }

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
      practiceQuestionGroup: currentPracticeQuestionGroup.value,
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

    const threadMessages = options.messages.value.filter(
      item => item.threadId === thread.id && (item.role === 'user' || item.role === 'assistant')
    )
    const priorUserTurnCount = threadMessages.filter(item => item.role === 'user').length
    const lastAssistantMessage = [...threadMessages]
      .reverse()
      .find(item => item.role === 'assistant' || item.role === 'system')
    const followUpPrompt = lastAssistantMessage?.displayContent
      ? extractLatestInterviewerPrompt(lastAssistantMessage.displayContent)
      : ''
    const baseQuestionPrompt = activeQuestionInstruction.value || thread.prompt
    const streamQuestionPrompt = priorUserTurnCount > 0 && followUpPrompt
      ? followUpPrompt
      : baseQuestionPrompt

    const priorUserAnswers = threadMessages
      .filter(item => item.role === 'user')
      .map(item => item.displayContent || item.content || '')
    const unknownAnswerStreak = countTrailingUnknownAnswers([...priorUserAnswers, answer])
    const forceRevealReferenceAnswer = unknownAnswerStreak >= 2 || isReferenceAnswerRequest(answer)
    const referenceAnswerHint = resolveReportReferenceAnswer(activePracticeGroupItem.value)
      || activeQuestionReference.value
      || undefined

    options.setActiveThreadId(thread.id)
    options.appendUserMessage(answer, thread.id)
    options.startStream({
      sessionId: currentSessionId.value,
      threadId: thread.id,
      modelId: options.selectedModelId?.value || undefined,
      topic: activeTopicKey.value,
      prompt: [
        streamQuestionPrompt,
        priorUserTurnCount > 0 ? `【原题】${ baseQuestionPrompt }` : '',
        activeQuestionReference.value,
        currentPracticePlan.value
          ? `专项训练要求：围绕“${ currentPracticePlan.value.weaknessTag }”进行 ${ currentPracticePlan.value.difficulty } 难度 ${ currentPracticePlan.value.questionType } 强化。`
          : '',
        activeDocumentContext.value,
        answer
      ].filter(Boolean).join('\n\n'),
      topicLabel: topicLabelMap[activeTopicKey.value] || 'Vue 3',
      questionTitle: thread.title,
      questionPrompt: streamQuestionPrompt,
      answer,
      sourceContext: activeDocumentContext.value,
      sourceDocumentName: options.activeDocument.value?.name,
      sourceDocumentSummary: activeDocumentRequestContext.value.summary,
      sourceDocumentTags: activeDocumentRequestContext.value.tags,
      sourceDocumentExcerpt: activeDocumentRequestContext.value.excerpt,
      feedbackStyle: currentFeedbackStyle.value,
      format: 'markdown',
      questionIndex: currentQuestionPosition.value || undefined,
      questionCount: totalCount.value || undefined,
      unknownAnswerStreak,
      forceRevealReferenceAnswer,
      referenceAnswerHint
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
      if (isTrainingGroupMode.value && currentPracticeQuestionGroup.value) {
        const nextIndex = Math.min(
          currentPracticeQuestionGroup.value.items.length - 1,
          generatedThreadCount.value - 1
        )
        persistPracticeQuestionGroup({
          currentIndex: nextIndex,
          status: 'in_progress'
        })
      }
      persistMockSession()
      return
    }

    const sequentialThread = nextSequentialQuestionThread.value
    if (sequentialThread && sequentialThread.id !== currentThread?.id) {
      activeQuestionThreadId.value = sequentialThread.id
      mockFollowUpIndex.value = Math.max(0, sequentialThread.order - 1)
      options.setActiveThreadId(sequentialThread.id)
      persistMockSession()
    }
  }

  const finishMockSession = async () => {
    if (!currentSessionId.value) return null

    persistMockSession('completed')

    const localSummary = buildReportSummary()
    if (!localSummary) return null

    let summary = localSummary

    if (isInterviewReportApiAvailable()) {
      try {
        const generated = await generateRemoteInterviewReport({
          sessionId: currentSessionId.value,
          modelId: options.selectedModelId?.value || undefined,
          topic: activeTopicKey.value,
          source: currentSourceKey.value,
          sourceDocumentId: options.activeDocument.value?.id || '',
          sourceDocumentName: options.activeDocument.value?.name || '',
          sourceDocumentExcerpt: localSummary.sourceDocumentExcerpt,
          answeredCount: answeredCount.value,
          totalCount: totalCount.value,
          summaryBody: localSummary.summaryBody,
          weaknessTags: [...mockWeaknessSignals.value],
          weaknessFocusAreas: localSummary.weaknessFocusAreas,
          primaryWeakness: mockWeaknessSignals.value[0] || localSummary.primaryWeakness,
          questionReviews: localSummary.questionReviews,
          suggestedFocus: localSummary.suggestedFocus
        })
        if (!generated.aiUsed && generated.fallbackReason) {
          console.warn('[mock-interview-space] AI report fallback:', generated.fallbackReason)
        }
        summary = {
          ...generated.report,
          practicePlan: localSummary.practicePlan || generated.report.practicePlan,
          questionReviews: localSummary.questionReviews?.length
            ? localSummary.questionReviews
            : generated.report.questionReviews,
          sourceDocumentExcerpt: localSummary.sourceDocumentExcerpt || generated.report.sourceDocumentExcerpt,
          weaknessFocusAreas: localSummary.weaknessFocusAreas?.length
            ? localSummary.weaknessFocusAreas
            : generated.report.weaknessFocusAreas
        }
      } catch (error) {
        console.warn('[mock-interview-space] report generate fallback to local summary:', error)
      }
    }

    return {
      sessionId: currentSessionId.value,
      summary: saveReportSummary(summary),
      replayConfig: {
        ...currentReplayConfig.value,
        activeDocumentId: options.activeDocument.value?.id || currentReplayConfig.value.activeDocumentId || ''
      }
    } satisfies FinishMockRoundResult
  }

  const finalizeFinishedMockSession = () => {
    const context = loadWorkbenchContext()
    const completedGroup = context?.practiceQuestionGroup
      ? {
        ...context.practiceQuestionGroup,
        status: 'completed' as const,
        updatedAt: new Date().toISOString()
      }
      : null

    resetMockRoundState()
    saveWorkbenchContext({
      activeTopic: activeTopicKey.value,
      activeDocumentId: '',
      currentMode: activeMode.value,
      sourcePage: 'report',
      practicePlan: null,
      practiceQuestionGroup: completedGroup,
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

  const openHistoryPreviewBySession = (sessionId: string) => {
    const targetSession = getInterviewSessionById(sessionId)

    if (!targetSession?.questionThreadsSnapshot?.length || targetSession.status !== 'completed') {
      return false
    }

    historyPreviewSessionId.value = targetSession.id
    historyPreviewThreads.value = targetSession.questionThreadsSnapshot.map((thread, index) => ({
      id: thread.id,
      questionId: thread.questionId,
      order: thread.order,
      sequence: thread.sequence,
      title: thread.title,
      prompt: thread.prompt,
      origin: thread.origin || (index === 0 ? 'primary' : 'followup'),
      createdAt: thread.createdAt || targetSession.startedAt
    }))
    historyPreviewMessages.value = [...(targetSession.messagesSnapshot || [])]
    historyPreviewSubmittedQuestionIds.value = [...targetSession.submittedQuestionIds]
    historyPreviewActiveThreadId.value = targetSession.activeQuestionThreadId
      || targetSession.questionThreadsSnapshot[0]?.id
      || ''
    options.setActiveThreadId(historyPreviewActiveThreadId.value)
    return true
  }

  const openHistoryPreviewBySessionAndThread = (sessionId: string, threadId?: string) => {
    const opened = openHistoryPreviewBySession(sessionId)
    if (!opened) return false

    const normalizedThreadId = threadId?.trim() || ''
    if (!normalizedThreadId) return true

    const matchedThread = historyPreviewThreads.value.find(item => item.id === normalizedThreadId)
    if (!matchedThread) return true

    historyPreviewActiveThreadId.value = matchedThread.id
    options.setActiveThreadId(matchedThread.id)
    return true
  }

  const openLatestHistoryPreview = () => {
    const latestCompletedSession = resolveLatestRestorableSession()

    if (!latestCompletedSession?.id) return false
    return openHistoryPreviewBySession(latestCompletedSession.id)
  }

  const exitHistoryPreview = () => {
    if (!historyPreviewSessionId.value) return
    clearHistoryPreview()
    if (activeQuestionThreadId.value) {
      options.setActiveThreadId(activeQuestionThreadId.value)
    }
  }

  const resolveLatestPersistedReportSummary = () => {
    return [...loadReportSummaries()].sort((prev, next) => {
      return new Date(next.createdAt).getTime() - new Date(prev.createdAt).getTime()
    })[0] || null
  }

  const clearMockHistory = async () => {
    await clearRemoteInterviewHistory()

    const context = loadWorkbenchContext()
    loadInterviewSessions().forEach((session) => {
      removeInterviewSession(session.id)
    })

    resetMockRoundState()

    saveWorkbenchContext({
      activeTopic: activeTopicKey.value,
      activeDocumentId: '',
      currentMode: activeMode.value,
      sourcePage: context?.sourcePage || 'mock-interview-space',
      practicePlan: null,
      practiceQuestionGroup: null,
      mockEntryMode: 'direct',
      mockSessionConfig: null
    })
  }

  const updateFeedbackStyle = (feedbackStyle: PersistedInterviewFeedbackStyle) => {
    const context = loadWorkbenchContext()
    saveWorkbenchContext({
      activeTopic: context?.activeTopic || activeTopicKey.value,
      activeDocumentId: context?.activeDocumentId || options.activeDocument.value?.id || '',
      currentMode: context?.currentMode || activeMode.value,
      sourcePage: context?.sourcePage || 'mock-interview-space',
      practicePlan: context?.practicePlan || currentPracticePlan.value || null,
      mockEntryMode: context?.mockEntryMode || currentMockEntryMode.value,
      mockSessionConfig: {
        ...(currentMockSessionConfig.value || {
          entryMode: currentMockEntryMode.value,
          activeDocumentId: options.activeDocument.value?.id || ''
        }),
        feedbackStyle
      }
    })
  }

  watch(
    () => `${ primaryQuestion.value?.id || '' }:${ options.activeDocument.value?.id || '' }:${ currentPracticePlan.value?.weaknessTag || '' }:${ currentPracticeQuestionGroup.value?.id || '' }:${ currentPracticeQuestionGroup.value?.currentIndex ?? '' }:${ currentSessionConfigKey.value }`,
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

  watch(
    () => [
      options.mockSessionIdOverride?.value || '',
      options.mockThreadIdOverride?.value || ''
    ] as const,
    ([sessionId, threadId]) => {
      const normalizedSessionId = sessionId.trim()
      if (!normalizedSessionId) return

      const normalizedThreadId = threadId.trim()
      if (
        historyPreviewSessionId.value === normalizedSessionId
        && (!normalizedThreadId || historyPreviewActiveThreadId.value === normalizedThreadId)
      ) {
        return
      }

      openHistoryPreviewBySessionAndThread(normalizedSessionId, normalizedThreadId)
    },
    {
      immediate: true
    }
  )

  return {
    activeTopicKey,
    answeredCount,
    currentGuide,
    currentFeedbackStyle,
    currentQuestionPosition,
    currentMockFollowUp,
    currentPracticePlan,
    currentPracticeQuestionGroup,
    isPracticeGroupMode,
    isMaterialGroupMode,
    isTrainingGroupMode,
    activePracticeGroupItem,
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
    allQuestionThreads: questionThreads,
    generatedThreadCount,
    activeQuestionThread,
    activeQuestionInstruction,
    activeInterviewFeedbackHint,
    activeMaterialAnswerHint,
    activeMockHintLabel,
    activeMockHintText,
    activeQuestionReference,
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
    historyPreviewActiveThreadId,
    openHistoryPreviewBySession,
    openHistoryPreviewBySessionAndThread,
    openLatestHistoryPreview,
    rotateMockFollowUp,
    selectQuestionThread,
    submitMockAnswer,
    updateFeedbackStyle,
    totalCount
  }
}

import type {
  PersistedInterviewMode,
  PersistedInterviewSession,
  PersistedLibraryDocument,
  PersistedReportSummary,
  PersistedTopicKey
} from '@/types/workbench'
import { useWorkbenchPersistence } from '@/composables/useWorkbenchPersistence'
import { documentList as seedDocuments } from '@/views/workbench/library.data'
import { quickTopics } from '@/views/workbench/overview.data'

const topicLabelMap = quickTopics.reduce<Record<string, string>>((map, topic) => {
  map[topic.key] = topic.label
  return map
}, {})

const modeLabelMap: Record<PersistedInterviewMode, string> = {
  standard: '标准模拟',
  guided: '引导模式'
}

const sourceLabelMap: Record<string, string> = {
  overview: '总览页训练入口',
  'hero-import': '总览页导入入口',
  'library-frontend-notes': '前端八股总纲',
  'library-project-review': '项目复盘沉淀',
  'library-follow-up-questions': '高频追问清单',
  'queue-vue-reactivity': 'Vue 响应式专项',
  'queue-ts-generics': 'TypeScript 泛型专项',
  'queue-performance-project': '性能优化专项',
  library: '资料库上下文'
}

const railLabels = [
  {
    key: 'overview',
    label: '总览'
  },
  {
    key: 'mock',
    label: '模拟面试'
  },
  {
    key: 'strategy',
    label: '答题策略'
  },
  {
    key: 'feedback',
    label: '反馈'
  },
  {
    key: 'result',
    label: '结果'
  }
] as const

export const useOverviewLaunchState = () => {
  const {
    loadLibraryDocuments,
    loadWorkbenchContext,
    loadInterviewSessions,
    loadReportSummaries,
    saveWorkbenchContext
  } = useWorkbenchPersistence()

  const persistedContext = computed(() => loadWorkbenchContext())
  const allDocuments = ref<PersistedLibraryDocument[]>(loadLibraryDocuments(seedDocuments))
  const activeTopic = ref<PersistedTopicKey>((persistedContext.value?.activeTopic || quickTopics[0].key) as PersistedTopicKey)

  const allSessions = computed(() => {
    return [...loadInterviewSessions()].sort((prev, next) => {
      const prevTime = new Date(prev.finishedAt || prev.startedAt).getTime()
      const nextTime = new Date(next.finishedAt || next.startedAt).getTime()
      return nextTime - prevTime
    })
  })

  const allSummaries = computed(() => {
    return [...loadReportSummaries()].sort((prev, next) => {
      return new Date(next.createdAt).getTime() - new Date(prev.createdAt).getTime()
    })
  })

  const activeDocument = computed(() => {
    const currentId = persistedContext.value?.activeDocumentId
    const exact = allDocuments.value.find(item => item.id === currentId)
    if (exact) return exact
    return allDocuments.value.find(item => item.topicKeys.includes(activeTopic.value)) || allDocuments.value[0] || null
  })

  const inProgressSession = computed<PersistedInterviewSession | null>(() => {
    return allSessions.value.find(item => item.status === 'in_progress' && item.topic === activeTopic.value)
      || allSessions.value.find(item => item.status === 'in_progress')
      || null
  })

  const latestCompletedSession = computed<PersistedInterviewSession | null>(() => {
    return allSessions.value.find(item => item.status === 'completed' && item.topic === activeTopic.value)
      || allSessions.value.find(item => item.status === 'completed')
      || null
  })

  const latestReportSummary = computed<PersistedReportSummary | null>(() => {
    const activeSessionId = latestCompletedSession.value?.id
    if (activeSessionId) {
      const matched = allSummaries.value.find(item => item.sessionId === activeSessionId)
      if (matched) return matched
    }
    return allSummaries.value.find(item => item.topic === activeTopic.value) || allSummaries.value[0] || null
  })

  const currentMode = computed<PersistedInterviewMode>(() => {
    return inProgressSession.value?.mode
      || persistedContext.value?.currentMode
      || latestCompletedSession.value?.mode
      || 'standard'
  })

  const currentModeLabel = computed(() => modeLabelMap[currentMode.value] || '标准模拟')
  const currentTopicLabel = computed(() => topicLabelMap[activeTopic.value] || '当前主题训练')

  const currentSourceKey = computed(() => {
    return inProgressSession.value?.source
      || latestReportSummary.value?.source
      || activeDocument.value?.sourceKey
      || persistedContext.value?.sourcePage
      || 'overview'
  })

  const currentSourceLabel = computed(() => {
    return activeDocument.value?.name || sourceLabelMap[currentSourceKey.value] || currentSourceKey.value
  })

  const progressSession = computed(() => inProgressSession.value || latestCompletedSession.value)

  const progressPercent = computed(() => {
    const session = progressSession.value
    if (!session || !session.questionCount) return 0
    return Math.max(0, Math.min(100, Math.round((session.answeredCount / session.questionCount) * 100)))
  })

  const progressText = computed(() => {
    const session = progressSession.value
    if (!session) return '还没有开始训练'
    return `${ session.answeredCount } / ${ session.questionCount } 题`
  })

  const statusLabel = computed(() => {
    const session = inProgressSession.value
    if (!session) return '当前还没有未完成 session，可直接开始本轮模拟'
    return `当前已答 ${ session.answeredCount } / ${ session.questionCount } 题`
  })

  const latestWeaknessTags = computed(() => {
    return latestReportSummary.value?.weaknessTags
      || latestCompletedSession.value?.weaknessTags
      || inProgressSession.value?.weaknessTags
      || []
  })

  const latestSummaryText = computed(() => {
    if (inProgressSession.value) {
      return `当前训练正在进行，已完成 ${ inProgressSession.value.answeredCount } 题，继续即可回到上次位置。`
    }

    if (latestReportSummary.value) {
      return `最近一轮训练完成了 ${ latestReportSummary.value.answeredCount } 题，已生成复盘摘要。`
    }

    return '还没有形成完整训练记录，先开始一轮模拟面试。'
  })

  const primaryActionLabel = computed(() => {
    return inProgressSession.value ? '继续面试' : '开始本轮模拟'
  })

  const summaryItems = computed(() => [
    {
      label: '当前模式',
      value: currentModeLabel.value,
      note: inProgressSession.value ? '会优先承接未完成训练的当前模式' : '没有未完成 session 时将按当前主题启动'
    },
    {
      label: '资料来源',
      value: currentSourceLabel.value,
      note: activeDocument.value ? '总览页会优先承接当前主题下的核心资料' : '当前还没有稳定的资料上下文'
    },
    {
      label: '最近弱项',
      value: latestWeaknessTags.value[0] || '尚未形成稳定弱项',
      note: latestWeaknessTags.value.slice(1, 3).join(' / ') || '继续训练后会逐步收敛'
    }
  ])

  const railSteps = computed(() => {
    const currentIndex = inProgressSession.value
      ? 1
      : latestReportSummary.value
        ? 4
        : 0

    return railLabels.map((step, index) => ({
      ...step,
      active: currentIndex === index,
      done: currentIndex > index
    }))
  })

  const mockInterviewQuery = computed(() => {
    const session = inProgressSession.value
    return {
      topic: session?.topic || activeTopic.value,
      mode: session?.mode || currentMode.value,
      source: session?.source || currentSourceKey.value,
      ...(session?.id ? {
        sessionId: session.id
      } : {})
    }
  })

  const libraryQuery = computed(() => ({
    topic: activeTopic.value,
    mode: currentMode.value,
    source: activeDocument.value?.sourceKey || currentSourceKey.value
  }))

  const reportQuery = computed(() => {
    if (latestCompletedSession.value?.id) {
      return {
        sessionId: latestCompletedSession.value.id,
        topic: activeTopic.value,
        mode: latestCompletedSession.value.mode,
        source: latestCompletedSession.value.source
      }
    }

    return {
      from: 'overview',
      topic: activeTopic.value,
      mode: currentMode.value,
      source: currentSourceKey.value
    }
  })

  const setActiveTopic = (topic: PersistedTopicKey) => {
    activeTopic.value = topic

    const nextDoc = allDocuments.value.find(item => item.topicKeys.includes(activeTopic.value)) || activeDocument.value
    persistedContext.value = saveWorkbenchContext({
      activeTopic: activeTopic.value,
      activeDocumentId: nextDoc?.id || persistedContext.value?.activeDocumentId || '',
      currentMode: currentMode.value,
      sourcePage: 'overview'
    })
  }

  watch(() => persistedContext.value?.updatedAt, () => {
    allDocuments.value = loadLibraryDocuments(seedDocuments)

    if (persistedContext.value?.activeTopic) {
      activeTopic.value = persistedContext.value.activeTopic
    }
  }, {
    immediate: true
  })

  return {
    activeTopic,
    activeDocument,
    currentMode,
    currentModeLabel,
    currentSourceKey,
    currentSourceLabel,
    currentTopicLabel,
    inProgressSession,
    latestCompletedSession,
    latestReportSummary,
    progressPercent,
    progressText,
    statusLabel,
    latestWeaknessTags,
    latestSummaryText,
    primaryActionLabel,
    summaryItems,
    railSteps,
    mockInterviewQuery,
    libraryQuery,
    reportQuery,
    setActiveTopic,
    topicLabelMap
  }
}

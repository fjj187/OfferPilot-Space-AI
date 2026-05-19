import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import type {
  PersistedInterviewSession,
  PersistedPracticeFocusArea,
  PersistedReportSummary
} from '@/types/workbench'

interface ReportSourceDocument {
  id?: string
  name?: string
  type?: string
}

interface UseMockInterviewSpaceReportSceneOptions {
  activeDocument: ComputedRef<ReportSourceDocument | null>
  currentModeLabel: ComputedRef<string>
  currentSourceLabel: ComputedRef<string>
  currentTopicLabel: ComputedRef<string>
  inProgressSession: ComputedRef<PersistedInterviewSession | null>
  latestCompletedSession: ComputedRef<PersistedInterviewSession | null>
  latestReportSummary: ComputedRef<PersistedReportSummary | null>
  getReportSummaryBySessionId: (sessionId: string) => PersistedReportSummary | undefined
  loadReportSummaries: () => PersistedReportSummary[]
}

export function useMockInterviewSpaceReportScene(options: UseMockInterviewSpaceReportSceneOptions) {
  const focusAreaLabelMap: Record<PersistedPracticeFocusArea, string> = {
    structure: '结构表达',
    case_detail: '案例细节',
    result_metric: '结果指标',
    principle_depth: '原理追问'
  }

  const reportSceneSession = computed<PersistedInterviewSession | null>(() => {
    return options.latestCompletedSession.value || options.inProgressSession.value || null
  })

  const reportSceneSummary = computed<PersistedReportSummary | null>(() => {
    const sessionId = reportSceneSession.value?.id
    if (sessionId) {
      return options.getReportSummaryBySessionId(sessionId) || null
    }
    return options.latestReportSummary.value || null
  })

  const reportSceneStatusText = computed(() => {
    const status = reportSceneSession.value?.status
    if (status === 'completed') return '已完成'
    if (status === 'in_progress') return '进行中'
    if (status === 'aborted') return '已中断'
    return reportSceneSummary.value ? '已生成摘要' : '暂无报告'
  })

  const reportAnsweredCount = computed(() => {
    return reportSceneSession.value?.answeredCount ?? reportSceneSummary.value?.answeredCount ?? 0
  })

  const reportTotalCount = computed(() => {
    return reportSceneSession.value?.questionCount ?? reportSceneSummary.value?.totalCount ?? 0
  })

  const reportCompletionPercent = computed(() => {
    if (!reportTotalCount.value) return 0
    return Math.max(0, Math.min(100, Math.round((reportAnsweredCount.value / reportTotalCount.value) * 100)))
  })

  const reportWeaknessTags = computed(() => {
    return reportSceneSummary.value?.weaknessTags || reportSceneSession.value?.weaknessTags || []
  })

  const reportPrimaryWeakness = computed(() => {
    return reportSceneSummary.value?.primaryWeakness || reportWeaknessTags.value[0] || '当前还没有稳定弱项'
  })

  const reportFocusAreas = computed(() => {
    return (reportSceneSummary.value?.weaknessFocusAreas || []).map(item => focusAreaLabelMap[item] || item)
  })

  const reportSourceDocument = computed(() => {
    if (reportSceneSummary.value?.sourceDocumentName) {
      return {
        id: reportSceneSummary.value.sourceDocumentId,
        name: reportSceneSummary.value.sourceDocumentName,
        type: reportSceneSession.value?.docType || options.activeDocument.value?.type
      }
    }

    if (
      reportSceneSession.value?.sourceDocumentId &&
      options.activeDocument.value?.id === reportSceneSession.value.sourceDocumentId
    ) {
      return options.activeDocument.value
    }
    return options.activeDocument.value
  })

  const reportSourceDocumentLabel = computed(() => {
    const name = reportSourceDocument.value?.name
    const type = reportSourceDocument.value?.type?.toUpperCase()
    if (name && type) return `${ name } (${ type })`
    if (name) return name
    return options.currentSourceLabel.value
  })

  const reportStartedAtText = computed(() => reportSceneSession.value?.startedAt || '当前还没有训练开始记录')
  const reportFinishedAtText = computed(() => reportSceneSession.value?.finishedAt || '本轮尚未结束，仍可继续回到面试区')

  const reportHeaderMeta = computed(() => [
    `主题: ${ options.currentTopicLabel.value }`,
    `模式: ${ reportSceneSession.value?.mode ? options.currentModeLabel.value : '标准模拟' }`,
    `来源资料: ${ reportSourceDocumentLabel.value }`
  ])

  const reportSummaryHeadline = computed(() => {
    return reportSceneSummary.value?.summaryHeadline || '当前先按最近训练结果生成阶段性复盘'
  })

  const reportSummaryBody = computed(() => {
    return reportSceneSummary.value?.summaryBody || '当前还没有独立摘要文案，先使用最近一轮训练 session 结果组织复盘。'
  })

  const reportAnswerSnapshot = computed(() => {
    return reportSceneSummary.value?.answerSnapshot || []
  })

  const reportOverviewStats = computed(() => [
    {
      label: '已答题数',
      value: `${ reportAnsweredCount.value } / ${ reportTotalCount.value || '--' }`,
      note: reportTotalCount.value ? '当前轮次完成情况' : '等待形成完整题量'
    },
    {
      label: '完成度',
      value: `${ reportCompletionPercent.value }%`,
      note: reportCompletionPercent.value >= 100 ? '本轮已完成' : '仍可继续补完整轮次'
    },
    {
      label: '弱项标签',
      value: `${ reportWeaknessTags.value.length } 个`,
      note: reportFocusAreas.value[0] ? `${ reportFocusAreas.value[0] } · ${ reportPrimaryWeakness.value }` : reportPrimaryWeakness.value
    },
    {
      label: '报告状态',
      value: reportSceneStatusText.value,
      note: reportSceneSummary.value ? '已承接真实报告摘要' : '当前使用 session 结果生成摘要'
    }
  ])

  const reportSnapshotItems = computed(() => [
    {
      label: '当前报告对象',
      value: reportSceneSession.value?.id || reportSceneSummary.value?.sessionId || '最近可查看结果'
    },
    {
      label: '训练来源',
      value: reportSourceDocumentLabel.value
    },
    {
      label: '开始时间',
      value: reportStartedAtText.value
    },
    {
      label: '结束时间',
      value: reportFinishedAtText.value
    }
  ])

  const reportSuggestionList = computed(() => {
    const list: string[] = [...(reportSceneSummary.value?.suggestedFocus || [])]
    const session = reportSceneSession.value
    const summary = reportSceneSummary.value

    if (session && session.answeredCount < session.questionCount) {
      list.push('本轮训练还没有答完整，建议先回到模拟面试，把剩余题目补完后再看完整复盘。')
    }

    if (reportWeaknessTags.value.length >= 3) {
      list.push(`当前弱项集中在“${ reportPrimaryWeakness.value }”等标签，建议优先去专项刷题收敛这组问题。`)
    }

    if (reportFocusAreas.value.includes('结构表达')) {
      list.push('下一轮优先按“结论 -> 拆分 -> 结果”三段作答，先把答案结构立起来。')
    }

    if (reportFocusAreas.value.includes('案例细节')) {
      list.push('补练时要强制带上真实项目场景、约束条件、取舍过程，不要只讲抽象方案。')
    }

    if (reportFocusAreas.value.includes('结果指标')) {
      list.push('回答里要补上线结果、收益指标或验证方式，让答案从“做了什么”升级到“做成了什么”。')
    }

    if (reportFocusAreas.value.includes('原理追问')) {
      list.push('专项补练时优先准备“为什么这么设计”的解释，防止一追问就掉到实现细节之外。')
    }

    if ((summary?.source || session?.source) === 'library' || reportSourceDocument.value) {
      list.push('这轮结果明显受当前资料上下文影响，建议回资料库补强同主题文档，再进行下一轮训练。')
    }

    if (session?.mode === 'guided') {
      list.push('当前是引导模式结果，下一轮可以切回标准模拟，验证是否能独立输出完整答案。')
    }

    if (!list.length) {
      list.push('当前已有基础结果，可以继续下一轮模拟面试，让复盘信号更稳定。')
    }

    return [...new Set(list)].slice(0, 4)
  })

  const reportRecentSummaries = computed(() => {
    return [...options.loadReportSummaries()]
      .sort((prev, next) => new Date(next.createdAt).getTime() - new Date(prev.createdAt).getTime())
      .slice(0, 3)
  })

  const reportLatestHistory = computed(() => reportRecentSummaries.value[0] || null)

  return {
    reportAnswerSnapshot,
    reportHeaderMeta,
    reportLatestHistory,
    reportOverviewStats,
    reportFocusAreas,
    reportPrimaryWeakness,
    reportSceneSession,
    reportSceneSummary,
    reportSnapshotItems,
    reportSummaryBody,
    reportSummaryHeadline,
    reportSuggestionList,
    reportWeaknessTags
  }
}

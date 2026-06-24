import { getStoredInterviewSessionsBySessionId } from '../storage/interview-session-store.js'
import {
  getStoredInterviewReportBySessionId,
  getStoredInterviewReports,
  getStoredInterviewReportsByOwner,
  upsertStoredInterviewReport
} from '../storage/interview-report-store.js'
import type {
  GenerateInterviewReportRequest,
  GenerateInterviewReportResponse,
  InterviewReportListItem,
  StoredInterviewReportSummary
} from '../types/report.js'
import { buildReportLlmMessages } from '../utils/build-report-llm-messages.js'
import { completeRemoteLlmJson, isRemoteLlmConfigured } from '../utils/complete-remote-llm-json.js'
import { parseReportLlmJson } from '../utils/parse-report-llm-json.js'

const topicLabelMap: Record<string, string> = {
  vue3: 'Vue 3',
  typescript: 'TypeScript',
  engineering: '工程化',
  browser: '浏览器',
  performance: '性能优化',
  scenario: '场景题'
}

const normalizeSnippet = (content: string, maxLength = 88) => {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  return normalized.length > maxLength ? `${ normalized.slice(0, maxLength) }...` : normalized
}

const resolvePracticeQuestionType = (weakness: string) => {
  if (/追问|场景|项目|案例|沟通|表达/.test(weakness)) return 'scenario'
  if (/代码|实现|语法|类型|泛型|响应式|性能/.test(weakness)) return 'code'
  return 'concept'
}

const resolvePracticeDifficulty = (answerLength: number, weaknessCount: number) => {
  if (answerLength < 80) return 'easy'
  if (weaknessCount >= 3) return 'hard'
  return 'medium'
}

const resolvePracticeFocusAreas = (
  latestAnswer: string,
  latestFeedback: string,
  primaryWeakness: string
) => {
  const content = `${ primaryWeakness } ${ latestFeedback } ${ latestAnswer }`
  const focusAreas: string[] = []

  if (latestAnswer.trim().length < 90 || /结构|拆分|分段|结论|表达|没讲清|不够完整/.test(content)) {
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

  return focusAreas.length ? focusAreas : ['structure']
}

const practiceZoneByTopic: Record<string, string> = {
  vue3: 'vue',
  typescript: 'typescript',
  engineering: 'engineering',
  browser: 'javascript',
  performance: 'performance',
  scenario: 'engineering'
}

const buildReportListItem = (report: StoredInterviewReportSummary): InterviewReportListItem => ({
  id: report.id,
  sessionId: report.sessionId,
  threadId: report.threadId,
  topic: report.topic,
  questionTitle: report.questionTitle,
  summaryHeadline: report.summaryHeadline,
  answeredCount: report.answeredCount,
  totalCount: report.totalCount,
  weaknessTags: report.weaknessTags,
  createdAt: report.createdAt,
  updatedAt: report.updatedAt
})

const buildLocalReport = (
  payload: GenerateInterviewReportRequest,
  existing: StoredInterviewReportSummary | null,
  sessions: ReturnType<typeof getStoredInterviewSessionsBySessionId>,
  now: string
): StoredInterviewReportSummary => {
  const allMessages = sessions.flatMap(session => session.messages.map(message => ({
    ...message,
    threadId: session.threadId,
    questionTitle: session.questionTitle
  })))

  const userMessages = allMessages.filter(item => item.role === 'user')
  const feedbackMessages = allMessages.filter(item => item.role === 'assistant')
  const latestAnswer = userMessages[userMessages.length - 1]?.content || ''
  const latestFeedback = feedbackMessages[feedbackMessages.length - 1]?.content || ''
  const answerLength = latestAnswer.trim().length

  const topic = payload.topic?.trim() || sessions[0]?.topic || 'vue3'
  const topicLabel = topicLabelMap[topic] || topic
  const source = payload.source?.trim() || 'mock-interview-space'
  const sourceDocumentName = payload.sourceDocumentName?.trim() || ''
  const sourceLabel = sourceDocumentName || '当前训练上下文'
  const weaknessTags = payload.weaknessTags?.length
    ? [...payload.weaknessTags]
    : []
  const primaryWeakness = payload.primaryWeakness?.trim()
    || weaknessTags[0]
    || '当前还没有形成稳定弱项'

  const answeredCount = typeof payload.answeredCount === 'number'
    ? payload.answeredCount
    : sessions.filter(session => session.messages.some(item => item.role === 'user')).length

  const totalCount = typeof payload.totalCount === 'number' && payload.totalCount > 0
    ? payload.totalCount
    : Math.max(sessions.length, answeredCount, 1)

  const answeredSummary = `${ answeredCount } / ${ totalCount }`
  const questionTitle = sessions[sessions.length - 1]?.questionTitle
    || sessions[0]?.questionTitle
    || topicLabel

  const answerSnapshot = sessions.map((session) => {
    const answerMessage = [...session.messages].reverse().find(item => item.role === 'user')
    const answerText = normalizeSnippet(answerMessage?.content || '', 88)
    return `${ session.questionTitle }: ${ answerText || '未作答' }`
  })

  const summaryHeadline = `围绕 ${ sourceLabel } 的 ${ topicLabel } 训练已形成阶段总结`
  const summaryBody = payload.summaryBody?.trim() || [
    `本轮围绕“${ questionTitle }”共展开 ${ Math.max(sessions.length, totalCount) } 题，当前已完成 ${ answeredSummary }。`,
    latestAnswer
      ? `最近一次作答摘录为“${ normalizeSnippet(latestAnswer, 90) }”，当前最明显的短板是“${ primaryWeakness }”。`
      : `本轮已经浏览完题目，但还存在未作答内容，当前最明显的短板先记为“${ primaryWeakness }”。`
  ].join('')

  const suggestedFocus = payload.suggestedFocus?.length
    ? [...payload.suggestedFocus]
    : [
        answerLength < 80 ? '下一轮回答尽量按“结论 -> 拆分 -> 结果”三段式展开，避免答案过短。' : '',
        latestFeedback ? `优先处理最近一次反馈暴露的问题：${ normalizeSnippet(latestFeedback, 72) }` : '',
        sourceDocumentName ? `下一轮继续围绕《${ sourceDocumentName }》补练，把资料上下文真正转成可表达内容。` : '',
        answeredCount < totalCount ? '当前轮次还有未作答题目，这份报告会先按已展开题目生成阶段性结果。' : ''
      ].filter(Boolean)

  const weaknessFocusAreas = payload.weaknessFocusAreas?.length
    ? [...payload.weaknessFocusAreas]
    : resolvePracticeFocusAreas(latestAnswer, latestFeedback, primaryWeakness)
  const practiceQuestionType = resolvePracticeQuestionType(primaryWeakness)
  const practiceDifficulty = resolvePracticeDifficulty(answerLength, weaknessTags.length)

  return {
    id: `report-${ payload.sessionId }`,
    sessionId: payload.sessionId,
    modelId: payload.modelId?.trim() || existing?.modelId,
    owner: sessions[sessions.length - 1]?.owner || sessions[0]?.owner,
    threadId: sessions[sessions.length - 1]?.threadId,
    topic,
    source,
    sourceDocumentId: payload.sourceDocumentId?.trim() || undefined,
    sourceDocumentName: sourceDocumentName || undefined,
    sourceDocumentExcerpt: payload.sourceDocumentExcerpt?.trim() || undefined,
    questionTitle,
    summaryHeadline,
    summaryBody,
    weaknessTags,
    primaryWeakness,
    weaknessFocusAreas,
    answeredCount,
    totalCount,
    answerSnapshot: [
      ...answerSnapshot,
      latestFeedback ? `系统反馈: ${ normalizeSnippet(latestFeedback, 72) }` : ''
    ].filter(Boolean),
    questionReviews: payload.questionReviews?.length ? payload.questionReviews.map(item => ({ ...item })) : undefined,
    suggestedFocus,
    practicePlan: {
      weaknessTag: primaryWeakness,
      questionType: practiceQuestionType,
      difficulty: practiceDifficulty,
      zone: practiceZoneByTopic[topic] || 'vue'
    },
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }
}

const tryEnhanceReportWithRemoteLlm = async (
  payload: GenerateInterviewReportRequest,
  localReport: StoredInterviewReportSummary
) => {
  if (!isRemoteLlmConfigured(payload.modelId)) return localReport

  const messages = buildReportLlmMessages(payload, {
    topicLabel: topicLabelMap[localReport.topic] || localReport.topic,
    sourceLabel: localReport.sourceDocumentName || '当前训练上下文',
    questionTitle: localReport.questionTitle || (topicLabelMap[localReport.topic] || localReport.topic),
    answeredCount: localReport.answeredCount,
    totalCount: localReport.totalCount,
    answerSnapshot: localReport.answerSnapshot || [],
    latestAnswer: payload.questionReviews?.[payload.questionReviews.length - 1]?.userAnswer || '',
    latestFeedback: payload.questionReviews?.[payload.questionReviews.length - 1]?.aiFeedback || '',
    primaryWeakness: localReport.primaryWeakness || ''
  })

  const raw = await completeRemoteLlmJson(messages, {
    modelId: payload.modelId
  })

  const enhanced = parseReportLlmJson(raw, {
    summaryHeadline: localReport.summaryHeadline,
    summaryBody: localReport.summaryBody,
    primaryWeakness: localReport.primaryWeakness,
    weaknessTags: localReport.weaknessTags,
    weaknessFocusAreas: localReport.weaknessFocusAreas,
    suggestedFocus: localReport.suggestedFocus,
    practicePlan: localReport.practicePlan
  })

  return {
    ...localReport,
    summaryHeadline: enhanced.summaryHeadline,
    summaryBody: enhanced.summaryBody,
    primaryWeakness: enhanced.primaryWeakness,
    weaknessTags: enhanced.weaknessTags,
    weaknessFocusAreas: enhanced.weaknessFocusAreas,
    suggestedFocus: enhanced.suggestedFocus,
    practicePlan: enhanced.practicePlan
  } satisfies StoredInterviewReportSummary
}

export class ReportService {
  listReports(owner?: string): InterviewReportListItem[] {
    const reports = owner
      ? getStoredInterviewReportsByOwner(owner)
      : getStoredInterviewReports().filter(report => !report.owner)
    return reports.map(buildReportListItem)
  }

  getReportBySessionId(sessionId: string, owner?: string) {
    const report = getStoredInterviewReportBySessionId(sessionId)
    if (!report) return null
    if (owner && report.owner !== owner) return null
    if (!owner && report.owner) return null
    return report
  }

  async generateReport(payload: GenerateInterviewReportRequest): Promise<GenerateInterviewReportResponse> {
    const sessionId = payload.sessionId.trim()
    if (!sessionId) {
      throw new Error('sessionId is required.')
    }

    const existing = getStoredInterviewReportBySessionId(sessionId)
    const sessions = getStoredInterviewSessionsBySessionId(sessionId)
    const now = new Date().toISOString()
    const normalizedPayload: GenerateInterviewReportRequest = {
      ...payload,
      sessionId
    }

    const localReport = buildLocalReport(normalizedPayload, existing, sessions, now)

    let finalReport = localReport
    try {
      finalReport = await tryEnhanceReportWithRemoteLlm(normalizedPayload, localReport)
    } catch (error) {
      console.warn('[report-service] remote report generation fallback to local summary:', error)
    }

    upsertStoredInterviewReport(finalReport)

    return {
      report: finalReport,
      created: !existing
    }
  }
}

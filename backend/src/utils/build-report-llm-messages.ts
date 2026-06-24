import type { GenerateInterviewReportRequest } from '../types/report.js'

const buildReviewDigest = (request: GenerateInterviewReportRequest) => {
  const reviews = request.questionReviews || []
  if (!reviews.length) return '（暂无逐题复盘，请基于整体摘要、弱项标签与答题快照生成报告）'

  return reviews.slice(0, 8).map((item, index) => [
    `【第 ${ index + 1 } 题】${ item.questionTitle }`,
    `候选人回答：${ (item.userAnswer || '').slice(0, 500) || '暂无回答' }`,
    item.aiFeedback ? `面试官反馈：${ item.aiFeedback.slice(0, 500) }` : '',
    item.referenceAnswer ? `参考答案要点：${ item.referenceAnswer.slice(0, 400) }` : ''
  ].filter(Boolean).join('\n')).join('\n\n')
}

export const buildReportLlmMessages = (
  request: GenerateInterviewReportRequest,
  context: {
    topicLabel: string
    sourceLabel: string
    questionTitle: string
    answeredCount: number
    totalCount: number
    answerSnapshot: string[]
    latestAnswer: string
    latestFeedback: string
    primaryWeakness: string
  }
) => {
  const system = [
    '你是一名中文前端面试复盘教练，需要基于模拟面试记录生成结构化报告摘要。',
    '必须只输出一个 JSON 对象，不要输出 Markdown 代码块，不要解释。',
    '所有文案都要简洁、专业、可执行，禁止空话套话。',
    'JSON 结构如下：',
    '{',
    '  "summaryHeadline": "20字以内阶段总结标题",',
    '  "summaryBody": "120到220字中文总结，必须结合答题表现与弱项",',
    '  "primaryWeakness": "最核心的一个弱项",',
    '  "weaknessTags": ["弱项1", "弱项2"],',
    '  "weaknessFocusAreas": ["structure|case_detail|result_metric|principle_depth"],',
    '  "suggestedFocus": ["下一轮建议1", "下一轮建议2"],',
    '  "practicePlan": {',
    '    "weaknessTag": "与 primaryWeakness 对齐",',
    '    "questionType": "concept|code|scenario",',
    '    "difficulty": "easy|medium|hard",',
    '    "zone": "vue|javascript|typescript|engineering|performance"',
    '  }',
    '}',
    '约束：',
    '1. weaknessTags 保留 2 到 4 个，优先沿用输入弱项，不要凭空扩展太多。',
    '2. weaknessFocusAreas 只能从 structure、case_detail、result_metric、principle_depth 中选择 1 到 3 个。',
    '3. suggestedFocus 输出 2 到 4 条，每条一句话，必须能直接指导下一轮训练。',
    '4. 如果输入里已有 primaryWeakness 或 weaknessFocusAreas，优先在此基础上归纳，不要偏题。'
  ].join('\n')

  const user = [
    `sessionId: ${ request.sessionId }`,
    `当前模型标识: ${ request.modelId || '未指定，按后台默认模型' }`,
    `训练主题: ${ context.topicLabel }`,
    `训练来源: ${ context.sourceLabel }`,
    `当前题目主线: ${ context.questionTitle }`,
    `完成进度: ${ context.answeredCount } / ${ context.totalCount }`,
    request.primaryWeakness ? `前端传入主要弱项: ${ request.primaryWeakness }` : '',
    request.weaknessTags?.length ? `前端传入弱项标签: ${ request.weaknessTags.join(' / ') }` : '',
    request.weaknessFocusAreas?.length ? `前端传入弱项维度: ${ request.weaknessFocusAreas.join(' / ') }` : '',
    request.suggestedFocus?.length ? `前端本地建议关注点: ${ request.suggestedFocus.join(' / ') }` : '',
    request.sourceDocumentName ? `训练资料名称: ${ request.sourceDocumentName }` : '',
    request.sourceDocumentExcerpt
      ? `训练资料片段:\n${ request.sourceDocumentExcerpt.slice(0, 2200) }`
      : '',
    request.summaryBody ? `前端本地阶段摘要:\n${ request.summaryBody.slice(0, 1200) }` : '',
    context.latestAnswer ? `最近一次作答:\n${ context.latestAnswer.slice(0, 800) }` : '',
    context.latestFeedback ? `最近一次反馈:\n${ context.latestFeedback.slice(0, 800) }` : '',
    `当前推断主要弱项: ${ context.primaryWeakness }`,
    '答题快照:',
    context.answerSnapshot.slice(0, 8).join('\n'),
    '逐题复盘:',
    buildReviewDigest(request),
    '请输出最终 JSON。'
  ].filter(Boolean).join('\n\n')

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user }
  ]
}

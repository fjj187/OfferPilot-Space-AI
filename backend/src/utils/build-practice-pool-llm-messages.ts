import type { GeneratePracticePoolRequest } from '../types/practice-pool.js'

const buildReviewDigest = (request: GeneratePracticePoolRequest) => {
  const reviews = request.questionReviews || []
  if (!reviews.length) return '（无逐题复盘，请根据弱项标签与摘要出题）'

  return reviews.slice(0, 8).map((item, index) => [
    `【第 ${ index + 1 } 题】${ item.questionTitle }`,
    `候选人回答：${ (item.userAnswer || '').slice(0, 400) }`,
    item.aiFeedback ? `面试官反馈：${ item.aiFeedback.slice(0, 400) }` : ''
  ].filter(Boolean).join('\n')).join('\n\n')
}

export const buildPracticePoolLlmMessages = (request: GeneratePracticePoolRequest) => {
  const plan = request.plan
  const system = [
    '你是中文前端面试教练，根据候选人上一轮模拟面试复盘，生成专项补练题单。',
    '必须只输出一个 JSON 对象，不要 Markdown 代码块，不要解释。',
    'JSON 结构：',
    '{',
    '  "questions": [',
    '    {',
    '      "title": "题目标题",',
    '      "prompt": "完整题干，含追问要求",',
    '      "difficulty": "easy|medium|hard",',
    '      "questionType": "concept|code|scenario",',
    '      "focusAreas": ["structure|case_detail|result_metric|principle_depth"],',
    '      "referenceAnswer": "参考答案要点",',
    '      "weaknessTag": "对应弱项",',
    '      "sourceQuestionId": "可选，关联原题 id"',
    '    }',
    '  ]',
    '}',
    `题目数量：${ request.questionCount } 道。`,
    `弱项标签：${ plan.weaknessTag }。`,
    plan.focusArea ? `补练维度：${ plan.focusArea }。` : '',
    `专区：${ plan.zone }；题型：${ plan.questionType }；难度：${ plan.difficulty }。`,
    plan.reason ? `补练原因：${ plan.reason }` : ''
  ].filter(Boolean).join('\n')

  const user = [
    `sessionId: ${ request.sessionId }`,
    request.summaryBody ? `复盘摘要：\n${ request.summaryBody.slice(0, 1200) }` : '',
    request.weaknessTags?.length ? `弱项列表：${ request.weaknessTags.join(' / ') }` : '',
    request.sourceDocumentName ? `训练资料：${ request.sourceDocumentName }` : '',
    request.sourceDocumentSummary ? `资料摘要：${ request.sourceDocumentSummary.slice(0, 600) }` : '',
    request.sourceDocumentTags?.length ? `资料标签：${ request.sourceDocumentTags.join(' / ') }` : '',
    request.sourceDocumentExcerpt ? `资料章节片段（须结合出题）：\n${ request.sourceDocumentExcerpt.slice(0, 2000) }` : '',
    '逐题复盘：',
    buildReviewDigest(request),
    '要求：每题须针对上述弱项或具体作答缺口；避免泛泛百科题；题面用中文。'
  ].filter(Boolean).join('\n\n')

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user }
  ]
}

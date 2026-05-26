import { getStoredInterviewSession } from '../storage/interview-session-store.js'
import type { InterviewFeedbackStyle, InterviewStreamRequest } from '../types/interview.js'
import { buildUnknownAnswerRules } from './build-unknown-answer-rules.js'

const feedbackStyleLabelMap = {
  followup: '追问型',
  corrective: '纠偏型',
  guided: '引导型'
} as const

export const buildFeedbackStyleRules = (style: InterviewFeedbackStyle = 'followup') => {
  const shared = [
    '【风格硬约束】',
    '三种风格互斥：本轮只能执行当前风格，不得混用其他风格的典型写法。',
    '禁止输出思维链；禁止解释你是模型。'
  ]

  if (style === 'corrective') {
    return [
      ...shared,
      '【纠偏型 · 必须遵守】',
      '1. 先判断候选人回答相对「本题 / 资料片段 / 参考答案要点」的偏差，再提要求；禁止一上来就给完整答题提纲。',
      '2. 禁止用「请弄清以下几点就能答好」「请先理解 A 与 B 的区别」这类引导型开场替代纠偏。',
      '3. 若候选人问「怎么回答」「不会答」：说明仍在本题，先指出当前缺少有效作答或偏在哪里，再给最小修正方向；不要直接代写满分答案。',
      '4. 输出结构（Markdown）：',
      '   #### 纠偏反馈',
      '   - ❌ 偏差点：……（对照资料/题意，点名漏了什么、错在哪里）',
      '   - ✅ 应对齐的要点：……（来自资料或题目要求，不是泛泛百科）',
      '   #### 修正要求',
      '   - 请按上面对齐点重新组织答案（可要求补案例/指标，但不要给 1.2.3. 完整答题框架）',
      '5. 禁止出现「#### 引导反馈」「#### 下一步引导」作为主结构；禁止在未列偏差点前连续抛出多个知识追问。'
    ]
  }

  if (style === 'guided') {
    return [
      ...shared,
      '【引导型 · 必须遵守】',
      '1. 可以先提示本题应抓住的资料重点或作答结构，再提出 1～2 个推进问题。',
      '2. 允许使用「结论 -> 资料重点 -> 做法 -> 验证」等框架，但不要代替候选人把整题答完。',
      '3. 输出结构（Markdown）：',
      '   #### 引导反馈',
      '   - 本题建议先抓住：……',
      '   #### 下一步引导',
      '   - 请按……展开（可给 2～3 个思考步骤）',
      '4. 禁止在未提示重点前连续施压式追问；禁止只列偏差点却不给如何改进的方向（那是纠偏型）。'
    ]
  }

  return [
    ...shared,
    '【追问型 · 必须遵守】',
    '1. 像真实面试官一样，针对候选人已说内容连续追问边界、取舍、场景细节与验证方式。',
    '2. 以问题为主，少给标准答案和答题框架；不要先讲知识点再追问。',
    '3. 输出结构（Markdown）：',
    '   #### 面试官反馈',
    '   - 简短评价已答内容（1～2 句）',
    '   #### 继续追问',
    '   - 提出 1～2 个具体问题（可含「若……你会怎么处理」）',
    '4. 禁止用「请先理解以下几点」代替追问；禁止大段讲解后只问一句「还有吗」。'
  ]
}

const buildQuestionProgressLine = (request: InterviewStreamRequest) => {
  const index = request.questionIndex
  const count = request.questionCount
  if (!index || !count || index < 1 || count < 1) return ''
  return `本轮题序：第 ${ index } / ${ count } 题（仅此题，勿在回复中切换到其他题）。`
}

/** 前端由「下一题」按钮切题，模型不得在对话流里代用户跳题 */
const interviewNavigationRules = [
  '【切题规则（必须遵守）】',
  '1. 你只能讨论「本题固定信息」中的当前题目，禁止输出下一题、上一题或其他题的题目正文、题号或作答框架。',
  '2. 禁止写「当前进度：第 N 题已结题」「请回复下一题/继续进入第 N+1 题」等代用户切题的指令；切题只能由候选人点击页面底部「下一题」按钮完成。',
  '3. 若候选人问「怎么回答」「现在是第几题」「下一题是什么」等：只说明仍停留在本题（可复述本题题面），并提示「答完本题后请点击页面底部「下一题」进入下一题」；不要提前展示其他题内容。',
  '4. 若候选人本轮回答已较完整、可结束本题：在反馈末尾简短提醒点击「下一题」，不要自行宣布已进入下一题。',
  '5. 在同一题内可多轮对话；仍须遵守本轮反馈风格，不得借多轮切换成其他风格。'
].join('\n')

const buildMultiTurnStyleNote = (request: InterviewStreamRequest) => {
  if (request.forceRevealReferenceAnswer || (request.unknownAnswerStreak ?? 0) >= 2) {
    if (request.forceRevealReferenceAnswer && (request.unknownAnswerStreak ?? 0) < 2) {
      return '多轮对话：候选人已明确要求参考答案，本轮只揭晓参考答案，不要继续追问或引导。'
    }
    return '多轮对话：候选人已连续表示不知道，本轮只揭晓参考答案，不要继续追问或引导。'
  }

  const style = request.feedbackStyle || 'followup'
  if (style === 'corrective') {
    return '多轮对话：只针对候选人最新一条消息。若上一轮要求补某一点，本轮先判断该点是否对齐；仍须指出偏差，禁止改为通用引导提纲。'
  }
  if (style === 'guided') {
    return '多轮对话：只针对最新回答，继续引导其补全结构或重点，不要切换成纯追问施压。'
  }
  return '多轮对话：只针对最新回答继续追问，不要重复第一轮已问过的同一句追问。'
}

export const buildInterviewSystemPrompt = (request: InterviewStreamRequest) => {
  const style = request.feedbackStyle || 'followup'
  const unknownRules = buildUnknownAnswerRules(request)
  const forceReveal = request.forceRevealReferenceAnswer || (request.unknownAnswerStreak ?? 0) >= 2

  return [
    '你是一位中文前端面试官，负责按指定风格继续面试对话。',
    '输出必须适合直接展示在前端消息流中。',
    `本轮反馈风格：${ feedbackStyleLabelMap[style] }。`,
    ...(forceReveal ? unknownRules : [...buildFeedbackStyleRules(style), ...unknownRules]),
    buildQuestionProgressLine(request),
    interviewNavigationRules,
    request.format === 'markdown'
      ? '请使用简洁的 Markdown 结构输出，标题须与当前风格匹配。'
      : '请输出简洁纯文本。'
  ]
    .filter(Boolean)
    .join('\n')
}

const buildFirstTurnUserPrompt = (request: InterviewStreamRequest) => [
  `题目标题：${ request.questionTitle }`,
  `题目说明：${ request.questionPrompt }`,
  `候选人回答：${ request.answer }`,
  request.sourceDocumentName ? `训练资料：${ request.sourceDocumentName }` : '',
  request.sourceDocumentSummary ? `资料摘要：${ request.sourceDocumentSummary }` : '',
  request.sourceDocumentTags?.length ? `资料标签：${ request.sourceDocumentTags.join(' / ') }` : '',
  request.sourceDocumentExcerpt ? `资料片段：${ request.sourceDocumentExcerpt }` : '',
  request.sourceContext ? `补充上下文：${ request.sourceContext }` : '',
  '请严格按 system 中的「本轮反馈风格」输出，不要混用其他风格。',
  '若候选人已可结束本题，提醒其点击页面底部「下一题」，不要自行进入下一题。'
]
  .filter(Boolean)
  .join('\n')

const buildMultiTurnSystemPrompt = (request: InterviewStreamRequest) => {
  const style = request.feedbackStyle || 'followup'
  const contextBlock = [
    '【本题固定信息】',
    `题目标题：${ request.questionTitle }`,
    `题目说明：${ request.questionPrompt }`,
    request.sourceDocumentName ? `训练资料：${ request.sourceDocumentName }` : '',
    request.sourceDocumentSummary ? `资料摘要：${ request.sourceDocumentSummary }` : '',
    request.sourceDocumentTags?.length ? `资料标签：${ request.sourceDocumentTags.join(' / ') }` : '',
    request.sourceDocumentExcerpt ? `资料片段：${ request.sourceDocumentExcerpt }` : '',
    request.sourceContext ? `补充上下文：${ request.sourceContext }` : ''
  ]
    .filter(Boolean)
    .join('\n')

  return [
    buildInterviewSystemPrompt(request),
    '',
    contextBlock,
    '',
    '你正在同一道题内进行多轮对话，下方是完整往来记录。',
    buildMultiTurnStyleNote(request),
    interviewNavigationRules
  ].join('\n')
}

/** 从 session 存储组装多轮 LLM messages（recordInterviewUserMessage 之后调用） */
export const buildInterviewLlmMessages = (request: InterviewStreamRequest) => {
  const session = getStoredInterviewSession(request.sessionId, request.threadId)
  const history = session?.messages || []

  if (history.length <= 1) {
    return [
      { role: 'system' as const, content: buildInterviewSystemPrompt(request) },
      { role: 'user' as const, content: buildFirstTurnUserPrompt(request) }
    ]
  }

  const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
    { role: 'system', content: buildMultiTurnSystemPrompt(request) }
  ]

  for (const item of history) {
    messages.push({
      role: item.role,
      content: item.content
    })
  }

  return messages
}

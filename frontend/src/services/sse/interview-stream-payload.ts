import type { InterviewStreamMode, InterviewStreamRequest } from './sse-types'

const feedbackStyleInstructionMap = {
  followup: '反馈风格：追问型。请更像真实面试官，优先继续追问和压缩回答边界。',
  corrective: '反馈风格：纠偏型。请优先指出回答与资料重点哪里没有对齐，再给修正建议。',
  guided: '反馈风格：引导型。请先提示资料里应该抓住哪些点，再继续往下追问。'
} as const

const interviewNavigationInstruction = [
  '切题规则：你只能讨论当前题目，禁止在回复中展示或切换到其他题。',
  '候选人需点击页面底部“下一题”按钮才能进入下一题；若对方问第几题或想换题，只说明仍在本题并提示点击“下一题”。'
].join('\n')

export const resolveInterviewStreamEndpoint = () => {
  const configuredEndpoint = import.meta.env.VITE_INTERVIEW_SSE_URL?.trim() || ''
  if (configuredEndpoint) return configuredEndpoint

  return import.meta.env.DEV ? '/api/interview/stream' : ''
}

export const resolveInterviewStreamMode = (): InterviewStreamMode => (
  resolveInterviewStreamEndpoint() ? 'remote' : 'mock'
)

export const normalizeInterviewStreamRequest = (request: InterviewStreamRequest): InterviewStreamRequest => {
  const structuredSourceContext = [
    request.sourceDocumentSummary ? `资料摘要：${ request.sourceDocumentSummary }` : '',
    request.sourceDocumentTags?.length ? `资料标签：${ request.sourceDocumentTags.join(' / ') }` : '',
    request.sourceDocumentExcerpt ? `资料片段：${ request.sourceDocumentExcerpt }` : ''
  ]
    .filter(Boolean)
    .join('\n')

  const compactPrompt = [
    request.questionTitle,
    request.questionIndex && request.questionCount
      ? `本轮题序：第 ${ request.questionIndex } / ${ request.questionCount } 题（仅本题）`
      : '',
    interviewNavigationInstruction,
    request.feedbackStyle ? feedbackStyleInstructionMap[request.feedbackStyle] : '',
    structuredSourceContext || request.sourceContext,
    request.answer
  ]
    .map(item => item?.trim())
    .filter(Boolean)
    .join('\n')

  return {
    ...request,
    // `questionPrompt` 已保留完整题面，这里只发送最小提示上下文，避免重复。
    prompt: compactPrompt || request.prompt.trim()
  }
}

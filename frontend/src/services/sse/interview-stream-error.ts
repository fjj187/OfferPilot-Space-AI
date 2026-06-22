import type { InterviewApiError, InterviewStreamMode } from './sse-types'

export const resolveInterviewStreamErrorMessage = (
  mode: InterviewStreamMode | 'idle',
  error?: InterviewApiError
) => {
  if (mode === 'remote') {
    return `真实 AI 流式请求失败：${ error?.message || '请稍后重试。' }`
  }

  return error?.message || '生成失败，请稍后重试。'
}

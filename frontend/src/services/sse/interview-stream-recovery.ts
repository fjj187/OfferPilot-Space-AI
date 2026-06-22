import type { InterviewStreamLaunchPayload, InterviewStreamMode } from './sse-types'

const INTERVIEW_STREAM_RECOVERY_STORAGE_KEY = 'offerpilot:interview-stream-recovery'

export interface InterviewStreamRecoveryCapabilities {
  supportsHeartbeatEvent: boolean
  supportsIdempotentKey: boolean
  supportsCheckpoint: boolean
}

export interface PendingInterviewStreamRecovery {
  messageId: string
  mode: InterviewStreamMode
  params: InterviewStreamLaunchPayload
  recordedAt: string
}

export const interviewStreamRecoveryCapabilities: InterviewStreamRecoveryCapabilities = {
  supportsHeartbeatEvent: true,
  supportsIdempotentKey: true,
  supportsCheckpoint: true
}

export const canAutoRecoverInterviewStream = (mode: InterviewStreamMode) => (
  mode === 'remote'
  && interviewStreamRecoveryCapabilities.supportsHeartbeatEvent
  && interviewStreamRecoveryCapabilities.supportsIdempotentKey
  && interviewStreamRecoveryCapabilities.supportsCheckpoint
)

export const getPendingInterviewStreamRecovery = (): PendingInterviewStreamRecovery | null => {
  if (typeof window === 'undefined') return null

  const raw = window.sessionStorage.getItem(INTERVIEW_STREAM_RECOVERY_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as PendingInterviewStreamRecovery
  } catch {
    window.sessionStorage.removeItem(INTERVIEW_STREAM_RECOVERY_STORAGE_KEY)
    return null
  }
}

export const setPendingInterviewStreamRecovery = (payload: PendingInterviewStreamRecovery) => {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(INTERVIEW_STREAM_RECOVERY_STORAGE_KEY, JSON.stringify(payload))
}

export const clearPendingInterviewStreamRecovery = () => {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(INTERVIEW_STREAM_RECOVERY_STORAGE_KEY)
}

export const buildInterviewStreamRecoveryHint = (pendingRecovery: PendingInterviewStreamRecovery | null) => {
  if (!pendingRecovery) return ''

  if (canAutoRecoverInterviewStream(pendingRecovery.mode)) {
    return '检测到上一轮流式反馈在本地中断。你可以点击“恢复本轮反馈”，补渲染上次已生成的内容；如需继续生成，请重新提交本轮回答。'
  }

  return '检测到上一轮流式反馈在本地中断。当前后端尚未提供断点恢复协作能力，请使用重试入口重新生成本轮反馈。'
}

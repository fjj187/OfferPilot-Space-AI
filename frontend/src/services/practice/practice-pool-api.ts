import type { AxiosRequestConfig } from 'axios'

import request from '@/utils/request'
import type { GeneratePracticePoolPayload, PracticeQuestionPool } from '@/types/practice-pool'
import { isInterviewApiAvailable } from '@/services/interview/interview-session-api'

interface GeneratePracticePoolApiResponse {
  pool: PracticeQuestionPool
  requestedCount: number
  actualCount: number
  isShortfall: boolean
  code?: string
  message?: string
}

const resolveInterviewApiBase = () => {
  const configuredBase = import.meta.env.VITE_INTERVIEW_API_BASE_URL?.trim() || ''
  if (configuredBase) return configuredBase.replace(/\/$/, '')
  if (import.meta.env.DEV) {
    return `${ window.location.origin }/api/interview`
  }
  return ''
}

const PRACTICE_POOL_REQUEST_TIMEOUT_MS = 120_000
const normalizeApiPath = (apiBase: string, path: string) => `${ apiBase }${ path }`

export const isPracticePoolApiAvailable = () => isInterviewApiAvailable()

export const generatePracticePool = async (payload: GeneratePracticePoolPayload) => {
  const apiBase = resolveInterviewApiBase()
  if (!apiBase) {
    throw new Error('Practice pool API is not configured.')
  }

  const response = await request.post(
    normalizeApiPath(apiBase, '/practice-pool/generate'),
    payload,
    {
      timeout: PRACTICE_POOL_REQUEST_TIMEOUT_MS,
      requestName: 'generatePracticePool'
    }
  )

  if (response.error === 0) {
    return response.data as GeneratePracticePoolApiResponse
  }

  if (response.errorType === 'timeout' || response.aborted) {
    throw new Error('生成补练题超时，请确认后端已启动且模型配置正确后重试')
  }

  if (response.errorType === 'network') {
    throw new Error('无法连接补练题池服务，请确认已运行 pnpm dev 并启动后端')
  }

  throw new Error(response.msg || '生成补练题失败，请稍后重试。')
}

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
  return import.meta.env.DEV ? '/api/interview' : ''
}

export const isPracticePoolApiAvailable = () => isInterviewApiAvailable()

const PRACTICE_POOL_REQUEST_TIMEOUT_MS = 120_000

export const generatePracticePool = async (payload: GeneratePracticePoolPayload) => {
  const apiBase = resolveInterviewApiBase()
  if (!apiBase) {
    throw new Error('Practice pool API is not configured.')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PRACTICE_POOL_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${ apiBase }/practice-pool/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    const result = await response.json() as GeneratePracticePoolApiResponse
    if (!response.ok) {
      throw new Error(result.message || `Practice pool API failed: ${ response.status }`)
    }

    return result
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('生成补练题超时，请确认后端已启动且模型配置正确后重试')
    }
    if (error instanceof TypeError) {
      throw new Error('无法连接补练题池服务，请确认已运行 pnpm dev 并启动后端')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

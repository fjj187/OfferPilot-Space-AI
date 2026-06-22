import { resolveInterviewStreamEndpoint } from './interview-stream-payload'

export interface InterviewStreamCheckpointSnapshot {
  sessionId: string
  threadId: string
  messageId: string
  idempotentKey: string
  status: 'streaming' | 'done' | 'error' | 'aborted'
  content: string
  lastSequence: number
  updatedAt: string
  createdAt: string
  completedAt?: string
  errorCode?: string
  errorMessage?: string
}

const resolveApiBaseUrl = () => {
  const streamEndpoint = resolveInterviewStreamEndpoint()
  if (!streamEndpoint) return ''
  if (streamEndpoint.startsWith('/api/')) return '/api'

  const normalized = streamEndpoint.replace(/\/interview\/stream$/, '')
  return normalized.endsWith('/api/interview')
    ? normalized.slice(0, -'/interview'.length)
    : normalized
}

export const fetchInterviewStreamCheckpoint = async (
  sessionId: string,
  threadId: string,
  idempotentKey?: string
) => {
  const baseUrl = resolveApiBaseUrl()
  if (!baseUrl) return null

  const params = new URLSearchParams()
  if (idempotentKey) {
    params.set('idempotentKey', idempotentKey)
  }

  const response = await fetch(
    `${ baseUrl }/interview/sessions/${ encodeURIComponent(sessionId) }/${ encodeURIComponent(threadId) }/checkpoint${ params.size ? `?${ params.toString() }` : '' }`,
    {
      method: 'GET'
    }
  )

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`Checkpoint request failed: ${ response.status }`)
  }

  const payload = await response.json() as {
    checkpoint?: InterviewStreamCheckpointSnapshot | null
  }

  return payload.checkpoint || null
}

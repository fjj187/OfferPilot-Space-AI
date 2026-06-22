import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { backendEnv } from '../utils/env.js'

export type InterviewStreamCheckpointStatus = 'streaming' | 'done' | 'error' | 'aborted'

export interface StoredInterviewStreamCheckpoint {
  sessionId: string
  threadId: string
  messageId: string
  idempotentKey: string
  owner?: string
  status: InterviewStreamCheckpointStatus
  content: string
  lastSequence: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  errorCode?: string
  errorMessage?: string
}

interface PersistedInterviewStreamCheckpointPayload {
  checkpoints: StoredInterviewStreamCheckpoint[]
}

const storageDirPath = path.resolve(process.cwd(), backendEnv.storageDir)
const storageFilePath = path.join(storageDirPath, 'interview-stream-checkpoints.json')
const temporaryStorageFilePath = `${ storageFilePath }.tmp`

const buildStoreKey = (sessionId: string, threadId: string, idempotentKey: string) => (
  `${ sessionId }::${ threadId }::${ idempotentKey }`
)

const ensureStorageDir = () => {
  mkdirSync(storageDirPath, {
    recursive: true
  })
}

const isStoredInterviewStreamCheckpoint = (value: unknown): value is StoredInterviewStreamCheckpoint => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as StoredInterviewStreamCheckpoint
  return typeof candidate.sessionId === 'string'
    && typeof candidate.threadId === 'string'
    && typeof candidate.messageId === 'string'
    && typeof candidate.idempotentKey === 'string'
    && typeof candidate.status === 'string'
    && typeof candidate.content === 'string'
    && typeof candidate.lastSequence === 'number'
    && typeof candidate.createdAt === 'string'
    && typeof candidate.updatedAt === 'string'
}

const loadStoredCheckpoints = () => {
  ensureStorageDir()

  if (!existsSync(storageFilePath)) {
    return new Map<string, StoredInterviewStreamCheckpoint>()
  }

  try {
    const rawContent = readFileSync(storageFilePath, 'utf8')
    if (!rawContent.trim()) {
      return new Map<string, StoredInterviewStreamCheckpoint>()
    }

    const parsed = JSON.parse(rawContent) as Partial<PersistedInterviewStreamCheckpointPayload>
    const checkpoints = Array.isArray(parsed.checkpoints)
      ? parsed.checkpoints.filter(isStoredInterviewStreamCheckpoint)
      : []

    return new Map(
      checkpoints.map(checkpoint => [
        buildStoreKey(checkpoint.sessionId, checkpoint.threadId, checkpoint.idempotentKey),
        checkpoint
      ])
    )
  } catch (error) {
    console.warn('[backend] failed to load interview stream checkpoint store:', error)
    return new Map<string, StoredInterviewStreamCheckpoint>()
  }
}

const checkpointStore = loadStoredCheckpoints()

const persistCheckpointStore = () => {
  ensureStorageDir()

  const payload: PersistedInterviewStreamCheckpointPayload = {
    checkpoints: [...checkpointStore.values()].sort((left, right) => (
      left.updatedAt < right.updatedAt ? 1 : -1
    ))
  }

  writeFileSync(temporaryStorageFilePath, JSON.stringify(payload, null, 2), 'utf8')
  renameSync(temporaryStorageFilePath, storageFilePath)
}

export const getStoredInterviewStreamCheckpoint = (
  sessionId: string,
  threadId: string,
  idempotentKey: string
) => checkpointStore.get(buildStoreKey(sessionId, threadId, idempotentKey)) || null

export const getLatestStoredInterviewStreamCheckpoint = (
  sessionId: string,
  threadId: string
) => {
  return [...checkpointStore.values()]
    .filter(item => item.sessionId === sessionId && item.threadId === threadId)
    .sort((left, right) => (left.updatedAt < right.updatedAt ? 1 : -1))[0] || null
}

export const upsertInterviewStreamCheckpointStart = (payload: {
  sessionId: string
  threadId: string
  messageId: string
  idempotentKey: string
  owner?: string
}) => {
  const now = new Date().toISOString()
  const existing = getStoredInterviewStreamCheckpoint(payload.sessionId, payload.threadId, payload.idempotentKey)

  const nextCheckpoint: StoredInterviewStreamCheckpoint = {
    sessionId: payload.sessionId,
    threadId: payload.threadId,
    messageId: payload.messageId,
    idempotentKey: payload.idempotentKey,
    owner: payload.owner || existing?.owner,
    status: 'streaming',
    content: '',
    lastSequence: 0,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }

  checkpointStore.set(
    buildStoreKey(payload.sessionId, payload.threadId, payload.idempotentKey),
    nextCheckpoint
  )
  persistCheckpointStore()

  return nextCheckpoint
}

export const appendInterviewStreamCheckpointChunk = (payload: {
  sessionId: string
  threadId: string
  idempotentKey: string
  chunk: string
}) => {
  const existing = getStoredInterviewStreamCheckpoint(payload.sessionId, payload.threadId, payload.idempotentKey)
  if (!existing) return null

  existing.content += payload.chunk
  existing.lastSequence += 1
  existing.updatedAt = new Date().toISOString()
  persistCheckpointStore()

  return existing
}

export const completeInterviewStreamCheckpoint = (payload: {
  sessionId: string
  threadId: string
  idempotentKey: string
}) => {
  const existing = getStoredInterviewStreamCheckpoint(payload.sessionId, payload.threadId, payload.idempotentKey)
  if (!existing) return null

  const now = new Date().toISOString()
  existing.status = 'done'
  existing.updatedAt = now
  existing.completedAt = now
  existing.errorCode = undefined
  existing.errorMessage = undefined
  persistCheckpointStore()

  return existing
}

export const failInterviewStreamCheckpoint = (payload: {
  sessionId: string
  threadId: string
  idempotentKey: string
  code: string
  message: string
  status: 'error' | 'aborted'
}) => {
  const existing = getStoredInterviewStreamCheckpoint(payload.sessionId, payload.threadId, payload.idempotentKey)
  if (!existing) return null

  existing.status = payload.status
  existing.updatedAt = new Date().toISOString()
  existing.errorCode = payload.code
  existing.errorMessage = payload.message
  persistCheckpointStore()

  return existing
}

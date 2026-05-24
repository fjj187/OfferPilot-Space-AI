import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { InterviewStreamRequest } from '../types/interview.js'
import { backendEnv } from '../utils/env.js'

interface StoredInterviewMessage {
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface StoredInterviewSession {
  sessionId: string
  threadId: string
  topic: string
  questionTitle: string
  feedbackStyle?: string
  messages: StoredInterviewMessage[]
  updatedAt: string
}

interface PersistedInterviewSessionPayload {
  sessions: StoredInterviewSession[]
}

const storageDirPath = path.resolve(process.cwd(), backendEnv.storageDir)
const storageFilePath = path.join(storageDirPath, 'interview-sessions.json')
const temporaryStorageFilePath = `${ storageFilePath }.tmp`

const buildStoreKey = (sessionId: string, threadId: string) => `${ sessionId }::${ threadId }`

const ensureStorageDir = () => {
  mkdirSync(storageDirPath, {
    recursive: true
  })
}

const isStoredInterviewSession = (value: unknown): value is StoredInterviewSession => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as StoredInterviewSession
  return typeof candidate.sessionId === 'string'
    && typeof candidate.threadId === 'string'
    && typeof candidate.topic === 'string'
    && typeof candidate.questionTitle === 'string'
    && typeof candidate.updatedAt === 'string'
    && Array.isArray(candidate.messages)
}

const loadStoredSessions = () => {
  ensureStorageDir()

  if (!existsSync(storageFilePath)) {
    return new Map<string, StoredInterviewSession>()
  }

  try {
    const rawContent = readFileSync(storageFilePath, 'utf8')
    if (!rawContent.trim()) {
      return new Map<string, StoredInterviewSession>()
    }

    const parsed = JSON.parse(rawContent) as Partial<PersistedInterviewSessionPayload>
    const sessions = Array.isArray(parsed.sessions) ? parsed.sessions.filter(isStoredInterviewSession) : []

    return new Map(
      sessions.map(session => [buildStoreKey(session.sessionId, session.threadId), session])
    )
  } catch (error) {
    console.warn('[backend] failed to load interview session store:', error)
    return new Map<string, StoredInterviewSession>()
  }
}

const sessionStore = loadStoredSessions()

const persistSessionStore = () => {
  ensureStorageDir()

  const payload: PersistedInterviewSessionPayload = {
    sessions: [...sessionStore.values()].sort((left, right) => {
      return left.updatedAt < right.updatedAt ? 1 : -1
    })
  }

  writeFileSync(temporaryStorageFilePath, JSON.stringify(payload, null, 2), 'utf8')
  renameSync(temporaryStorageFilePath, storageFilePath)
}

export const recordInterviewUserMessage = (payload: InterviewStreamRequest) => {
  const storeKey = buildStoreKey(payload.sessionId, payload.threadId)
  const existing = sessionStore.get(storeKey)
  const now = new Date().toISOString()

  const nextSession: StoredInterviewSession = existing || {
    sessionId: payload.sessionId,
    threadId: payload.threadId,
    topic: payload.topic,
    questionTitle: payload.questionTitle,
    feedbackStyle: payload.feedbackStyle,
    messages: [],
    updatedAt: now
  }

  nextSession.feedbackStyle = payload.feedbackStyle
  nextSession.updatedAt = now
  nextSession.messages.push({
    role: 'user',
    content: payload.answer,
    createdAt: now
  })

  sessionStore.set(storeKey, nextSession)
  persistSessionStore()
}

export const recordInterviewAssistantMessage = (
  payload: InterviewStreamRequest,
  content: string
) => {
  const storeKey = buildStoreKey(payload.sessionId, payload.threadId)
  const existing = sessionStore.get(storeKey)
  if (!existing) return

  existing.messages.push({
    role: 'assistant',
    content,
    createdAt: new Date().toISOString()
  })
  existing.updatedAt = new Date().toISOString()

  persistSessionStore()
}

export const getStoredInterviewSessions = () => {
  return [...sessionStore.values()].sort((left, right) => {
    return left.updatedAt < right.updatedAt ? 1 : -1
  })
}

export const getInterviewSessionStoreFilePath = () => storageFilePath

export const getStoredInterviewSession = (sessionId: string, threadId: string) => {
  return sessionStore.get(buildStoreKey(sessionId, threadId)) || null
}

export const getStoredInterviewSessionsBySessionId = (sessionId: string) => {
  return [...sessionStore.values()]
    .filter(session => session.sessionId === sessionId)
    .sort((left, right) => (left.updatedAt < right.updatedAt ? -1 : 1))
}

export const clearAllStoredInterviewSessions = () => {
  sessionStore.clear()
  persistSessionStore()
}

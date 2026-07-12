import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { ResourceQuestionRecord } from '../types/resource-question.js'
import { backendEnv } from '../utils/env.js'

interface PersistedResourceQuestionPayload {
  resources: ResourceQuestionRecord[]
}

const storageDirPath = path.resolve(process.cwd(), backendEnv.storageDir)
const storageFilePath = path.join(storageDirPath, 'resource-question-store.json')
const temporaryStorageFilePath = `${ storageFilePath }.tmp`

const ensureStorageDir = () => {
  mkdirSync(storageDirPath, {
    recursive: true
  })
}

const isResourceQuestionRecord = (value: unknown): value is ResourceQuestionRecord => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as ResourceQuestionRecord
  return typeof candidate.resourceId === 'string'
    && typeof candidate.title === 'string'
    && typeof candidate.rawText === 'string'
    && typeof candidate.summary === 'string'
    && typeof candidate.analyzeStatus === 'string'
    && Array.isArray(candidate.chunks)
    && Array.isArray(candidate.knowledgePoints)
    && Array.isArray(candidate.questionSeeds)
    && Array.isArray(candidate.generatedQuestions)
    && typeof candidate.createdAt === 'string'
    && typeof candidate.updatedAt === 'string'
}

const loadResourceQuestionStore = () => {
  ensureStorageDir()

  if (!existsSync(storageFilePath)) {
    return new Map<string, ResourceQuestionRecord>()
  }

  try {
    const rawContent = readFileSync(storageFilePath, 'utf8')
    if (!rawContent.trim()) {
      return new Map<string, ResourceQuestionRecord>()
    }

    const parsed = JSON.parse(rawContent) as Partial<PersistedResourceQuestionPayload>
    const resources = Array.isArray(parsed.resources) ? parsed.resources.filter(isResourceQuestionRecord) : []
    return new Map(resources.map(resource => [resource.resourceId, resource]))
  }
  catch (error) {
    console.warn('[backend] failed to load resource question store:', error)
    return new Map<string, ResourceQuestionRecord>()
  }
}

const resourceQuestionStore = loadResourceQuestionStore()

const persistResourceQuestionStore = () => {
  ensureStorageDir()

  const payload: PersistedResourceQuestionPayload = {
    resources: [...resourceQuestionStore.values()].sort((left, right) => (
      left.updatedAt < right.updatedAt ? 1 : -1
    ))
  }

  writeFileSync(temporaryStorageFilePath, JSON.stringify(payload, null, 2), 'utf8')
  renameSync(temporaryStorageFilePath, storageFilePath)
}

export const getStoredResourceQuestionRecord = (resourceId: string) => {
  return resourceQuestionStore.get(resourceId) || null
}

export const upsertStoredResourceQuestionRecord = (record: ResourceQuestionRecord) => {
  const existing = resourceQuestionStore.get(record.resourceId)
  resourceQuestionStore.set(record.resourceId, {
    ...record,
    createdAt: existing?.createdAt || record.createdAt,
    updatedAt: record.updatedAt
  })
  persistResourceQuestionStore()
  return resourceQuestionStore.get(record.resourceId) || record
}

export const getResourceQuestionStoreFilePath = () => storageFilePath

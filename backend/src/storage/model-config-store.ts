import crypto from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { StoredModelConfig } from '../types/model-config.js'
import { backendEnv } from '../utils/env.js'

interface PersistedModelConfigPayload {
  models: StoredModelConfig[]
}

const storageDirPath = path.resolve(process.cwd(), backendEnv.storageDir)
const storageFilePath = path.join(storageDirPath, 'model-configs.json')
const temporaryStorageFilePath = `${ storageFilePath }.tmp`

const ensureStorageDir = () => {
  mkdirSync(storageDirPath, {
    recursive: true
  })
}

const isStoredModelConfig = (value: unknown): value is StoredModelConfig => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as StoredModelConfig
  return typeof candidate.modelId === 'string'
    && typeof candidate.displayName === 'string'
    && typeof candidate.provider === 'string'
    && typeof candidate.baseUrl === 'string'
    && typeof candidate.modelName === 'string'
    && typeof candidate.enabled === 'boolean'
    && typeof candidate.isDefault === 'boolean'
    && typeof candidate.supportsStream === 'boolean'
    && typeof candidate.enableThinking === 'boolean'
    && typeof candidate.createdAt === 'string'
    && typeof candidate.updatedAt === 'string'
}

const loadStoredModelConfigs = () => {
  ensureStorageDir()

  if (!existsSync(storageFilePath)) {
    return new Map<string, StoredModelConfig>()
  }

  try {
    const rawContent = readFileSync(storageFilePath, 'utf8')
    if (!rawContent.trim()) {
      return new Map<string, StoredModelConfig>()
    }

    const parsed = JSON.parse(rawContent) as Partial<PersistedModelConfigPayload>
    const models = Array.isArray(parsed.models) ? parsed.models.filter(isStoredModelConfig) : []

    return new Map(models.map(model => [model.modelId, model]))
  }
  catch (error) {
    console.warn('[backend] failed to load model config store:', error)
    return new Map<string, StoredModelConfig>()
  }
}

const modelConfigStore = loadStoredModelConfigs()

const persistModelConfigStore = () => {
  ensureStorageDir()

  const payload: PersistedModelConfigPayload = {
    models: [...modelConfigStore.values()].sort((left, right) => {
      return left.updatedAt < right.updatedAt ? 1 : -1
    })
  }

  writeFileSync(temporaryStorageFilePath, JSON.stringify(payload, null, 2), 'utf8')
  renameSync(temporaryStorageFilePath, storageFilePath)
}

export const getStoredModelConfigs = () => {
  return [...modelConfigStore.values()].sort((left, right) => {
    if (left.isDefault !== right.isDefault) return left.isDefault ? -1 : 1
    return left.updatedAt < right.updatedAt ? 1 : -1
  })
}

export const getStoredModelConfig = (modelId: string) => {
  return modelConfigStore.get(modelId) || null
}

export const upsertStoredModelConfig = (modelConfig: StoredModelConfig) => {
  modelConfigStore.set(modelConfig.modelId, modelConfig)
  persistModelConfigStore()
  return modelConfig
}

export const updateStoredModelConfigs = (updater: (models: StoredModelConfig[]) => StoredModelConfig[]) => {
  const nextModels = updater(getStoredModelConfigs())
  modelConfigStore.clear()
  nextModels.forEach(model => modelConfigStore.set(model.modelId, model))
  persistModelConfigStore()
  return getStoredModelConfigs()
}

export const createModelId = () => `model_${ crypto.randomUUID().replace(/-/g, '').slice(0, 12) }`

export const createApiKeyPreview = (apiKey: string) => {
  const normalized = apiKey.trim()
  if (!normalized) return ''
  if (normalized.length <= 8) return `${ normalized.slice(0, 2) }***`
  return `${ normalized.slice(0, 3) }***${ normalized.slice(-4) }`
}

export const encodeApiKey = (apiKey: string) => Buffer.from(apiKey, 'utf8').toString('base64')

export const decodeApiKey = (encodedApiKey?: string) => {
  if (!encodedApiKey) return ''

  try {
    return Buffer.from(encodedApiKey, 'base64').toString('utf8')
  }
  catch {
    return ''
  }
}

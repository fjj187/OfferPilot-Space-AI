import { decodeApiKey, getStoredModelConfigs } from '../storage/model-config-store.js'
import type { ModelProvider } from '../types/model-config.js'
import { backendEnv } from '../utils/env.js'

export interface RuntimeModelConfig {
  modelId?: string
  displayName: string
  provider: ModelProvider
  baseUrl: string
  modelName: string
  apiKey?: string
  supportsStream: boolean
  enableThinking: boolean
  source: 'admin' | 'env'
}

const findEnabledDefaultModel = () => {
  return getStoredModelConfigs().find(model => model.enabled && model.isDefault) || null
}

const findFallbackEnabledModel = (excludedModelId?: string) => {
  return getStoredModelConfigs().find(model => model.enabled && model.modelId !== excludedModelId) || null
}

const buildRuntimeModelFromStore = (modelId?: string): RuntimeModelConfig | null => {
  const matchedModel = modelId
    ? getStoredModelConfigs().find(model => model.modelId === modelId) || null
    : null

  if (matchedModel) {
    if (!matchedModel.enabled) {
      throw new Error('指定模型已停用，无法用于当前请求')
    }

    return {
      modelId: matchedModel.modelId,
      displayName: matchedModel.displayName,
      provider: matchedModel.provider,
      baseUrl: matchedModel.baseUrl,
      modelName: matchedModel.modelName,
      apiKey: decodeApiKey(matchedModel.encryptedApiKey),
      supportsStream: matchedModel.supportsStream,
      enableThinking: matchedModel.enableThinking,
      source: 'admin'
    }
  }

  const defaultModel = findEnabledDefaultModel()
  if (defaultModel) {
    return {
      modelId: defaultModel.modelId,
      displayName: defaultModel.displayName,
      provider: defaultModel.provider,
      baseUrl: defaultModel.baseUrl,
      modelName: defaultModel.modelName,
      apiKey: decodeApiKey(defaultModel.encryptedApiKey),
      supportsStream: defaultModel.supportsStream,
      enableThinking: defaultModel.enableThinking,
      source: 'admin'
    }
  }

  const fallbackEnabledModel = findFallbackEnabledModel()
  if (fallbackEnabledModel) {
    return {
      modelId: fallbackEnabledModel.modelId,
      displayName: fallbackEnabledModel.displayName,
      provider: fallbackEnabledModel.provider,
      baseUrl: fallbackEnabledModel.baseUrl,
      modelName: fallbackEnabledModel.modelName,
      apiKey: decodeApiKey(fallbackEnabledModel.encryptedApiKey),
      supportsStream: fallbackEnabledModel.supportsStream,
      enableThinking: fallbackEnabledModel.enableThinking,
      source: 'admin'
    }
  }

  return null
}

const buildRuntimeModelFromEnv = (): RuntimeModelConfig | null => {
  if (!backendEnv.remoteBaseUrl || !backendEnv.remoteModel || !backendEnv.remoteApiKey) {
    return null
  }

  return {
    displayName: backendEnv.remoteModel,
    provider: backendEnv.remoteVendor as ModelProvider,
    baseUrl: backendEnv.remoteBaseUrl,
    modelName: backendEnv.remoteModel,
    apiKey: backendEnv.remoteApiKey,
    supportsStream: true,
    enableThinking: backendEnv.remoteEnableThinking,
    source: 'env'
  }
}

export const resolveActiveModelConfig = (requestedModelId?: string): RuntimeModelConfig => {
  const runtimeModelFromStore = buildRuntimeModelFromStore(requestedModelId)
  if (runtimeModelFromStore) {
    return runtimeModelFromStore
  }

  const runtimeModelFromEnv = buildRuntimeModelFromEnv()
  if (runtimeModelFromEnv) {
    return runtimeModelFromEnv
  }

  throw new Error('当前没有可用的远程模型配置，请先在后台启用模型或补充 INTERVIEW_REMOTE_* 环境变量')
}

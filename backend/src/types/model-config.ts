export type ModelProvider =
  | 'openai-compatible'
  | 'deepseek'
  | 'moonshot'
  | 'qwen'
  | 'ollama'
  | 'custom'

export type ModelTestStatus = 'success' | 'failed'

export interface StoredModelConfig {
  modelId: string
  displayName: string
  provider: ModelProvider
  baseUrl: string
  modelName: string
  encryptedApiKey?: string
  apiKeyPreview?: string
  enabled: boolean
  isDefault: boolean
  supportsStream: boolean
  enableThinking: boolean
  createdAt: string
  updatedAt: string
  lastTestedAt?: string
  lastTestStatus?: ModelTestStatus
  lastTestMessage?: string
}

export interface AdminModelConfigDTO {
  modelId: string
  displayName: string
  provider: ModelProvider
  baseUrl: string
  modelName: string
  apiKeyPreview?: string
  enabled: boolean
  isDefault: boolean
  supportsStream: boolean
  enableThinking: boolean
  createdAt: string
  updatedAt: string
  lastTestedAt?: string
  lastTestStatus?: ModelTestStatus
  lastTestMessage?: string
}

export interface EnabledModelConfigDTO {
  modelId: string
  displayName: string
  provider: ModelProvider
  isDefault: boolean
}

export interface CreateModelConfigPayload {
  displayName: string
  provider: ModelProvider
  baseUrl: string
  modelName: string
  apiKey?: string
  enabled?: boolean
  isDefault?: boolean
  supportsStream?: boolean
  enableThinking?: boolean
}

export interface UpdateModelConfigPayload extends CreateModelConfigPayload {}

export interface UpdateModelStatusPayload {
  enabled: boolean
}

export interface ModelConnectivityTestResult {
  ok: boolean
  latencyMs: number
  message: string
  checkedAt: string
}

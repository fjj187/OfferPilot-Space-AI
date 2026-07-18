import request from '@/services/http/request'

export type EnabledModelProvider =
  | 'openai-compatible'
  | 'deepseek'
  | 'moonshot'
  | 'qwen'
  | 'ollama'
  | 'custom'

export interface EnabledModelListItem {
  modelId: string
  displayName: string
  provider: EnabledModelProvider
  isDefault: boolean
}

const resolveModelApiBase = () => {
  const configuredBase = import.meta.env.VITE_MODEL_API_BASE_URL?.trim() || ''
  if (configuredBase) return configuredBase.replace(/\/$/, '')
  if (import.meta.env.DEV) {
    return `${ window.location.origin }/api/models`
  }
  return ''
}

const normalizeApiPath = (apiBase: string, path: string) => `${ apiBase }${ path }`

export const listEnabledModels = async () => {
  const apiBase = resolveModelApiBase()
  if (!apiBase) return []

  const response = await request.get(
    normalizeApiPath(apiBase, '/enabled'),
    undefined,
    {
      requestName: 'listEnabledModels'
    }
  )

  if (response.error !== 0) {
    throw new Error(response.msg || '获取启用模型列表失败')
  }

  const payload = response.data as {
    models?: EnabledModelListItem[]
  }
  return Array.isArray(payload.models) ? payload.models : []
}

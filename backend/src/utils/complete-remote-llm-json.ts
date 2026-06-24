import { resolveActiveModelConfig } from '../services/model-config-resolver.js'

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const createOpenAICompatibleUrl = (baseUrl: string) => {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  return `${ normalizedBaseUrl }/chat/completions`
}

export const isRemoteLlmConfigured = (requestedModelId?: string) => {
  try {
    return Boolean(resolveActiveModelConfig(requestedModelId))
  } catch {
    return false
  }
}

export const completeRemoteLlmJson = async (
  messages: ChatMessage[],
  options?: { signal?: AbortSignal, modelId?: string }
): Promise<string> => {
  const runtimeModelConfig = resolveActiveModelConfig(options?.modelId)

  if (!runtimeModelConfig.apiKey) {
    throw new Error(`当前模型 ${ runtimeModelConfig.displayName } 缺少 apiKey（接口密钥）配置。`)
  }

  const response = await fetch(createOpenAICompatibleUrl(runtimeModelConfig.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ runtimeModelConfig.apiKey }`
    },
    signal: options?.signal,
    body: JSON.stringify({
      model: runtimeModelConfig.modelName,
      stream: false,
      messages,
      temperature: 0.4,
      enable_thinking: runtimeModelConfig.enableThinking
    })
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(errorText || `Remote LLM request failed: ${ response.status }`)
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>
    error?: { message?: string }
  }

  if (payload.error?.message) {
    throw new Error(payload.error.message)
  }

  const content = payload.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('Remote LLM returned empty content.')
  }
  return content
}

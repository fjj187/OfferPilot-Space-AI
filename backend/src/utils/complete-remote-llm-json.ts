import { backendEnv } from './env.js'

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const createOpenAICompatibleUrl = () => {
  const baseUrl = backendEnv.remoteBaseUrl.replace(/\/+$/, '')
  return `${ baseUrl }/chat/completions`
}

export const isRemoteLlmConfigured = () => Boolean(backendEnv.remoteApiKey && backendEnv.remoteModel)

export const completeRemoteLlmJson = async (
  messages: ChatMessage[],
  options?: { signal?: AbortSignal }
): Promise<string> => {
  if (!backendEnv.remoteApiKey) {
    throw new Error('INTERVIEW_REMOTE_API_KEY is not configured.')
  }
  if (!backendEnv.remoteModel) {
    throw new Error('INTERVIEW_REMOTE_MODEL is not configured.')
  }

  const response = await fetch(createOpenAICompatibleUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ backendEnv.remoteApiKey }`
    },
    signal: options?.signal,
    body: JSON.stringify({
      model: backendEnv.remoteModel,
      stream: false,
      messages,
      temperature: 0.4,
      enable_thinking: false
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

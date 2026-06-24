import { buildInterviewLlmMessages } from '../utils/build-interview-llm-messages.js'
import type { InterviewProvider, InterviewProviderStreamOptions } from './llm-provider.js'
import type { InterviewProviderEvent, InterviewStreamRequest } from '../types/interview.js'
import { resolveActiveModelConfig } from '../services/model-config-resolver.js'

type OpenAICompatibleChunk = {
  choices?: Array<{
    delta?: {
      content?: string
    }
    finish_reason?: string | null
  }>
  error?: {
    message?: string
    code?: string
  }
}

const extractContentDelta = (payload: OpenAICompatibleChunk) => {
  return payload.choices
    ?.map(choice => choice.delta?.content || '')
    .join('') || ''
}

const createOpenAICompatibleUrl = (baseUrl: string) => {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')
  return `${ normalizedBaseUrl }/chat/completions`
}

export class RemoteLLMProvider implements InterviewProvider {
  async *streamInterview(
    request: InterviewStreamRequest,
    options?: InterviewProviderStreamOptions
  ): AsyncGenerator<InterviewProviderEvent, void, undefined> {
    let runtimeModelConfig

    try {
      runtimeModelConfig = resolveActiveModelConfig(request.modelId)
    }
    catch (error) {
      yield {
        type: 'error',
        code: 'REMOTE_MODEL_CONFIG_MISSING',
        message: error instanceof Error ? error.message : 'Remote model config is missing.'
      }
      return
    }

    if (!runtimeModelConfig.supportsStream) {
      yield {
        type: 'error',
        code: 'REMOTE_MODEL_STREAM_UNSUPPORTED',
        message: `当前模型 ${ runtimeModelConfig.displayName } 未开启流式能力，无法用于模拟面试。`
      }
      return
    }

    if (!runtimeModelConfig.apiKey) {
      yield {
        type: 'error',
        code: 'REMOTE_API_KEY_MISSING',
        message: `当前模型 ${ runtimeModelConfig.displayName } 缺少 apiKey（接口密钥）配置。`
      }
      return
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
        stream: true,
        messages: buildInterviewLlmMessages(request),
        temperature: 0.7,
        enable_thinking: runtimeModelConfig.enableThinking
      })
    })

    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => '')
      yield {
        type: 'error',
        code: `REMOTE_HTTP_${ response.status }`,
        message: errorText || `Remote provider request failed with status ${ response.status }.`
      }
      return
    }

    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader()
    let buffer = ''

    try {
      while (true) {
        if (options?.signal?.aborted) {
          return
        }

        const { value, done } = await reader.read()
        if (done) break
        if (!value) continue

        buffer += value
        const frames = buffer.split('\n\n')
        buffer = frames.pop() || ''

        for (const frame of frames) {
          const lines = frame.split('\n')
          let dataText = ''

          for (const line of lines) {
            if (!line.startsWith('data:')) continue
            dataText += line.slice('data:'.length).trim()
          }

          if (!dataText) continue
          if (dataText === '[DONE]') {
            yield {
              type: 'done'
            }
            return
          }

          let payload: OpenAICompatibleChunk

          try {
            payload = JSON.parse(dataText) as OpenAICompatibleChunk
          } catch {
            continue
          }

          if (payload.error?.message) {
            yield {
              type: 'error',
              code: payload.error.code || 'REMOTE_STREAM_ERROR',
              message: payload.error.message
            }
            return
          }

          const contentDelta = extractContentDelta(payload)
          if (!contentDelta) continue

          yield {
            type: 'chunk',
            content: contentDelta
          }
        }
      }

      yield {
        type: 'done'
      }
    } finally {
      await reader.cancel().catch(() => undefined)
      reader.releaseLock()
    }
  }
}

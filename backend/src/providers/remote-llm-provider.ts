import { buildInterviewLlmMessages } from '../utils/build-interview-llm-messages.js'
import { backendEnv } from '../utils/env.js'
import type { InterviewProvider, InterviewProviderStreamOptions } from './llm-provider.js'
import type { InterviewProviderEvent, InterviewStreamRequest } from '../types/interview.js'

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

const createOpenAICompatibleUrl = () => {
  const baseUrl = backendEnv.remoteBaseUrl.replace(/\/+$/, '')
  return `${ baseUrl }/chat/completions`
}

export class RemoteLLMProvider implements InterviewProvider {
  async *streamInterview(
    request: InterviewStreamRequest,
    options?: InterviewProviderStreamOptions
  ): AsyncGenerator<InterviewProviderEvent, void, undefined> {
    if (!backendEnv.remoteApiKey) {
      yield {
        type: 'error',
        code: 'REMOTE_API_KEY_MISSING',
        message: 'INTERVIEW_REMOTE_API_KEY is not configured.'
      }
      return
    }

    if (!backendEnv.remoteModel) {
      yield {
        type: 'error',
        code: 'REMOTE_MODEL_MISSING',
        message: 'INTERVIEW_REMOTE_MODEL is not configured.'
      }
      return
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
        stream: true,
        messages: buildInterviewLlmMessages(request),
        temperature: 0.7,
        enable_thinking: backendEnv.remoteEnableThinking
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

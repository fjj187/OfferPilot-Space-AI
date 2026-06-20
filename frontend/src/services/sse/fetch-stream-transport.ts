export type FetchStreamErrorKind = 'abort' | 'network' | 'http' | 'empty-body' | 'unknown'

export interface FetchStreamTransportError extends Error {
  code: string
  kind: FetchStreamErrorKind
  retryable: boolean
  status?: number
}

interface FetchStreamReaderOptions {
  endpoint: string
  body: unknown
  signal?: AbortSignal
}

const createTransportError = (
  message: string,
  code: string,
  kind: FetchStreamErrorKind,
  retryable: boolean,
  status?: number
): FetchStreamTransportError => {
  const error = new Error(message) as FetchStreamTransportError
  error.name = 'FetchStreamTransportError'
  error.code = code
  error.kind = kind
  error.retryable = retryable
  error.status = status

  return error
}

export const isFetchStreamTransportError = (error: unknown): error is FetchStreamTransportError => (
  error instanceof Error
  && error.name === 'FetchStreamTransportError'
  && 'code' in error
  && 'kind' in error
)

export const classifyFetchStreamError = (error: unknown): FetchStreamTransportError => {
  if (isFetchStreamTransportError(error)) return error

  if (error instanceof DOMException && error.name === 'AbortError') {
    return createTransportError('流式请求已取消。', 'ABORTED', 'abort', false)
  }

  if (error instanceof TypeError) {
    return createTransportError('网络连接异常，请检查后重试。', 'NETWORK_ERROR', 'network', true)
  }

  if (error instanceof Error) {
    return createTransportError(error.message || '流式请求失败。', 'STREAM_ERROR', 'unknown', true)
  }

  return createTransportError('流式请求失败。', 'STREAM_ERROR', 'unknown', true)
}

export const createFetchStreamReader = async ({
  endpoint,
  body,
  signal
}: FetchStreamReaderOptions): Promise<ReadableStreamDefaultReader<string>> => {
  let response: Response

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal
    })
  } catch (error) {
    throw classifyFetchStreamError(error)
  }

  if (!response.ok) {
    throw createTransportError(
      `Interview stream request failed: ${ response.status }`,
      `HTTP_${ response.status }`,
      'http',
      response.status >= 500 || response.status === 408 || response.status === 429,
      response.status
    )
  }

  if (!response.body) {
    throw createTransportError(
      'Interview stream response body is empty.',
      'EMPTY_BODY',
      'empty-body',
      true
    )
  }

  return response.body
    .pipeThrough(new TextDecoderStream())
    .getReader()
}

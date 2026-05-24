interface StreamTextClientOptions {
  signal?: AbortSignal
  createReader: (signal?: AbortSignal) => Promise<ReadableStreamDefaultReader<string>>
  onStart?: () => void
  onChunk: (chunk: string) => void
  onDone?: () => void
  onError?: (error: Error) => void
}

interface SSEFrame {
  event: string
  data: string
}

interface SSEClientOptions {
  signal?: AbortSignal
  createReader: (signal?: AbortSignal) => Promise<ReadableStreamDefaultReader<string>>
  onStart?: () => void
  onEvent: (frame: SSEFrame) => void
  onDone?: () => void
  onError?: (error: Error) => void
}

const splitSSEFrames = (buffer: string) => {
  const normalizedBuffer = buffer.replace(/\r/g, '')
  const delimiter = '\n\n'
  const frames: string[] = []
  let remaining = normalizedBuffer

  while (remaining.includes(delimiter)) {
    const delimiterIndex = remaining.indexOf(delimiter)
    frames.push(remaining.slice(0, delimiterIndex))
    remaining = remaining.slice(delimiterIndex + delimiter.length)
  }

  return {
    frames,
    remaining
  }
}

const parseSSEFrame = (frameText: string): SSEFrame | null => {
  const lines = frameText.split('\n').map(item => item.trim()).filter(Boolean)
  if (!lines.length) return null

  let event = 'message'
  const dataLines: string[] = []

  lines.forEach((line) => {
    if (line.startsWith(':')) return
    if (line.startsWith('event:')) {
      event = line.replace(/^event:\s*/, '').trim() || 'message'
      return
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.replace(/^data:\s*/, ''))
    }
  })

  return {
    event,
    data: dataLines.join('\n')
  }
}

export const consumeStreamText = async ({
  signal,
  createReader,
  onStart,
  onChunk,
  onDone,
  onError
}: StreamTextClientOptions) => {
  let reader: ReadableStreamDefaultReader<string> | null = null

  try {
    reader = await createReader(signal)
    onStart?.()

    while (true) {
      if (signal?.aborted) {
        throw new DOMException('Stream aborted', 'AbortError')
      }

      const { value, done } = await reader.read()
      if (done) break
      if (typeof value === 'string') {
        onChunk(value)
      }
    }

    onDone?.()
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error('Unknown stream error')

    if (normalizedError.name !== 'AbortError') {
      onError?.(normalizedError)
    }
  } finally {
    await reader?.cancel().catch(() => undefined)
    reader?.releaseLock()
  }
}

export const consumeSSEStream = async ({
  signal,
  createReader,
  onStart,
  onEvent,
  onDone,
  onError
}: SSEClientOptions) => {
  let reader: ReadableStreamDefaultReader<string> | null = null
  let buffer = ''

  try {
    reader = await createReader(signal)
    onStart?.()

    while (true) {
      if (signal?.aborted) {
        throw new DOMException('Stream aborted', 'AbortError')
      }

      const { value, done } = await reader.read()
      if (done) break
      if (typeof value !== 'string') continue

      buffer += value
      const { frames, remaining } = splitSSEFrames(buffer)
      buffer = remaining

      frames.forEach((frameText) => {
        const frame = parseSSEFrame(frameText)
        if (frame) {
          onEvent(frame)
        }
      })
    }

    if (buffer.trim()) {
      const trailingFrame = parseSSEFrame(buffer)
      if (trailingFrame) {
        onEvent(trailingFrame)
      }
    }

    onDone?.()
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error('Unknown stream error')

    if (normalizedError.name !== 'AbortError') {
      onError?.(normalizedError)
    }
  } finally {
    await reader?.cancel().catch(() => undefined)
    reader?.releaseLock()
  }
}

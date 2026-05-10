interface StreamTextClientOptions {
  signal?: AbortSignal
  createReader: (signal?: AbortSignal) => Promise<ReadableStreamDefaultReader<string>>
  onStart?: () => void
  onChunk: (chunk: string) => void
  onDone?: () => void
  onError?: (error: Error) => void
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

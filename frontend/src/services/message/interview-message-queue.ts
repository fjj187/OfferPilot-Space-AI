type FlushHandler = (delta: string) => void

export class InterviewMessageQueue {
  private buffers = new Map<string, string[]>()
  private handlers = new Map<string, FlushHandler>()
  private frameId: number | null = null

  register(messageId: string, handler: FlushHandler) {
    this.handlers.set(messageId, handler)
  }

  unregister(messageId: string) {
    this.handlers.delete(messageId)
    this.buffers.delete(messageId)

    if (!this.buffers.size && this.frameId !== null) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }

  enqueue(messageId: string, delta: string) {
    if (!delta) return

    const nextBuffer = this.buffers.get(messageId) || []
    nextBuffer.push(delta)
    this.buffers.set(messageId, nextBuffer)
    this.scheduleFlush()
  }

  flushNow(messageId?: string) {
    if (messageId) {
      this.flushMessage(messageId)
      return
    }

    Array.from(this.buffers.keys()).forEach(id => this.flushMessage(id))
  }

  clear() {
    this.buffers.clear()
    this.handlers.clear()

    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }

  private scheduleFlush() {
    if (this.frameId !== null) return

    this.frameId = requestAnimationFrame(() => {
      this.frameId = null
      this.flushNow()

      if (this.buffers.size) {
        this.scheduleFlush()
      }
    })
  }

  private flushMessage(messageId: string) {
    const buffer = this.buffers.get(messageId)
    const handler = this.handlers.get(messageId)

    if (!buffer?.length || !handler) return

    this.buffers.delete(messageId)
    handler(buffer.join(''))
  }
}

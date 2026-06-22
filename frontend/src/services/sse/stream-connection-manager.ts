import type { StreamConnectionSnapshot, StreamConnectionStatus } from './sse-types'

export class StreamConnectionManager {
  private controller: AbortController | null = null
  private status: StreamConnectionStatus = 'idle'
  private lastActivityAt: number | null = null
  private lastErrorAt: number | null = null

  open() {
    this.controller?.abort()
    this.controller = new AbortController()
    this.status = 'connecting'
    this.lastActivityAt = null
    this.lastErrorAt = null

    return this.controller.signal
  }

  markActive() {
    this.lastActivityAt = Date.now()
    this.status = 'active'
  }

  markInactive() {
    if (this.status === 'closed' || this.status === 'aborted' || this.status === 'error') return
    this.status = 'inactive'
  }

  markClosed() {
    this.status = 'closed'
  }

  markError() {
    this.status = 'error'
    this.lastErrorAt = Date.now()
  }

  abort() {
    this.controller?.abort()
    this.status = 'aborted'
  }

  getSnapshot(): StreamConnectionSnapshot {
    return {
      status: this.status,
      lastActivityAt: this.lastActivityAt,
      lastErrorAt: this.lastErrorAt,
      isAborted: this.controller?.signal.aborted ?? this.status === 'aborted'
    }
  }
}

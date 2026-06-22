import type { StreamConnectionSnapshot, StreamHeartbeatState } from './sse-types'

interface StreamHeartbeatOptions {
  getSnapshot: () => StreamConnectionSnapshot
  inactiveTimeoutMs?: number
  onHeartbeat: (state: StreamHeartbeatState) => void
}

export const createStreamHeartbeat = ({
  getSnapshot,
  inactiveTimeoutMs = 15000,
  onHeartbeat
}: StreamHeartbeatOptions) => {
  let timer: ReturnType<typeof window.setInterval> | null = null

  const emit = () => {
    const snapshot = getSnapshot()
    const inactive = snapshot.status === 'active'
      && !!snapshot.lastActivityAt
      && Date.now() - snapshot.lastActivityAt > inactiveTimeoutMs

    onHeartbeat({
      status: inactive ? 'inactive' : snapshot.status,
      lastActivityAt: snapshot.lastActivityAt,
      inactive
    })
  }

  return {
    start() {
      this.stop()
      emit()
      timer = window.setInterval(emit, 1000)
    },
    stop() {
      if (!timer) return
      window.clearInterval(timer)
      timer = null
    }
  }
}

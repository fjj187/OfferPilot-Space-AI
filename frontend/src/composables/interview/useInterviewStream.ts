import type { InterviewMessage, InterviewMessageFormat, InterviewMessageRole } from '@/types/message'
import { parseInterviewStreamChunk } from '@/services/message/interview-message-parser'
import { createInterviewStreamMessageFinalizer } from '@/services/message/interview-stream-message-finalizer'
import { InterviewMessageQueue } from '@/services/message/interview-message-queue'
import { startInterviewStream } from '@/services/sse/interview-stream'
import { restoreInterviewStreamFromCheckpoint } from '@/services/sse/interview-stream-checkpoint-recovery'
import { resolveInterviewStreamErrorMessage } from '@/services/sse/interview-stream-error'
import {
  buildInterviewStreamRecoveryHint,
  clearPendingInterviewStreamRecovery,
  getPendingInterviewStreamRecovery,
  setPendingInterviewStreamRecovery
} from '@/services/sse/interview-stream-recovery'
import { createStreamHeartbeat } from '@/services/sse/stream-heartbeat'
import {
  clearPersistedInterviewMessages,
  getPersistedInterviewMessages,
  setPersistedInterviewMessages
} from '@/services/storage/interview-message-store'
import type { InterviewStreamLaunchPayload, InterviewStreamMode, InterviewStreamTask } from '@/services/sse/sse-types'

type StartInterviewStreamParams = InterviewStreamLaunchPayload

interface RetryableStreamState {
  messageId: string
  params: StartInterviewStreamParams
  reason: 'error' | 'aborted' | 'interrupted'
}

interface StopStreamOptions {
  preserveRecovery?: boolean
}

const createMessageId = () => `local-${ Date.now() }-${ Math.random().toString(36).slice(2, 8) }`

const createMessage = (
  role: InterviewMessageRole,
  content: string,
  threadId: string,
  format: InterviewMessageFormat = 'plain',
  status: InterviewMessage['status'] = 'done'
): InterviewMessage => ({
  id: createMessageId(),
  threadId,
  role,
  content,
  displayContent: content,
  format,
  status,
  createdAt: new Date().toISOString()
})

const cloneStreamParams = (params: StartInterviewStreamParams): StartInterviewStreamParams => ({
  ...params,
  sourceDocumentTags: params.sourceDocumentTags ? [...params.sourceDocumentTags] : undefined
})

export const useInterviewStream = () => {
  const messages = ref<InterviewMessage[]>([])
  const activeSessionId = ref('')
  const activeThreadId = ref('default')
  const isStreaming = ref(false)
  const streamError = ref('')
  const streamMode = ref<InterviewStreamMode | 'idle'>('idle')
  const activeIdempotentKey = ref('')
  const checkpointSequence = ref(0)
  const pendingRecovery = ref(getPendingInterviewStreamRecovery())
  const createRetryableStateFromPendingRecovery = (sessionId?: string): RetryableStreamState | null => {
    const recovery = pendingRecovery.value
    if (!recovery || (sessionId && recovery.params.sessionId !== sessionId)) return null

    return {
      messageId: recovery.messageId,
      params: cloneStreamParams(recovery.params),
      reason: 'interrupted'
    }
  }
  const retryableState = ref<RetryableStreamState | null>(createRetryableStateFromPendingRecovery())
  const lastStreamActivityAt = ref<number | null>(null)
  const isStreamInactive = ref(false)
  const streamModeLabel = computed(() => {
    if (streamMode.value === 'remote') return '真实 AI 流式'
    if (streamMode.value === 'mock') return '本地模拟流'
    return '未开始'
  })
  const activePendingRecovery = computed(() => {
    const recovery = pendingRecovery.value
    if (!recovery) return null
    if (activeSessionId.value && recovery.params.sessionId !== activeSessionId.value) return null
    return recovery
  })
  const canRetryStream = computed(() => {
    const retry = retryableState.value
    if (!retry || isStreaming.value) return false
    return !activeSessionId.value || retry.params.sessionId === activeSessionId.value
  })
  const streamConnectionHint = computed(() => {
    if (!isStreamInactive.value) return ''
    return '连接可能暂时无响应，正在等待服务端继续返回。请不要重复提交；如最终失败，可使用重试入口重新生成本轮反馈。'
  })
  const retryActionLabel = computed(() => {
    if (retryableState.value?.reason === 'aborted') return '重新生成本轮反馈'
    if (retryableState.value?.reason === 'error') return '重试本轮反馈'
    if (retryableState.value?.reason === 'interrupted') return '恢复本轮反馈'
    return '重试'
  })
  const streamRecoveryHint = computed(() => (
    isStreaming.value ? '' : buildInterviewStreamRecoveryHint(activePendingRecovery.value)
  ))

  const messageQueue = new InterviewMessageQueue()
  const messageFinalizer = createInterviewStreamMessageFinalizer({
    patchMessage: (messageId, updater) => {
      messages.value = messages.value.map(item => (item.id === messageId ? updater(item) : item))
      persistMessages()
    },
    flushMessageQueue: messageId => messageQueue.flushNow(messageId),
    unregisterMessageQueue: messageId => messageQueue.unregister(messageId)
  })
  let activeStreamTask: InterviewStreamTask | null = null
  let activeMessageId = ''
  let activeStreamParams: StartInterviewStreamParams | null = null
  const streamHeartbeat = createStreamHeartbeat({
    getSnapshot: () => activeStreamTask?.getSnapshot() || {
      status: 'idle',
      lastActivityAt: null,
      lastErrorAt: null,
      isAborted: false
    },
    onHeartbeat: state => {
      lastStreamActivityAt.value = state.lastActivityAt
      isStreamInactive.value = state.inactive
    }
  })

  const currentMessages = computed(() => messages.value.filter(item => item.threadId === activeThreadId.value))
  const scrollVersion = computed(() => currentMessages.value.map(item => `${ item.id }:${ item.displayContent.length }:${ item.status }`).join('|'))

  const persistMessages = () => {
    if (!activeSessionId.value) return
    setPersistedInterviewMessages(activeSessionId.value, messages.value)
  }

  const restoreMessages = (sessionId: string) => {
    messages.value = getPersistedInterviewMessages(sessionId)
  }

  const setActiveSessionId = (sessionId: string) => {
    const normalizedSessionId = sessionId.trim()
    if (activeSessionId.value === normalizedSessionId) return
    const recoveredRetryableState = createRetryableStateFromPendingRecovery(normalizedSessionId)
    activeSessionId.value = normalizedSessionId
    restoreMessages(normalizedSessionId)
    streamError.value = ''
    streamMode.value = 'idle'
    retryableState.value = recoveredRetryableState
  }

  const setActiveThreadId = (threadId: string) => {
    activeThreadId.value = threadId || 'default'
  }

  const appendMessage = (message: InterviewMessage) => {
    messages.value = [...messages.value, message]
    persistMessages()
    return message
  }

  const hasMessage = (messageId: string) => messages.value.some(item => item.id === messageId)

  const appendUserMessage = (content: string, threadId = activeThreadId.value) => (
    appendMessage(createMessage('user', content, threadId, 'plain', 'done'))
  )

  const appendAssistantMessage = (content: string, format: InterviewMessageFormat = 'markdown', threadId = activeThreadId.value) => (
    appendMessage(createMessage('assistant', content, threadId, format, 'done'))
  )

  const appendSystemMessage = (content: string, format: InterviewMessageFormat = 'plain', threadId = activeThreadId.value) => (
    appendMessage(createMessage('system', content, threadId, format, 'done'))
  )

  const patchMessage = (messageId: string, updater: (message: InterviewMessage) => InterviewMessage) => {
    messages.value = messages.value.map(item => (item.id === messageId ? updater(item) : item))
    persistMessages()
  }

  const removeMessage = (messageId: string) => {
    messages.value = messages.value.filter(item => item.id !== messageId)
    persistMessages()
  }

  const finalizeRecoveredMessage = (
    messageId: string,
    threadId: string,
    restoredContent: string,
    format: InterviewMessageFormat = 'markdown'
  ) => {
    if (!hasMessage(messageId)) {
      const restoredMessage = createMessage('assistant', restoredContent, threadId, format, 'aborted')
      restoredMessage.id = messageId
      appendMessage(restoredMessage)
    }
    else {
      patchMessage(messageId, item => ({
        ...item,
        format,
        content: restoredContent,
        displayContent: restoredContent
      }))
    }

    messageFinalizer.finalizeRestore(messageId, restoredContent)
  }

  const resetStreamFlags = () => {
    activeStreamTask = null
    activeMessageId = ''
    activeStreamParams = null
    activeIdempotentKey.value = ''
    checkpointSequence.value = 0
    isStreaming.value = false
    isStreamInactive.value = false
    lastStreamActivityAt.value = null
    streamHeartbeat.stop()
  }

  const stopStream = (options: StopStreamOptions = {}) => {
    if (activeMessageId) {
      messageFinalizer.finalizeAbort(activeMessageId)
      if (!options.preserveRecovery) {
        clearPendingInterviewStreamRecovery()
        pendingRecovery.value = null
      }

      if (activeStreamParams) {
        retryableState.value = {
          messageId: activeMessageId,
          params: activeStreamParams,
          reason: 'aborted'
        }
      }
    }

    activeStreamTask?.abort()
    resetStreamFlags()
  }

  const clearMessages = () => {
    stopStream()
    messageQueue.clear()
    messages.value = []
    if (activeSessionId.value) {
      clearPersistedInterviewMessages(activeSessionId.value)
    }
    clearPendingInterviewStreamRecovery()
    pendingRecovery.value = null
    streamError.value = ''
    streamMode.value = 'idle'
    retryableState.value = null
  }

  const startStream = (params: StartInterviewStreamParams) => {
    streamError.value = ''
    stopStream()

    if (!activeSessionId.value) {
      activeSessionId.value = params.sessionId
      persistMessages()
    }
    else if (activeSessionId.value !== params.sessionId) {
      setActiveSessionId(params.sessionId)
    }

    const threadId = params.threadId || activeThreadId.value
    activeThreadId.value = threadId
    activeStreamParams = cloneStreamParams(params)
    retryableState.value = null
    isStreamInactive.value = false
    lastStreamActivityAt.value = null
    checkpointSequence.value = 0

    const streamTask = startInterviewStream(params, {
      onEvent: event => {
        if (event.type === 'start') {
          isStreaming.value = true
          activeMessageId = event.messageId
          streamMode.value = event.mode || 'mock'
          activeIdempotentKey.value = params.idempotentKey || event.messageId
          streamHeartbeat.start()
          setPendingInterviewStreamRecovery({
            messageId: event.messageId,
            mode: event.mode || 'mock',
            params: cloneStreamParams({
              ...params,
              idempotentKey: params.idempotentKey || event.messageId
            }),
            recordedAt: new Date().toISOString()
          })
          pendingRecovery.value = getPendingInterviewStreamRecovery()

          const assistantMessage = createMessage('assistant', '', threadId, params.format || 'markdown', 'streaming')
          assistantMessage.id = event.messageId
          assistantMessage.displayContent = ''
          assistantMessage.content = ''

          appendMessage(assistantMessage)

          messageQueue.register(event.messageId, (delta) => {
            patchMessage(event.messageId, item => ({
              ...item,
              content: `${ item.content }${ delta }`,
              displayContent: `${ item.displayContent }${ delta }`
            }))
          })
          return
        }

        if (event.type === 'activity') {
          lastStreamActivityAt.value = activeStreamTask?.getSnapshot().lastActivityAt || Date.now()
          isStreamInactive.value = false
          return
        }

        if (event.type === 'heartbeat') {
          if (event.idempotentKey) {
            activeIdempotentKey.value = event.idempotentKey
          }
          if (typeof event.checkpointSequence === 'number') {
            checkpointSequence.value = event.checkpointSequence
          }
          lastStreamActivityAt.value = activeStreamTask?.getSnapshot().lastActivityAt || Date.now()
          isStreamInactive.value = false
          return
        }

        if (event.type === 'checkpoint') {
          if (event.idempotentKey) {
            activeIdempotentKey.value = event.idempotentKey
          }
          if (typeof event.checkpointSequence === 'number') {
            checkpointSequence.value = event.checkpointSequence
          }
          return
        }

        if (event.type === 'chunk') {
          const parsed = parseInterviewStreamChunk(event.messageId, event.chunk || '')
          if (parsed?.type === 'chunk' && parsed.chunk) {
            messageQueue.enqueue(parsed.messageId, parsed.chunk)
          }
          return
        }

        if (event.type === 'done') {
          messageFinalizer.finalizeDone(event.messageId)
          clearPendingInterviewStreamRecovery()
          pendingRecovery.value = null
          resetStreamFlags()
          return
        }

        if (event.type === 'error') {
          const fallbackMessage = resolveInterviewStreamErrorMessage(streamMode.value, event.error)
          messageFinalizer.finalizeError(event.messageId, fallbackMessage)
          streamError.value = fallbackMessage
          clearPendingInterviewStreamRecovery()
          pendingRecovery.value = null

          if (activeStreamParams) {
            retryableState.value = {
              messageId: event.messageId,
              params: activeStreamParams,
              reason: 'error'
            }
          }

          resetStreamFlags()
        }
      }
    })

    activeStreamTask = streamTask
    return streamTask.messageId
  }

  const retryStream = async () => {
    const nextRetry = retryableState.value
    if (!nextRetry || isStreaming.value) return ''

    if (nextRetry.reason === 'interrupted') {
      streamError.value = ''

      try {
        const restoreResult = await restoreInterviewStreamFromCheckpoint({
          sessionId: nextRetry.params.sessionId,
          threadId: nextRetry.params.threadId,
          idempotentKey: nextRetry.params.idempotentKey || activeIdempotentKey.value
        })

        if (restoreResult.status === 'restored') {
          finalizeRecoveredMessage(
            nextRetry.messageId,
            nextRetry.params.threadId,
            restoreResult.checkpoint.content,
            nextRetry.params.format || 'markdown'
          )
          activeIdempotentKey.value = restoreResult.checkpoint.idempotentKey
          checkpointSequence.value = restoreResult.checkpoint.lastSequence
          clearPendingInterviewStreamRecovery()
          pendingRecovery.value = null
          retryableState.value = null
          streamError.value = '已恢复上次已生成内容，如需继续生成请重新提交本轮回答。'
          return nextRetry.messageId
        }

        streamError.value = '未找到可恢复的历史内容，请重新生成本轮反馈。'
        return ''
      } catch {
        streamError.value = '恢复历史内容失败，请稍后重试或重新生成本轮反馈。'
        return ''
      }
    }

    removeMessage(nextRetry.messageId)
    streamError.value = ''
    clearPendingInterviewStreamRecovery()
    pendingRecovery.value = null

    return startStream({
      ...cloneStreamParams(nextRetry.params)
    }) || ''
  }

  onBeforeUnmount(() => {
    stopStream({
      preserveRecovery: true
    })
    messageQueue.clear()
  })

  return {
    messages,
    currentMessages,
    activeSessionId,
    activeThreadId,
    isStreaming,
    streamError,
    streamMode,
    streamModeLabel,
    activeIdempotentKey,
    checkpointSequence,
    lastStreamActivityAt,
    isStreamInactive,
    streamConnectionHint,
    streamRecoveryHint,
    canRetryStream,
    retryActionLabel,
    scrollVersion,
    setActiveSessionId,
    setActiveThreadId,
    appendUserMessage,
    appendAssistantMessage,
    appendSystemMessage,
    startStream,
    retryStream,
    stopStream,
    clearMessages
  }
}

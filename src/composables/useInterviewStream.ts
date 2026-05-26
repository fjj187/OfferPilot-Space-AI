import type { InterviewMessage, InterviewMessageFormat, InterviewMessageRole } from '@/types/message'
import type { PersistedInterviewFeedbackStyle, PersistedTopicKey } from '@/types/workbench'
import { parseInterviewStreamChunk } from '@/services/message/interview-message-parser'
import { InterviewMessageQueue } from '@/services/message/interview-message-queue'
import { startInterviewStream } from '@/services/sse/interview-stream'
import type { InterviewStreamMode } from '@/services/sse/sse-types'

interface StartInterviewStreamParams {
  sessionId: string
  threadId: string
  topic: PersistedTopicKey
  topicLabel: string
  prompt: string
  questionTitle: string
  questionPrompt: string
  answer: string
  sourceContext?: string
  sourceDocumentName?: string
  sourceDocumentSummary?: string
  sourceDocumentTags?: string[]
  sourceDocumentExcerpt?: string
  feedbackStyle?: PersistedInterviewFeedbackStyle
  format?: InterviewMessageFormat
  questionIndex?: number
  questionCount?: number
  unknownAnswerStreak?: number
  forceRevealReferenceAnswer?: boolean
  referenceAnswerHint?: string
}

interface RetryableStreamState {
  messageId: string
  params: StartInterviewStreamParams
  reason: 'error' | 'aborted'
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

export const useInterviewStream = () => {
  const messages = ref<InterviewMessage[]>([])
  const activeThreadId = ref('default')
  const isStreaming = ref(false)
  const streamError = ref('')
  const streamMode = ref<InterviewStreamMode | 'idle'>('idle')
  const retryableState = ref<RetryableStreamState | null>(null)
  const streamModeLabel = computed(() => {
    if (streamMode.value === 'remote') return '真实 AI 流式'
    if (streamMode.value === 'mock') return '本地模拟流'
    return '未开始'
  })
  const canRetryStream = computed(() => !!retryableState.value && !isStreaming.value)
  const retryActionLabel = computed(() => {
    if (retryableState.value?.reason === 'aborted') return '重新生成本轮反馈'
    if (retryableState.value?.reason === 'error') return '重试本轮反馈'
    return '重试'
  })

  const messageQueue = new InterviewMessageQueue()
  let activeAbort: null | (() => void) = null
  let activeMessageId = ''
  let activeStreamParams: StartInterviewStreamParams | null = null

  const currentMessages = computed(() => messages.value.filter(item => item.threadId === activeThreadId.value))
  const scrollVersion = computed(() => currentMessages.value.map(item => `${ item.id }:${ item.displayContent.length }:${ item.status }`).join('|'))

  const setActiveThreadId = (threadId: string) => {
    activeThreadId.value = threadId || 'default'
  }

  const appendMessage = (message: InterviewMessage) => {
    messages.value = [...messages.value, message]
    return message
  }

  const appendUserMessage = (content: string, threadId = activeThreadId.value) => {
    return appendMessage(createMessage('user', content, threadId, 'plain', 'done'))
  }

  const appendAssistantMessage = (content: string, format: InterviewMessageFormat = 'markdown', threadId = activeThreadId.value) => {
    return appendMessage(createMessage('assistant', content, threadId, format, 'done'))
  }

  const appendSystemMessage = (content: string, format: InterviewMessageFormat = 'plain', threadId = activeThreadId.value) => {
    return appendMessage(createMessage('system', content, threadId, format, 'done'))
  }

  const patchMessage = (messageId: string, updater: (message: InterviewMessage) => InterviewMessage) => {
    messages.value = messages.value.map(item => (item.id === messageId ? updater(item) : item))
  }

  const removeMessage = (messageId: string) => {
    messages.value = messages.value.filter(item => item.id !== messageId)
  }

  const finalizeStreamState = () => {
    activeAbort = null
    activeMessageId = ''
    activeStreamParams = null
    isStreaming.value = false
  }

  const stopStream = () => {
    if (activeMessageId) {
      messageQueue.flushNow(activeMessageId)
      messageQueue.unregister(activeMessageId)
      patchMessage(activeMessageId, item => ({
        ...item,
        status: item.content || item.displayContent ? 'aborted' : 'done'
      }))

      if (activeStreamParams) {
        retryableState.value = {
          messageId: activeMessageId,
          params: activeStreamParams,
          reason: 'aborted'
        }
      }
    }

    activeAbort?.()
    finalizeStreamState()
  }

  const clearMessages = () => {
    stopStream()
    messageQueue.clear()
    messages.value = []
    streamError.value = ''
    streamMode.value = 'idle'
    retryableState.value = null
  }

  const startStream = (params: StartInterviewStreamParams) => {
    streamError.value = ''
    stopStream()
    const threadId = params.threadId || activeThreadId.value
    activeThreadId.value = threadId
    activeStreamParams = {
      ...params,
      sourceDocumentTags: params.sourceDocumentTags ? [...params.sourceDocumentTags] : undefined
    }
    retryableState.value = null

    const streamTask = startInterviewStream(params, {
      onEvent: event => {
        if (event.type === 'start') {
          isStreaming.value = true
          activeMessageId = event.messageId
          streamMode.value = event.mode || 'mock'

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

        if (event.type === 'chunk') {
          const parsed = parseInterviewStreamChunk(event.messageId, event.chunk || '')
          if (parsed?.type === 'chunk' && parsed.chunk) {
            messageQueue.enqueue(parsed.messageId, parsed.chunk)
          }
          return
        }

        if (event.type === 'done') {
          messageQueue.flushNow(event.messageId)
          messageQueue.unregister(event.messageId)
          patchMessage(event.messageId, item => ({
            ...item,
            status: 'done'
          }))
          finalizeStreamState()
          return
        }

        if (event.type === 'error') {
          messageQueue.flushNow(event.messageId)
          messageQueue.unregister(event.messageId)
          const fallbackMessage = streamMode.value === 'remote'
            ? `真实 AI 流式请求失败：${ event.error?.message || '请稍后重试。' }`
            : event.error?.message || '生成失败，请稍后重试。'
          patchMessage(event.messageId, item => ({
            ...item,
            status: 'error',
            displayContent: item.displayContent || fallbackMessage,
            content: item.content || fallbackMessage
          }))
          streamError.value = fallbackMessage
          if (activeStreamParams) {
            retryableState.value = {
              messageId: event.messageId,
              params: activeStreamParams,
              reason: 'error'
            }
          }
          finalizeStreamState()
        }
      }
    })

    activeAbort = streamTask.abort
    return streamTask.messageId
  }

  const retryStream = () => {
    const nextRetry = retryableState.value
    if (!nextRetry || isStreaming.value) return ''

    removeMessage(nextRetry.messageId)
    streamError.value = ''

    return startStream({
      ...nextRetry.params,
      sourceDocumentTags: nextRetry.params.sourceDocumentTags
        ? [...nextRetry.params.sourceDocumentTags]
        : undefined
    }) || ''
  }

  onBeforeUnmount(() => {
    clearMessages()
  })

  return {
    messages,
    currentMessages,
    activeThreadId,
    isStreaming,
    streamError,
    streamMode,
    streamModeLabel,
    canRetryStream,
    retryActionLabel,
    scrollVersion,
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

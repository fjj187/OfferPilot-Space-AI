import type { InterviewMessage, InterviewMessageFormat, InterviewMessageRole } from '@/types/message'
import { parseInterviewStreamChunk } from '@/services/message/interview-message-parser'
import { InterviewMessageQueue } from '@/services/message/interview-message-queue'
import { startInterviewStream } from '@/services/sse/interview-stream'

interface StartInterviewStreamParams {
  prompt: string
  topicLabel: string
  questionTitle: string
  questionPrompt: string
  answer: string
  format?: InterviewMessageFormat
}

const createMessageId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const createMessage = (
  role: InterviewMessageRole,
  content: string,
  format: InterviewMessageFormat = 'plain',
  status: InterviewMessage['status'] = 'done'
): InterviewMessage => ({
  id: createMessageId(),
  role,
  content,
  displayContent: content,
  format,
  status,
  createdAt: new Date().toISOString()
})

export const useInterviewStream = () => {
  const messages = ref<InterviewMessage[]>([])
  const isStreaming = ref(false)
  const streamError = ref('')

  const messageQueue = new InterviewMessageQueue()
  let activeAbort: null | (() => void) = null
  let activeMessageId = ''

  const scrollVersion = computed(() => messages.value.map(item => `${item.id}:${item.displayContent.length}:${item.status}`).join('|'))

  const appendMessage = (message: InterviewMessage) => {
    messages.value = [...messages.value, message]
    return message
  }

  const appendUserMessage = (content: string) => {
    return appendMessage(createMessage('user', content, 'plain', 'done'))
  }

  const appendAssistantMessage = (content: string, format: InterviewMessageFormat = 'markdown') => {
    return appendMessage(createMessage('assistant', content, format, 'done'))
  }

  const appendSystemMessage = (content: string, format: InterviewMessageFormat = 'plain') => {
    return appendMessage(createMessage('system', content, format, 'done'))
  }

  const patchMessage = (messageId: string, updater: (message: InterviewMessage) => InterviewMessage) => {
    messages.value = messages.value.map(item => (item.id === messageId ? updater(item) : item))
  }

  const stopStream = () => {
    if (activeMessageId) {
      messageQueue.flushNow(activeMessageId)
      messageQueue.unregister(activeMessageId)
      patchMessage(activeMessageId, item => ({
        ...item,
        status: 'done'
      }))
    }

    activeAbort?.()
    activeAbort = null
    activeMessageId = ''
    isStreaming.value = false
  }

  const clearMessages = () => {
    stopStream()
    messageQueue.clear()
    messages.value = []
    streamError.value = ''
  }

  const startStream = (params: StartInterviewStreamParams) => {
    streamError.value = ''
    stopStream()

    const streamTask = startInterviewStream(params, {
      onEvent: event => {
        if (event.type === 'start') {
          isStreaming.value = true
          activeMessageId = event.messageId

          const assistantMessage = createMessage('assistant', '', params.format || 'markdown', 'streaming')
          assistantMessage.id = event.messageId
          assistantMessage.displayContent = ''
          assistantMessage.content = ''

          appendMessage(assistantMessage)

          messageQueue.register(event.messageId, (delta) => {
            patchMessage(event.messageId, item => ({
              ...item,
              content: `${item.content}${delta}`,
              displayContent: `${item.displayContent}${delta}`
            }))
          })
          return
        }

        if (event.type === 'delta') {
          const parsed = parseInterviewStreamChunk(event.messageId, event.delta || '')
          if (parsed?.type === 'delta' && parsed.delta) {
            messageQueue.enqueue(parsed.messageId, parsed.delta)
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
          activeAbort = null
          activeMessageId = ''
          isStreaming.value = false
          return
        }

        if (event.type === 'error') {
          messageQueue.flushNow(event.messageId)
          messageQueue.unregister(event.messageId)
          patchMessage(event.messageId, item => ({
            ...item,
            status: 'error',
            displayContent: item.displayContent || event.errorMessage || '生成失败，请稍后重试。',
            content: item.content || event.errorMessage || '生成失败，请稍后重试。'
          }))
          streamError.value = event.errorMessage || '生成失败，请稍后重试。'
          activeAbort = null
          activeMessageId = ''
          isStreaming.value = false
        }
      }
    })

    activeAbort = streamTask.abort
    return streamTask.messageId
  }

  onBeforeUnmount(() => {
    clearMessages()
  })

  return {
    messages,
    isStreaming,
    streamError,
    scrollVersion,
    appendUserMessage,
    appendAssistantMessage,
    appendSystemMessage,
    startStream,
    stopStream,
    clearMessages
  }
}

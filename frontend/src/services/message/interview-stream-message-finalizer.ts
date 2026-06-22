import type { InterviewMessage } from '@/types/message'

interface FinalizeMessageOptions {
  patchMessage: (messageId: string, updater: (message: InterviewMessage) => InterviewMessage) => void
  flushMessageQueue: (messageId: string) => void
  unregisterMessageQueue: (messageId: string) => void
}

export const createInterviewStreamMessageFinalizer = ({
  patchMessage,
  flushMessageQueue,
  unregisterMessageQueue
}: FinalizeMessageOptions) => {
  const releaseMessageQueue = (messageId: string) => {
    flushMessageQueue(messageId)
    unregisterMessageQueue(messageId)
  }

  return {
    finalizeDone(messageId: string) {
      releaseMessageQueue(messageId)
      patchMessage(messageId, item => ({
        ...item,
        status: 'done'
      }))
    },
    finalizeError(messageId: string, fallbackMessage: string) {
      releaseMessageQueue(messageId)
      patchMessage(messageId, item => ({
        ...item,
        status: 'error',
        displayContent: item.displayContent || fallbackMessage,
        content: item.content || fallbackMessage
      }))
    },
    finalizeAbort(messageId: string) {
      releaseMessageQueue(messageId)
      patchMessage(messageId, item => ({
        ...item,
        status: item.content || item.displayContent ? 'aborted' : 'done'
      }))
    },
    finalizeRestore(messageId: string, restoredContent: string) {
      releaseMessageQueue(messageId)
      patchMessage(messageId, item => ({
        ...item,
        status: restoredContent ? 'aborted' : 'done',
        content: restoredContent,
        displayContent: restoredContent
      }))
    }
  }
}

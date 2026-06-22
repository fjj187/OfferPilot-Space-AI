import { fetchInterviewStreamCheckpoint } from './interview-stream-checkpoint-api'

interface RestoreInterviewStreamFromCheckpointParams {
  sessionId: string
  threadId: string
  idempotentKey?: string
}

export interface RestoredInterviewStreamCheckpoint {
  messageId: string
  content: string
  idempotentKey: string
  lastSequence: number
  updatedAt: string
}

export type RestoreInterviewStreamCheckpointResult =
  | {
    status: 'restored'
    checkpoint: RestoredInterviewStreamCheckpoint
  }
  | {
    status: 'missing'
  }

export const restoreInterviewStreamFromCheckpoint = async ({
  sessionId,
  threadId,
  idempotentKey
}: RestoreInterviewStreamFromCheckpointParams): Promise<RestoreInterviewStreamCheckpointResult> => {
  const checkpoint = await fetchInterviewStreamCheckpoint(sessionId, threadId, idempotentKey)

  if (!checkpoint?.content) {
    return {
      status: 'missing'
    }
  }

  return {
    status: 'restored',
    checkpoint: {
      messageId: checkpoint.messageId,
      content: checkpoint.content,
      idempotentKey: checkpoint.idempotentKey,
      lastSequence: checkpoint.lastSequence,
      updatedAt: checkpoint.updatedAt
    }
  }
}

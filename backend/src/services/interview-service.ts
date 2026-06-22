import { recordInterviewAssistantMessage, recordInterviewUserMessage } from '../storage/interview-session-store.js'
import type { InterviewProvider, InterviewProviderStreamOptions } from '../providers/llm-provider.js'
import type { InterviewProviderEvent, InterviewStreamRequest } from '../types/interview.js'
import {
  appendInterviewStreamCheckpointChunk,
  completeInterviewStreamCheckpoint,
  failInterviewStreamCheckpoint,
  getStoredInterviewStreamCheckpoint,
  upsertInterviewStreamCheckpointStart
} from '../storage/interview-stream-checkpoint-store.js'

export class InterviewService {
  constructor(private readonly provider: InterviewProvider) {}

  async *streamInterview(
    request: InterviewStreamRequest,
    options?: InterviewProviderStreamOptions & {
      owner?: string
    }
  ): AsyncGenerator<InterviewProviderEvent, void, undefined> {
    const checkpointKey = request.idempotentKey?.trim() || request.messageId
    request.idempotentKey = checkpointKey
    recordInterviewUserMessage(request, {
      owner: options?.owner
    })
    upsertInterviewStreamCheckpointStart({
      sessionId: request.sessionId,
      threadId: request.threadId,
      messageId: request.messageId,
      idempotentKey: checkpointKey,
      owner: options?.owner
    })

    let assistantContent = ''

    for await (const event of this.provider.streamInterview(request, options)) {
      if (event.type === 'chunk') {
        assistantContent += event.content
        appendInterviewStreamCheckpointChunk({
          sessionId: request.sessionId,
          threadId: request.threadId,
          idempotentKey: checkpointKey,
          chunk: event.content
        })
      }

      if (event.type === 'done' && assistantContent) {
        recordInterviewAssistantMessage(request, assistantContent)
        completeInterviewStreamCheckpoint({
          sessionId: request.sessionId,
          threadId: request.threadId,
          idempotentKey: checkpointKey
        })
      }

      if (event.type === 'error') {
        failInterviewStreamCheckpoint({
          sessionId: request.sessionId,
          threadId: request.threadId,
          idempotentKey: checkpointKey,
          code: event.code,
          message: event.message,
          status: options?.signal?.aborted ? 'aborted' : 'error'
        })
      }

      yield event

      if (event.type === 'chunk') {
        const checkpoint = getStoredInterviewStreamCheckpoint(
          request.sessionId,
          request.threadId,
          checkpointKey
        )

        if (checkpoint) {
          yield {
            type: 'heartbeat',
            checkpointIdempotentKey: checkpoint.idempotentKey,
            checkpointSequence: checkpoint.lastSequence
          }
        }
      }
    }
  }
}

import { recordInterviewAssistantMessage, recordInterviewUserMessage } from '../storage/interview-session-store.js'
import type { InterviewProvider, InterviewProviderStreamOptions } from '../providers/llm-provider.js'
import type { InterviewProviderEvent, InterviewStreamRequest } from '../types/interview.js'

export class InterviewService {
  constructor(private readonly provider: InterviewProvider) {}

  async *streamInterview(
    request: InterviewStreamRequest,
    options?: InterviewProviderStreamOptions
  ): AsyncGenerator<InterviewProviderEvent, void, undefined> {
    recordInterviewUserMessage(request)

    let assistantContent = ''

    for await (const event of this.provider.streamInterview(request, options)) {
      if (event.type === 'chunk') {
        assistantContent += event.content
      }

      if (event.type === 'done' && assistantContent) {
        recordInterviewAssistantMessage(request, assistantContent)
      }

      yield event
    }
  }
}

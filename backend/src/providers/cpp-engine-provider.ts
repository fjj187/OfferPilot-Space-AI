import type { InterviewProvider, InterviewProviderStreamOptions } from './llm-provider.js'
import type { InterviewProviderEvent, InterviewStreamRequest } from '../types/interview.js'

export class CppEngineProvider implements InterviewProvider {
  async *streamInterview(
    _request: InterviewStreamRequest,
    _options?: InterviewProviderStreamOptions
  ): AsyncGenerator<InterviewProviderEvent, void, undefined> {
    yield {
      type: 'error',
      code: 'CPP_PROVIDER_NOT_IMPLEMENTED',
      message: 'C++ provider is reserved for future integration.'
    }
  }
}

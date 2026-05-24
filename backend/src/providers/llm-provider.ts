import type { InterviewProviderEvent, InterviewStreamRequest } from '../types/interview.js'

export interface InterviewProviderStreamOptions {
  signal?: AbortSignal
}

export interface InterviewProvider {
  streamInterview(
    request: InterviewStreamRequest,
    options?: InterviewProviderStreamOptions
  ): AsyncGenerator<InterviewProviderEvent, void, undefined>
}

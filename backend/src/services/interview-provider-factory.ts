import { backendEnv } from '../utils/env.js'
import { CppEngineProvider } from '../providers/cpp-engine-provider.js'
import type { InterviewProvider } from '../providers/llm-provider.js'
import { MockInterviewProvider } from '../providers/mock-provider.js'
import { RemoteLLMProvider } from '../providers/remote-llm-provider.js'

export const createInterviewProvider = (): InterviewProvider => {
  if (backendEnv.provider === 'remote') {
    return new RemoteLLMProvider()
  }

  if (backendEnv.provider === 'cpp') {
    return new CppEngineProvider()
  }

  return new MockInterviewProvider()
}

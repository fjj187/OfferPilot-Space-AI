import type { InterviewProvider, InterviewProviderStreamOptions } from './llm-provider.js'
import type { InterviewFeedbackStyle, InterviewProviderEvent, InterviewStreamRequest } from '../types/interview.js'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const feedbackStyleLeadMap: Record<InterviewFeedbackStyle, string> = {
  followup: '我会按真实面试官的方式继续追问你这轮回答里的边界和取舍。',
  corrective: '我会先指出这轮回答和资料重点没有对齐的地方，再给修正建议。',
  guided: '我会先帮你抓住应该讲的重点，再一步步引导你展开。'
}

const buildMockReply = (request: InterviewStreamRequest) => {
  const style = request.feedbackStyle || 'followup'
  const sourceSummary = request.sourceDocumentSummary
    ? `资料摘要是：${ request.sourceDocumentSummary }`
    : '当前没有资料摘要，我会按题目上下文继续追问。'
  const sourceTags = request.sourceDocumentTags?.length
    ? `资料标签：${ request.sourceDocumentTags.join(' / ') }。`
    : ''

  return [
    `### ${ request.questionTitle }`,
    '',
    `${ feedbackStyleLeadMap[style] }`,
    sourceSummary,
    sourceTags,
    `你这轮回答的原问题是：${ request.questionPrompt }`,
    `我听到你的核心回答是：${ request.answer }`,
    '',
    '下一轮你最好补三件事：',
    '1. 先把结论说短一点。',
    '2. 再把资料重点和你的实际做法对齐。',
    '3. 最后补一个结果验证或边界条件。'
  ]
    .filter(Boolean)
    .join('\n')
}

export class MockInterviewProvider implements InterviewProvider {
  async *streamInterview(
    request: InterviewStreamRequest,
    options?: InterviewProviderStreamOptions
  ): AsyncGenerator<InterviewProviderEvent, void, undefined> {
    const text = buildMockReply(request)
    const chunkSize = 18

    for (let index = 0; index < text.length; index += chunkSize) {
      if (options?.signal?.aborted) {
        return
      }

      await wait(20)
      yield {
        type: 'chunk',
        content: text.slice(index, index + chunkSize)
      }
    }

    yield {
      type: 'done'
    }
  }
}

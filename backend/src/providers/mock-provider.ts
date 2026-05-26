import { getStoredInterviewSession } from '../storage/interview-session-store.js'
import type { InterviewProvider, InterviewProviderStreamOptions } from './llm-provider.js'
import type { InterviewFeedbackStyle, InterviewProviderEvent, InterviewStreamRequest } from '../types/interview.js'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const feedbackStyleLeadMap: Record<InterviewFeedbackStyle, string> = {
  followup: '我会按真实面试官的方式继续追问你这轮回答里的边界和取舍。',
  corrective: '我会先指出这轮回答和资料重点没有对齐的地方，再给修正建议。',
  guided: '我会先帮你抓住应该讲的重点，再一步步引导你展开。'
}

const buildMockReply = (request: InterviewStreamRequest) => {
  const forceReveal = request.forceRevealReferenceAnswer || (request.unknownAnswerStreak ?? 0) >= 2
  if (forceReveal) {
    const reference = request.referenceAnswerHint || request.sourceDocumentExcerpt || '（暂无资料摘录，请结合题面说明要点。）'
    return [
      '#### 参考答案',
      reference,
      '',
      '#### 简要说明',
      '你已连续两次表示不知道，这里直接给出本题应对齐的要点。理解后请点击页面底部「下一题」。'
    ].join('\n')
  }

  const session = getStoredInterviewSession(request.sessionId, request.threadId)
  const turnCount = session?.messages.length || 0

  if (turnCount > 1) {
    const lastAssistant = [...(session?.messages || [])]
      .reverse()
      .find(item => item.role === 'assistant')

    return [
      `### 继续本轮追问`,
      '',
      '我已看到你在上一道追问下的最新回答。',
      lastAssistant?.content
        ? `上一轮的追问/要求是：${ lastAssistant.content.split('\n').find(line => /请重新回答|请补充|继续追问|如果我继续/.test(line)) || '请围绕上一轮追问补全。' }`
        : '请围绕上一轮追问补全。',
      '',
      `你刚才回答：${ request.answer }`,
      '',
      '请针对上述追问说明要点，不要重复第一轮的泛泛纠偏。'
    ].join('\n')
  }

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
    request.questionIndex && request.questionCount
      ? `当前仍在本轮第 ${ request.questionIndex } / ${ request.questionCount } 题，请勿自行切换题目。`
      : '',
    `你这轮回答的原问题是：${ request.questionPrompt }`,
    `我听到你的核心回答是：${ request.answer }`,
    '',
    '下一轮你最好补三件事：',
    '1. 先把结论说短一点。',
    '2. 再把资料重点和你的实际做法对齐。',
    '3. 最后补一个结果验证或边界条件。',
    '',
    '若本题已答完，请点击页面底部「下一题」进入下一题。',
    request.unknownAnswerStreak === 1
      ? '如果你实在想不起来或者不知道，可以直接告诉我，我会给出本题参考答案。'
      : ''
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

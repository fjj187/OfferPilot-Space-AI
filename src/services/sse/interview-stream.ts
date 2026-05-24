import { consumeSSEStream, consumeStreamText } from './sse-client'
import type { InterviewApiError, InterviewStreamHandlers, InterviewStreamMode, InterviewStreamRequest } from './sse-types'

const feedbackStyleInstructionMap = {
  followup: '反馈风格：追问型。请更像真实面试官，优先继续追问和压缩回答边界。',
  corrective: '反馈风格：纠偏型。请优先指出回答与资料重点哪里没有对齐，再给修正建议。',
  guided: '反馈风格：引导型。请先提示资料里应该抓住哪些点，再继续往下追问。'
} as const

const createId = () => `msg-${ Date.now() }-${ Math.random().toString(36).slice(2, 8) }`
const createStreamError = (message: string, code = 'INTERVIEW_STREAM_ERROR'): InterviewApiError => ({
  code,
  message
})

const resolveInterviewStreamEndpoint = () => {
  const configuredEndpoint = import.meta.env.VITE_INTERVIEW_SSE_URL?.trim() || ''
  if (configuredEndpoint) return configuredEndpoint

  return import.meta.env.DEV ? '/api/interview/stream' : ''
}

const resolveInterviewStreamMode = (): InterviewStreamMode => (
  resolveInterviewStreamEndpoint() ? 'remote' : 'mock'
)

const normalizeInterviewStreamRequest = (request: InterviewStreamRequest): InterviewStreamRequest => {
  const structuredSourceContext = [
    request.sourceDocumentSummary ? `资料摘要：${ request.sourceDocumentSummary }` : '',
    request.sourceDocumentTags?.length ? `资料标签：${ request.sourceDocumentTags.join(' / ') }` : '',
    request.sourceDocumentExcerpt ? `资料片段：${ request.sourceDocumentExcerpt }` : ''
  ]
    .filter(Boolean)
    .join('\n')

  const compactPrompt = [
    request.questionTitle,
    request.feedbackStyle ? feedbackStyleInstructionMap[request.feedbackStyle] : '',
    structuredSourceContext || request.sourceContext,
    request.answer
  ]
    .map(item => item?.trim())
    .filter(Boolean)
    .join('\n')

  return {
    ...request,
    // Avoid sending the question body twice. The full text is already kept in
    // `questionPrompt`, so `prompt` only needs the minimum context.
    prompt: compactPrompt || request.prompt.trim()
  }
}

const splitTextToReader = (
  text: string,
  delay = 18,
  chunkSize = 14
): ReadableStreamDefaultReader<string> => {
  let offset = 0

  const stream = new ReadableStream<string>({
    async pull(controller) {
      if (offset >= text.length) {
        controller.close()
        return
      }

      await new Promise(resolve => setTimeout(resolve, delay))
      const nextOffset = Math.min(offset + chunkSize, text.length)
      controller.enqueue(text.slice(offset, nextOffset))
      offset = nextOffset
    }
  })

  return stream.getReader()
}

const buildMockInterviewReply = (request: InterviewStreamRequest) => {
  const answerLengthLabel =
    request.answer.trim().length >= 90 ? '回答展开度不错' : '回答还可以再展开一点'
  const sourceContextText = request.sourceDocumentName
    ? `我会继续参考你当前选中的资料 **${ request.sourceDocumentName }** 来追问。`
    : '我会继续围绕当前训练上下文来追问。'
  const sourceSummaryText = request.sourceDocumentSummary
    ? `这份资料摘要可以先概括成：${ request.sourceDocumentSummary }`
    : ''
  const sourceTagsText = request.sourceDocumentTags?.length
    ? `当前资料标签：${ request.sourceDocumentTags.join(' / ') }`
    : ''
  const sourceExcerptText = request.sourceDocumentExcerpt
    ? `我也会参考这段资料片段：${ request.sourceDocumentExcerpt }`
    : ''
  const feedbackStyleLabelMap = {
    followup: '追问型',
    corrective: '纠偏型',
    guided: '引导型'
  } as const
  const feedbackStyleTitle = request.feedbackStyle
    ? `当前采用 **${ feedbackStyleLabelMap[request.feedbackStyle] }** 面试风格。`
    : ''
  const feedbackSectionMap = {
    followup: [
      '#### 面试官反馈',
      `- ${ answerLengthLabel }`,
      '- 我会优先继续追问你的设计取舍、边界判断和落地方式',
      '- 下一轮回答尽量先给结论，再准备被连续追问时的补充路径',
      '',
      '#### 继续追问',
      `如果我继续问你“为什么这么设计，而不是放到页面里直接写”，你会怎么回答？`
    ],
    corrective: [
      '#### 纠偏反馈',
      `- ${ answerLengthLabel }`,
      '- 你的回答需要更明确地贴住当前资料摘要和标签，不要只给通用答案',
      '- 下一轮优先补齐资料里的核心术语、真实场景和结果验证',
      '',
      '#### 修正建议',
      `1. 先用两句话概括：你会如何处理“${ request.questionPrompt }”`,
      '2. 再明确指出这份资料最相关的标签和你为什么这样拆',
      '3. 最后补一段真实项目或验证结果，让答案更贴资料上下文'
    ],
    guided: [
      '#### 引导反馈',
      `- ${ answerLengthLabel }`,
      '- 这一轮先抓资料中的核心概念，再往实现和边界展开会更稳',
      '- 你可以按“结论 -> 资料重点 -> 实际做法 -> 结果验证”四段来答',
      '',
      '#### 下一步引导',
      `1. 先用两句话概括：你会如何处理“${ request.questionPrompt }”`,
      '2. 再拆成资料重点、状态边界、异常情况三个部分',
      '3. 最后补上线后的验证方式或复盘指标'
    ]
  } as const
  const feedbackSection = feedbackSectionMap[request.feedbackStyle || 'followup']

  return [
    `### ${ request.questionTitle }`,
    '',
    `你刚才围绕 **${ request.topicLabel }** 给出了一轮回答，整体上已经覆盖了主要方向，不过我会继续按真实面试官的方式往下追问。`,
    '',
    ...(feedbackStyleTitle ? [feedbackStyleTitle, ''] : []),
    sourceContextText,
    ...(sourceSummaryText ? ['', sourceSummaryText] : []),
    ...(sourceTagsText ? ['', sourceTagsText] : []),
    ...(sourceExcerptText ? ['', sourceExcerptText] : []),
    '',
    ...feedbackSection
  ].join('\n')
}

const createFetchReader = async (
  request: InterviewStreamRequest,
  signal?: AbortSignal
): Promise<ReadableStreamDefaultReader<string>> => {
  const endpoint = resolveInterviewStreamEndpoint()
  const normalizedRequest = normalizeInterviewStreamRequest(request)

  if (!endpoint) {
    return splitTextToReader(buildMockInterviewReply(normalizedRequest))
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(normalizedRequest),
    signal
  })

  if (!response.ok || !response.body) {
    throw createStreamError(`Interview stream request failed: ${ response.status }`, `HTTP_${ response.status }`)
  }

  return response.body
    .pipeThrough(new TextDecoderStream())
    .getReader()
}

const resolveSSEEventData = <T>(data: string): T | null => {
  const normalized = data.trim()
  if (!normalized) return null

  try {
    return JSON.parse(normalized) as T
  } catch {
    return null
  }
}

export const startInterviewStream = (
  payload: Omit<InterviewStreamRequest, 'messageId'>,
  handlers: InterviewStreamHandlers
) => {
  const controller = new AbortController()
  const messageId = createId()
  const mode = resolveInterviewStreamMode()
  let hasCompleted = false
  const createReader = (signal?: AbortSignal) => createFetchReader({
    ...payload,
    messageId
  }, signal)

  if (mode === 'remote') {
    consumeSSEStream({
      signal: controller.signal,
      createReader,
      onStart: () => {
        handlers.onEvent({
          type: 'start',
          messageId,
          mode
        })
      },
      onEvent: (frame) => {
        if (frame.event === 'chunk' || frame.event === 'message') {
          const chunkPayload = resolveSSEEventData<{ content?: string; }>(frame.data)
          handlers.onEvent({
            type: 'chunk',
            messageId,
            chunk: chunkPayload?.content || frame.data
          })
          return
        }

        if (frame.event === 'done') {
          hasCompleted = true
          handlers.onEvent({
            type: 'done',
            messageId
          })
          return
        }

        if (frame.event === 'error') {
          const errorPayload = resolveSSEEventData<InterviewApiError>(frame.data)
          handlers.onEvent({
            type: 'error',
            messageId,
            error: errorPayload || createStreamError(frame.data || 'Stream request failed')
          })
        }
      },
      onDone: () => {
        if (hasCompleted) return
        hasCompleted = true
        handlers.onEvent({
          type: 'done',
          messageId
        })
      },
      onError: error => {
        const streamError = 'code' in error && 'message' in error
          ? error as InterviewApiError
          : createStreamError(error.message)
        handlers.onEvent({
          type: 'error',
          messageId,
          error: streamError
        })
      }
    })
  }
  else {
    consumeStreamText({
      signal: controller.signal,
      createReader,
      onStart: () => {
        handlers.onEvent({
          type: 'start',
          messageId,
          mode
        })
      },
      onChunk: chunk => {
        handlers.onEvent({
          type: 'chunk',
          messageId,
          chunk
        })
      },
      onDone: () => {
        if (hasCompleted) return
        hasCompleted = true
        handlers.onEvent({
          type: 'done',
          messageId
        })
      },
      onError: error => {
        const streamError = 'code' in error && 'message' in error
          ? error as InterviewApiError
          : createStreamError(error.message)
        handlers.onEvent({
          type: 'error',
          messageId,
          error: streamError
        })
      }
    })
  }

  return {
    messageId,
    abort: () => controller.abort()
  }
}

import { consumeStreamText } from './sse-client'
import type { InterviewStreamHandlers, InterviewStreamRequest } from './sse-types'
import { splitStream } from '@/components/MarkdownPreview/transform'

const createId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

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

  return [
    `### 当前追问：${request.questionTitle}`,
    '',
    `你刚才围绕 **${request.topicLabel}** 给出了一轮回答，整体上已经覆盖了主要方向，不过我会继续按真实面试官的方式往下追问。`,
    '',
    '#### 面试官反馈',
    `- ${answerLengthLabel}`,
    '- 先说结论，再补拆分过程，会更像成熟的项目表达',
    '- 这轮回答里最好补一个你亲自处理过的场景或取舍',
    '',
    '#### 下一步建议',
    `1. 先用两句话概括：你会如何处理“${request.questionPrompt}”`,
    '2. 再拆成状态、边界、异常情况三个部分',
    '3. 最后补上线后的验证方式或复盘指标',
    '',
    '#### 追问',
    `如果我继续问你“为什么这么设计，而不是放到页面里直接写”，你会怎么回答？`
  ].join('\n')
}

const createFetchReader = async (
  request: InterviewStreamRequest,
  signal?: AbortSignal
): Promise<ReadableStreamDefaultReader<string>> => {
  const endpoint = import.meta.env.VITE_INTERVIEW_SSE_URL

  if (!endpoint) {
    return splitTextToReader(buildMockInterviewReply(request))
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request),
    signal
  })

  if (!response.ok || !response.body) {
    throw new Error(`Interview stream request failed: ${response.status}`)
  }

  return response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(splitStream('\n'))
    .getReader()
}

export const startInterviewStream = (
  payload: Omit<InterviewStreamRequest, 'messageId'>,
  handlers: InterviewStreamHandlers
) => {
  const controller = new AbortController()
  const messageId = createId()

  consumeStreamText({
    signal: controller.signal,
    createReader: signal => createFetchReader({ ...payload, messageId }, signal),
    onStart: () => {
      handlers.onEvent({
        type: 'start',
        messageId
      })
    },
    onChunk: chunk => {
      handlers.onEvent({
        type: 'delta',
        messageId,
        delta: chunk
      })
    },
    onDone: () => {
      handlers.onEvent({
        type: 'done',
        messageId
      })
    },
    onError: error => {
      handlers.onEvent({
        type: 'error',
        messageId,
        errorMessage: error.message
      })
    }
  })

  return {
    messageId,
    abort: () => controller.abort()
  }
}

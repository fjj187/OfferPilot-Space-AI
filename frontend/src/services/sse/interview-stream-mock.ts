import type { InterviewStreamRequest } from './sse-types'

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
  const forceReveal = request.forceRevealReferenceAnswer || (request.unknownAnswerStreak ?? 0) >= 2
  if (forceReveal) {
    const reference = request.referenceAnswerHint || request.sourceDocumentExcerpt || '（暂时无资料摘录，请结合题面说明要点。）'
    return [
      `### ${ request.questionTitle }`,
      '',
      '#### 参考答案',
      reference,
      '',
      '#### 简要说明',
      '你已连续两次表示不知道，这里直接给出本题应对齐的要点。理解后请点击页面底部 **下一题**。'
    ].join('\n')
  }

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
      '如果我继续问你“为什么这么设计，而不是放到页面里直接写”，你会怎么回答？'
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
    ...feedbackSection,
    '',
    '若本题已答完，请点击页面底部 **下一题** 进入下一题；不要在此直接展示其他题目。',
    request.unknownAnswerStreak === 1
      ? '如果你实在想不起来或者不知道，可以直接告诉我，我会给出本题参考答案。'
      : ''
  ].join('\n')
}

export const createMockInterviewStreamReader = (request: InterviewStreamRequest) => (
  splitTextToReader(buildMockInterviewReply(request))
)

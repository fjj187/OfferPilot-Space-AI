import type { InterviewStreamRequest } from '../types/interview.js'

export const UNKNOWN_ANSWER_OFFER_SENTENCE = '如果你实在想不起来或者不知道，可以直接告诉我，我会给出本题参考答案。'

export const buildUnknownAnswerRules = (request: InterviewStreamRequest) => {
  const streak = request.unknownAnswerStreak ?? 0
  const forceReveal = request.forceRevealReferenceAnswer || streak >= 2

  if (forceReveal) {
    const explicitRequest = Boolean(request.forceRevealReferenceAnswer) && streak < 2
    return [
      explicitRequest ? '【候选人主动索要参考答案 · 强制揭晓】' : '【连续不知道 · 强制揭晓】',
      explicitRequest
        ? '候选人已明确要求给出本题参考答案。无论原定的追问型/纠偏型/引导型，本轮都必须停止绕圈。'
        : '候选人已连续两次及以上表示不知道/想不起来。无论原定的追问型/纠偏型/引导型，本轮都必须停止绕圈。',
      '禁止继续引导、纠偏或追问；禁止用「请先理解以下几点」代替给答案。',
      '你必须直接给出本题参考答案，结构如下（Markdown）：',
      '#### 参考答案',
      '- 分点写出应对齐资料/题意的要点（完整、可直接学习）',
      '#### 简要说明',
      '- 用 1～2 句说明为何先前需要提示，不要继续提问',
      request.referenceAnswerHint
        ? `【资料参考答案依据（优先据此组织，可适度精简）】\n${ request.referenceAnswerHint }`
        : (request.sourceDocumentExcerpt
          ? `【资料片段】\n${ request.sourceDocumentExcerpt }`
          : ''),
      '末尾提醒：理解后请点击页面底部「下一题」，不要切换到其他题。'
    ].filter(Boolean)
  }

  if (streak === 1) {
    return [
      '【本轮候选人表示不知道】',
      '可按当前反馈风格给一句思考方向或纠偏，但不得直接公布完整参考答案。',
      `回复末尾必须单独一行写上：${ UNKNOWN_ANSWER_OFFER_SENTENCE }`
    ]
  }

  return []
}

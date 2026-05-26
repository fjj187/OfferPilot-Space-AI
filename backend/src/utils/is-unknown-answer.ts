export const isUnknownAnswer = (answer: string) => {
  const normalized = answer.replace(/\s+/g, '').trim().toLowerCase()
  if (!normalized) return false

  if (normalized.length <= 24 && /^(不知道|不晓得|不清楚|不会|不懂|没思路|想不起来|想不出|忘了|忘记了|没学过|不太懂|不太会|不会答|不会写)$/.test(normalized)) {
    return true
  }

  return /不知道|不清楚|想不起来|想不出|没思路|不会(答|写|讲)?|不懂|忘了|没学过|不太懂|不太会|毫无头绪|完全没有思路/.test(normalized)
}

const REFERENCE_ANSWER_EXACT_PHRASES = new Set([
  '答案',
  '参考答案',
  '标准答案',
  '正确答案',
  '给答案',
  '说答案',
  '讲答案',
  '写答案',
  '报答案',
  '要答案',
  '看答案',
  '念答案',
  '给出答案',
  '给我答案',
  '告诉我答案',
  '直接给答案',
  '直接说答案',
  '直接讲答案',
  '直接写答案',
  '直接报答案',
  '公布答案',
  '揭晓答案',
  '透露答案',
  '看参考答案',
  '给出参考答案',
  '给我参考答案',
  '直接给参考答案',
  '直接说参考答案',
  '说一下答案',
  '说一下参考答案',
  '讲讲答案',
  '说说答案',
  '把答案给我',
  '答案给我',
  '给下答案',
  '说下答案',
  '来个答案',
  '报一下答案',
  '写一下答案'
])

export const isReferenceAnswerRequest = (answer: string) => {
  const normalized = answer.replace(/\s+/g, '').trim().toLowerCase()
  if (!normalized) return false

  if (/^(我的答案|我认为|我觉得|应该是|答案(是|应该|可以|需要)|这(道|题).{0,12}答案)/.test(normalized)) {
    return false
  }

  if (normalized.length <= 36 && REFERENCE_ANSWER_EXACT_PHRASES.has(normalized)) {
    return true
  }

  if (normalized.length <= 18 && /^([给说讲写报看要念来]|直接)[一下]*(参考|标准|正确)?答案$/.test(normalized)) {
    return true
  }

  if (
    normalized.length <= 28
    && /^(能|可以|请|麻烦|帮|能否).{0,10}(给|说|讲|告诉|公布|透露).{0,6}(参考|标准|正确)?答案(吧|吗|嘛|呢|呀)?$/.test(normalized)
  ) {
    return true
  }

  return (
    /(给出|告诉|说明|公布|透露|看看|直接[给说讲写报]|给我|说下|说一下|讲讲|说说|来个|把答案|报一下|写一下).{0,12}(参考|标准|正确)?答案/.test(normalized)
    || /(参考|标准|正确)?答案.{0,10}(是什么|多少|咋写|怎么写|来一个|给我|是啥|呢|吗|吧)/.test(normalized)
    || /^直接.{0,10}(参考|标准|正确)?答案(吧|吗|嘛|呢|呀)?$/.test(normalized)
  )
}

export const countTrailingUnknownAnswers = (answers: string[]) => {
  let streak = 0
  for (let index = answers.length - 1; index >= 0; index -= 1) {
    if (!isUnknownAnswer(answers[index] || '')) break
    streak += 1
  }
  return streak
}

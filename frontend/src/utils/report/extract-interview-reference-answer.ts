const REFERENCE_SECTION_TITLE_PATTERN = '(?:参考答案|正确答案|标准答案)'
const FEEDBACK_SECTION_TITLE_PATTERN = '(?:简要说明|缺点和改进方向|改进方向|修正建议|引导反馈|下一步引导|继续追问)'

const normalizeExtractedReference = (text: string) => (
  text
    .replace(/\n{3,}/g, '\n\n')
    .trim()
)

/** 从单条 AI 反馈 Markdown 中截取「参考答案 / 正确答案」段落 */
export const extractReferenceAnswerFromAssistantContent = (content: string) => {
  const source = content.trim()
  if (!source) return ''

  const headingSection = source.match(
    new RegExp(`#{2,4}\\s*${ REFERENCE_SECTION_TITLE_PATTERN }\\s*[：:]?\\s*\\n+([\\s\\S]*?)(?=\\n#{2,4}\\s|$)`, 'u')
  )
  if (headingSection?.[1]?.trim()) {
    return normalizeExtractedReference(headingSection[1])
  }

  const labelSection = source.match(
    new RegExp(`(?:^|\\n)\\s*(?:[-*•]\\s*)?(?:\\*\\*)?${ REFERENCE_SECTION_TITLE_PATTERN }(?:\\*\\*)?\\s*(?:如下)?[：:]\\s*\\n?([\\s\\S]*?)(?=\\n\\s*(?:#{2,4}\\s*${ FEEDBACK_SECTION_TITLE_PATTERN }|(?:[-*•]\\s*)?(?:\\*\\*)?${ FEEDBACK_SECTION_TITLE_PATTERN }(?:\\*\\*)?\\s*[：:]?)|$)`, 'u')
  )
  if (labelSection?.[1]?.trim()) {
    return normalizeExtractedReference(labelSection[1])
  }

  if (!/完整的参考答案|本题参考答案|正确答案如下|参考答案如下/u.test(source)) return ''

  const beforeFeedback = source.split(
    new RegExp(`\\n\\s*(?:#{2,4}\\s*)?${ FEEDBACK_SECTION_TITLE_PATTERN }\\s*[：:]?`, 'u')
  )[0]?.trim() || ''
  if (!beforeFeedback || beforeFeedback === source) return ''

  const normalized = normalizeExtractedReference(
    beforeFeedback.replace(new RegExp(`^(?:#{2,4}\\s*)?${ REFERENCE_SECTION_TITLE_PATTERN }\\s*(?:如下)?[：:]?\\s*`, 'u'), '')
  )
  return normalized.length >= 12 ? normalized : ''
}

/** 去掉「参考答案 / 正确答案」段落，避免与报告「正确答案」重复展示 */
export const stripReferenceAnswerSection = (content: string) => {
  const source = content.trim()
  if (!source) return ''
  const stripped = source
    .replace(
      new RegExp(`#{2,4}\\s*${ REFERENCE_SECTION_TITLE_PATTERN }\\s*[：:]?\\s*\\n+[\\s\\S]*?(?=\\n#{2,4}\\s|$)`, 'u'),
      ''
    )
    .replace(
      new RegExp(`(?:^|\\n)\\s*(?:[-*•]\\s*)?(?:\\*\\*)?${ REFERENCE_SECTION_TITLE_PATTERN }(?:\\*\\*)?\\s*(?:如下)?[：:]\\s*\\n?[\\s\\S]*?(?=\\n\\s*(?:#{2,4}\\s*${ FEEDBACK_SECTION_TITLE_PATTERN }|(?:[-*•]\\s*)?(?:\\*\\*)?${ FEEDBACK_SECTION_TITLE_PATTERN }(?:\\*\\*)?\\s*[：:]?)|$)`, 'u'),
      ''
    )
    .trim()

  if (
    stripped === source
    && /完整的参考答案|本题参考答案|正确答案如下|参考答案如下/u.test(source)
  ) {
    const feedbackStart = source.search(
      new RegExp(`\\n\\s*(?:#{2,4}\\s*)?${ FEEDBACK_SECTION_TITLE_PATTERN }\\s*[：:]?`, 'u')
    )
    if (feedbackStart > 0) {
      return source.slice(feedbackStart).trim()
    }
  }

  return stripped
}

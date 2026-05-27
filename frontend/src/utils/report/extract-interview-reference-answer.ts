/** 从单条 AI 反馈 Markdown 中截取「参考答案」段落 */
export const extractReferenceAnswerFromAssistantContent = (content: string) => {
  const source = content.trim()
  if (!source) return ''

  const section = source.match(/#{2,4}\s*参考答案\s*\n+([\s\S]*?)(?=\n#{2,4}\s|$)/u)
  return section?.[1]?.trim() || ''
}

/** 去掉「参考答案」段落，避免与报告「正确答案」重复展示 */
export const stripReferenceAnswerSection = (content: string) => {
  const source = content.trim()
  if (!source) return ''
  return source.replace(/#{2,4}\s*参考答案\s*\n+[\s\S]*?(?=\n#{2,4}\s|$)/u, '').trim()
}

/** 报告展示用：去掉线程标题里重复的「第 N 题 · 第 N / M 题 ·」前缀 */
export const cleanReportQuestionTitle = (title: string) => {
  const normalized = title.trim()
  if (!normalized) return '未命名题目'

  const withoutLeadingIndex = normalized
    .replace(/^第\s*\d+\s*题\s*·\s*/u, '')
    .replace(/^第\s*\d+\s*\/\s*\d+\s*题\s*·\s*/u, '')
    .trim()

  return withoutLeadingIndex || normalized
}

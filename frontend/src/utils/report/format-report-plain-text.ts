/** 报告里单行摘要：压成一行预览 */
export const formatReportPlainText = (text: string, maxLength = 600) => {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  if (normalized.length <= maxLength) return normalized
  return `${ normalized.slice(0, maxLength) }...`
}

/** 报告逐题复盘多轮对话：保留换行，仅做长度截断 */
export const formatReportDialogueText = (text: string, maxLength = 2400) => {
  const normalized = text.trim()
  if (!normalized) return ''
  if (normalized.length <= maxLength) return normalized
  return `${ normalized.slice(0, maxLength) }...`
}

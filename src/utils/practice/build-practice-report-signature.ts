import type { PersistedReportSummary } from '@/types/workbench'

/** 报告驱动题池失效签名：弱项、补练计划或逐题复盘变化即需重新生成 */
export function buildPracticeReportSignature(report: PersistedReportSummary): string {
  const plan = report.practicePlan
  const reviewSignature = (report.questionReviews || [])
    .map(item => [
      item.questionId,
      item.questionTitle,
      (item.userAnswer || '').slice(0, 120),
      (item.aiFeedback || '').slice(0, 120)
    ].join('~'))
    .join('|')

  return [
    report.sessionId,
    (report.weaknessTags || []).join(','),
    report.primaryWeakness || '',
    plan?.weaknessTag || '',
    plan?.focusArea || '',
    plan?.zone || '',
    plan?.questionType || '',
    plan?.difficulty || '',
    report.sourceDocumentId || '',
    reviewSignature
  ].join('::')
}

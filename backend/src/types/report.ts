/**
 * Phase 28 — report summary types (frozen contract, see docs/28.1-report-api-contract.md).
 * Aligns with frontend PersistedReportSummary where noted.
 */

export interface StoredInterviewReportSummary {
  /** Stable report id, e.g. report-{sessionId} */
  id: string
  sessionId: string
  owner?: string
  /**
   * Optional primary thread for this round.
   * When absent, consumers treat the report as round-level (whole session).
   */
  threadId?: string
  topic: string
  source: string
  sourceDocumentId?: string
  sourceDocumentName?: string
  questionTitle?: string
  summaryHeadline: string
  summaryBody: string
  weaknessTags: string[]
  primaryWeakness?: string
  weaknessFocusAreas?: string[]
  answeredCount: number
  totalCount: number
  answerSnapshot?: string[]
  suggestedFocus?: string[]
  practicePlan?: {
    weaknessTag: string
    questionType: string
    difficulty: string
    zone: string
  }
  createdAt: string
  updatedAt: string
}

export interface InterviewReportListItem {
  id: string
  sessionId: string
  threadId?: string
  topic: string
  questionTitle?: string
  summaryHeadline: string
  answeredCount: number
  totalCount: number
  weaknessTags: string[]
  createdAt: string
  updatedAt: string
}

export interface GenerateInterviewReportRequest {
  sessionId: string
  /** Round metadata from frontend; backend may also infer from stored sessions */
  topic?: string
  source?: string
  sourceDocumentId?: string
  sourceDocumentName?: string
  answeredCount?: number
  totalCount?: number
  weaknessTags?: string[]
  primaryWeakness?: string
}

export interface GenerateInterviewReportResponse {
  report: StoredInterviewReportSummary
  created: boolean
}

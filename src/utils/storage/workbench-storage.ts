import type {
  PersistedInterviewSession,
  PersistedLibraryDocument,
  PersistedReportSummary,
  PersistedWorkbenchContext
} from '@/types/workbench'

export const WORKBENCH_STORAGE_KEYS = {
  libraryDocuments: 'offerpilot.library.documents',
  workbenchContext: 'offerpilot.workbench.context',
  interviewSessions: 'offerpilot.interview.sessions',
  reportSummaries: 'offerpilot.report.summaries',
  materialQuestionPools: 'offerpilot.material.questionPools',
  practiceQuestionPools: 'offerpilot.practice.questionPools'
} as const

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage

const readJSON = <T>(key: string, fallback: T): T => {
  if (!canUseStorage()) return fallback

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

const writeJSON = <T>(key: string, value: T) => {
  if (!canUseStorage()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export const getPersistedLibraryDocuments = () => {
  return readJSON<PersistedLibraryDocument[]>(WORKBENCH_STORAGE_KEYS.libraryDocuments, [])
}

export const setPersistedLibraryDocuments = (documents: PersistedLibraryDocument[]) => {
  writeJSON(WORKBENCH_STORAGE_KEYS.libraryDocuments, documents)
}

export const getPersistedWorkbenchContext = () => {
  return readJSON<PersistedWorkbenchContext | null>(WORKBENCH_STORAGE_KEYS.workbenchContext, null)
}

export const setPersistedWorkbenchContext = (context: PersistedWorkbenchContext) => {
  writeJSON(WORKBENCH_STORAGE_KEYS.workbenchContext, context)
}

export const removePersistedWorkbenchContext = () => {
  if (!canUseStorage()) return
  window.localStorage.removeItem(WORKBENCH_STORAGE_KEYS.workbenchContext)
}

export const getPersistedInterviewSessions = () => {
  return readJSON<PersistedInterviewSession[]>(WORKBENCH_STORAGE_KEYS.interviewSessions, [])
}

export const setPersistedInterviewSessions = (sessions: PersistedInterviewSession[]) => {
  writeJSON(WORKBENCH_STORAGE_KEYS.interviewSessions, sessions)
}

export const getPersistedReportSummaries = () => {
  return readJSON<PersistedReportSummary[]>(WORKBENCH_STORAGE_KEYS.reportSummaries, [])
}

export const setPersistedReportSummaries = (summaries: PersistedReportSummary[]) => {
  writeJSON(WORKBENCH_STORAGE_KEYS.reportSummaries, summaries)
}

export const clearWorkbenchStorage = () => {
  if (!canUseStorage()) return
  Object.values(WORKBENCH_STORAGE_KEYS).forEach((key) => {
    window.localStorage.removeItem(key)
  })
}

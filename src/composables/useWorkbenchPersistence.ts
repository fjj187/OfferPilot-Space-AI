import type {
  PersistedInterviewMode,
  PersistedInterviewSession,
  PersistedInterviewStatus,
  PersistedLibraryDocument,
  PersistedReportSummary,
  PersistedTopicKey,
  PersistedWorkbenchContext
} from '@/types/workbench'
import {
  getPersistedInterviewSessions,
  getPersistedLibraryDocuments,
  getPersistedReportSummaries,
  getPersistedWorkbenchContext,
  setPersistedInterviewSessions,
  setPersistedLibraryDocuments,
  setPersistedReportSummaries,
  setPersistedWorkbenchContext
} from '@/utils/storage/workbench-storage'

const nowISO = () => new Date().toISOString()

export const useWorkbenchPersistence = () => {
  const loadLibraryDocuments = <T extends PersistedLibraryDocument>(seedDocuments: T[]) => {
    const storedDocuments = getPersistedLibraryDocuments() as T[]
    const seedMap = new Map(seedDocuments.map(item => [item.id, item]))
    const merged = [...storedDocuments.filter(item => !seedMap.has(item.id)), ...seedDocuments]
    return merged
  }

  const saveImportedLibraryDocuments = (documents: PersistedLibraryDocument[]) => {
    setPersistedLibraryDocuments(documents)
  }

  const loadWorkbenchContext = () => {
    return getPersistedWorkbenchContext()
  }

  const saveWorkbenchContext = (payload: Omit<PersistedWorkbenchContext, 'updatedAt'>) => {
    const nextContext: PersistedWorkbenchContext = {
      ...payload,
      updatedAt: nowISO()
    }
    setPersistedWorkbenchContext(nextContext)
    return nextContext
  }

  const loadInterviewSessions = () => {
    return getPersistedInterviewSessions()
  }

  const getInterviewSessionById = (sessionId: string) => {
    return getPersistedInterviewSessions().find(item => item.id === sessionId) || null
  }

  const findInterviewSession = (matcher: {
    topic: PersistedTopicKey
    mode: PersistedInterviewMode
    source: string
    status?: PersistedInterviewStatus
  }) => {
    return getPersistedInterviewSessions().find(item => (
      item.topic === matcher.topic
      && item.mode === matcher.mode
      && item.source === matcher.source
      && (!matcher.status || item.status === matcher.status)
    ))
  }

  const createInterviewSession = (payload: Omit<PersistedInterviewSession, 'startedAt'>) => {
    const sessions = getPersistedInterviewSessions()
    const nextSession: PersistedInterviewSession = {
      ...payload,
      startedAt: nowISO()
    }
    setPersistedInterviewSessions([nextSession, ...sessions.filter(item => item.id !== nextSession.id)])
    return nextSession
  }

  const updateInterviewSession = (sessionId: string, patch: Partial<PersistedInterviewSession>) => {
    const sessions = getPersistedInterviewSessions()
    const nextSessions = sessions.map((item) => {
      if (item.id !== sessionId) return item
      return {
        ...item,
        ...patch
      }
    })
    setPersistedInterviewSessions(nextSessions)
    return nextSessions.find(item => item.id === sessionId) || null
  }

  const completeInterviewSession = (sessionId: string, patch: Partial<PersistedInterviewSession> = {}) => {
    return updateInterviewSession(sessionId, {
      ...patch,
      status: 'completed',
      finishedAt: nowISO()
    })
  }

  const abortInterviewSession = (sessionId: string) => {
    return updateInterviewSession(sessionId, {
      status: 'aborted',
      finishedAt: nowISO()
    })
  }

  const loadReportSummaries = () => {
    return getPersistedReportSummaries()
  }

  const getReportSummaryBySessionId = (sessionId: string) => {
    return getPersistedReportSummaries().find(item => item.sessionId === sessionId) || null
  }

  const saveReportSummary = (payload: PersistedReportSummary) => {
    const summaries = getPersistedReportSummaries()
    const nextSummaries = [payload, ...summaries.filter(item => item.id !== payload.id)]
    setPersistedReportSummaries(nextSummaries)
    return payload
  }

  return {
    loadLibraryDocuments,
    saveImportedLibraryDocuments,
    loadWorkbenchContext,
    saveWorkbenchContext,
    loadInterviewSessions,
    getInterviewSessionById,
    findInterviewSession,
    createInterviewSession,
    updateInterviewSession,
    completeInterviewSession,
    abortInterviewSession,
    loadReportSummaries,
    getReportSummaryBySessionId,
    saveReportSummary
  }
}

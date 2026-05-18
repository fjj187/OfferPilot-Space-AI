import { ref } from 'vue'
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
const workbenchStorageVersion = ref(0)

const touchWorkbenchStorage = () => {
  workbenchStorageVersion.value += 1
}

export const useWorkbenchPersistence = () => {
  const loadLibraryDocuments = <T extends PersistedLibraryDocument>(seedDocuments: T[]) => {
    workbenchStorageVersion.value
    const storedDocuments = getPersistedLibraryDocuments() as T[]
    const seedMap = new Map(seedDocuments.map(item => [item.id, item]))
    const merged = [...storedDocuments.filter(item => !seedMap.has(item.id)), ...seedDocuments]
    return merged
  }

  const saveImportedLibraryDocuments = (documents: PersistedLibraryDocument[]) => {
    setPersistedLibraryDocuments(documents)
    touchWorkbenchStorage()
  }

  const loadWorkbenchContext = () => {
    workbenchStorageVersion.value
    return getPersistedWorkbenchContext()
  }

  const saveWorkbenchContext = (payload: Omit<PersistedWorkbenchContext, 'updatedAt'>) => {
    const previousContext = getPersistedWorkbenchContext()
    const nextContext: PersistedWorkbenchContext = {
      ...(previousContext || {}),
      ...payload,
      updatedAt: nowISO()
    }
    setPersistedWorkbenchContext(nextContext)
    touchWorkbenchStorage()
    return nextContext
  }

  const loadInterviewSessions = () => {
    workbenchStorageVersion.value
    return getPersistedInterviewSessions()
  }

  const getInterviewSessionById = (sessionId: string) => {
    workbenchStorageVersion.value
    return getPersistedInterviewSessions().find(item => item.id === sessionId) || null
  }

  const findInterviewSession = (matcher: {
    topic: PersistedTopicKey
    mode: PersistedInterviewMode
    source: string
    sessionConfigKey?: string
    status?: PersistedInterviewStatus
  }) => {
    workbenchStorageVersion.value
      return getPersistedInterviewSessions().find(item => (
        item.topic === matcher.topic
        && item.mode === matcher.mode
        && item.source === matcher.source
        && (!matcher.sessionConfigKey || item.sessionConfigKey === matcher.sessionConfigKey)
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
    touchWorkbenchStorage()
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
    touchWorkbenchStorage()
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

  const removeInterviewSession = (sessionId: string) => {
    const sessions = getPersistedInterviewSessions()
    const nextSessions = sessions.filter(item => item.id !== sessionId)
    setPersistedInterviewSessions(nextSessions)
    touchWorkbenchStorage()
    return nextSessions
  }

  const loadReportSummaries = () => {
    workbenchStorageVersion.value
    return getPersistedReportSummaries()
  }

  const getReportSummaryBySessionId = (sessionId: string) => {
    workbenchStorageVersion.value
    return getPersistedReportSummaries().find(item => item.sessionId === sessionId) || null
  }

  const saveReportSummary = (payload: PersistedReportSummary) => {
    const summaries = getPersistedReportSummaries()
    const nextSummaries = [payload, ...summaries.filter(item => item.id !== payload.id)]
    setPersistedReportSummaries(nextSummaries)
    touchWorkbenchStorage()
    return payload
  }

  const removeReportSummariesBySessionId = (sessionId: string) => {
    const summaries = getPersistedReportSummaries()
    const nextSummaries = summaries.filter(item => item.sessionId !== sessionId)
    setPersistedReportSummaries(nextSummaries)
    touchWorkbenchStorage()
    return nextSummaries
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
    removeInterviewSession,
    loadReportSummaries,
    getReportSummaryBySessionId,
    saveReportSummary,
    removeReportSummariesBySessionId
  }
}

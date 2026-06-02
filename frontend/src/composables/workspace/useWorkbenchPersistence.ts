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
  getPersistedRemovedLibraryDocumentIds,
  getPersistedReportSummaries,
  getPersistedWorkbenchContext,
  setPersistedInterviewSessions,
  setPersistedLibraryDocuments,
  setPersistedRemovedLibraryDocumentIds,
  setPersistedReportSummaries,
  setPersistedWorkbenchContext
} from '@/services/storage/workbench-storage'

const nowISO = () => new Date().toISOString()
const workbenchStorageVersion = ref(0)

const normalizeLibraryDocument = <T extends PersistedLibraryDocument>(document: T): T => ({
  ...document,
  type: document.type === 'docs' ? 'docx' : document.type,
  tags: Array.isArray(document.tags) ? document.tags : [],
  topicKeys: Array.isArray(document.topicKeys) ? document.topicKeys : [],
  importedName: document.importedName?.trim() || document.name,
  summary: document.summary || '当前资料还没有摘要，后续可补充解析。',
  rawText: document.rawText || ''
})

const touchWorkbenchStorage = () => {
  workbenchStorageVersion.value += 1
}

export const useWorkbenchPersistence = () => {
  const loadLibraryDocuments = <T extends PersistedLibraryDocument>(seedDocuments: T[]) => {
    void workbenchStorageVersion.value
    const removedDocumentIds = new Set(getPersistedRemovedLibraryDocumentIds())
    const storedDocuments = (getPersistedLibraryDocuments() as T[])
      .map(item => normalizeLibraryDocument(item))
      .filter(item => !removedDocumentIds.has(item.id))
    const normalizedSeeds = seedDocuments
      .map(item => normalizeLibraryDocument(item))
      .filter(item => !removedDocumentIds.has(item.id))
    const seedMap = new Map(normalizedSeeds.map(item => [item.id, item]))
    const merged = [...storedDocuments.filter(item => !seedMap.has(item.id)), ...normalizedSeeds]
    return merged
  }

  const saveImportedLibraryDocuments = (documents: PersistedLibraryDocument[]) => {
    setPersistedLibraryDocuments(documents.map(item => normalizeLibraryDocument(item)))
    touchWorkbenchStorage()
  }

  const rememberRemovedLibraryDocument = (documentId: string) => {
    if (!documentId) return
    const removedDocumentIds = new Set(getPersistedRemovedLibraryDocumentIds())
    if (removedDocumentIds.has(documentId)) return
    removedDocumentIds.add(documentId)
    setPersistedRemovedLibraryDocumentIds([...removedDocumentIds])
    touchWorkbenchStorage()
  }

  const loadWorkbenchContext = () => {
    void workbenchStorageVersion.value
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
    void workbenchStorageVersion.value
    return getPersistedInterviewSessions()
  }

  const getInterviewSessionById = (sessionId: string) => {
    void workbenchStorageVersion.value
    return getPersistedInterviewSessions().find(item => item.id === sessionId) || null
  }

  const findInterviewSession = (matcher: {
    topic: PersistedTopicKey
    mode: PersistedInterviewMode
    source: string
    sessionConfigKey?: string
    status?: PersistedInterviewStatus
  }) => {
    void workbenchStorageVersion.value
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
    void workbenchStorageVersion.value
    return getPersistedReportSummaries()
  }

  const getReportSummaryBySessionId = (sessionId: string) => {
    void workbenchStorageVersion.value
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
    rememberRemovedLibraryDocument,
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

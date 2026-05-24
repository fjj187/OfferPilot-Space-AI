import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { StoredInterviewReportSummary } from '../types/report.js'
import { backendEnv } from '../utils/env.js'

interface PersistedInterviewReportPayload {
  reports: StoredInterviewReportSummary[]
}

const storageDirPath = path.resolve(process.cwd(), backendEnv.storageDir)
const storageFilePath = path.join(storageDirPath, 'interview-reports.json')
const temporaryStorageFilePath = `${ storageFilePath }.tmp`

const isStoredInterviewReportSummary = (value: unknown): value is StoredInterviewReportSummary => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as StoredInterviewReportSummary
  return typeof candidate.id === 'string'
    && typeof candidate.sessionId === 'string'
    && typeof candidate.topic === 'string'
    && typeof candidate.source === 'string'
    && typeof candidate.summaryHeadline === 'string'
    && typeof candidate.summaryBody === 'string'
    && Array.isArray(candidate.weaknessTags)
    && typeof candidate.answeredCount === 'number'
    && typeof candidate.totalCount === 'number'
    && typeof candidate.createdAt === 'string'
    && typeof candidate.updatedAt === 'string'
}

const loadStoredReports = () => {
  mkdirSync(storageDirPath, {
    recursive: true
  })

  if (!existsSync(storageFilePath)) {
    return new Map<string, StoredInterviewReportSummary>()
  }

  try {
    const rawContent = readFileSync(storageFilePath, 'utf8')
    if (!rawContent.trim()) {
      return new Map<string, StoredInterviewReportSummary>()
    }

    const parsed = JSON.parse(rawContent) as Partial<PersistedInterviewReportPayload>
    const reports = Array.isArray(parsed.reports) ? parsed.reports.filter(isStoredInterviewReportSummary) : []

    return new Map(
      reports.map(report => [report.sessionId, report])
    )
  } catch (error) {
    console.warn('[backend] failed to load interview report store:', error)
    return new Map<string, StoredInterviewReportSummary>()
  }
}

const reportStore = loadStoredReports()

const persistReportStore = () => {
  mkdirSync(storageDirPath, {
    recursive: true
  })

  const payload: PersistedInterviewReportPayload = {
    reports: [...reportStore.values()].sort((left, right) => {
      return left.updatedAt < right.updatedAt ? 1 : -1
    })
  }

  writeFileSync(temporaryStorageFilePath, JSON.stringify(payload, null, 2), 'utf8')
  renameSync(temporaryStorageFilePath, storageFilePath)
}

export const getStoredInterviewReports = () => {
  return [...reportStore.values()].sort((left, right) => {
    return left.updatedAt < right.updatedAt ? 1 : -1
  })
}

export const getStoredInterviewReportBySessionId = (sessionId: string) => {
  return reportStore.get(sessionId) || null
}

export const upsertStoredInterviewReport = (report: StoredInterviewReportSummary) => {
  const existing = reportStore.get(report.sessionId)
  reportStore.set(report.sessionId, {
    ...report,
    createdAt: existing?.createdAt || report.createdAt,
    updatedAt: report.updatedAt
  })
  persistReportStore()
  return reportStore.get(report.sessionId) || report
}

export const removeStoredInterviewReportsBySessionId = (sessionId: string) => {
  const removed = reportStore.delete(sessionId)
  if (removed) {
    persistReportStore()
  }
  return removed
}

export const getInterviewReportStoreFilePath = () => storageFilePath

export const clearAllStoredInterviewReports = () => {
  reportStore.clear()
  persistReportStore()
}

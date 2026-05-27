import type { PracticeQuestionPool } from '@/types/practice-pool'
import { WORKBENCH_STORAGE_KEYS } from '@/services/storage/workbench-storage'

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage

const readPoolMap = (): Record<string, PracticeQuestionPool> => {
  if (!canUseStorage()) return {}

  try {
    const raw = window.localStorage.getItem(WORKBENCH_STORAGE_KEYS.practiceQuestionPools)
    return raw ? JSON.parse(raw) as Record<string, PracticeQuestionPool> : {}
  } catch {
    return {}
  }
}

const writePoolMap = (value: Record<string, PracticeQuestionPool>) => {
  if (!canUseStorage()) return
  window.localStorage.setItem(WORKBENCH_STORAGE_KEYS.practiceQuestionPools, JSON.stringify(value))
}

export const getPracticeQuestionPool = (sessionId: string) => {
  return readPoolMap()[sessionId] || null
}

export const setPracticeQuestionPool = (pool: PracticeQuestionPool) => {
  const nextMap = readPoolMap()
  nextMap[pool.sessionId] = pool
  writePoolMap(nextMap)
  return pool
}

export const removePracticeQuestionPool = (sessionId: string) => {
  const nextMap = readPoolMap()
  delete nextMap[sessionId]
  writePoolMap(nextMap)
}

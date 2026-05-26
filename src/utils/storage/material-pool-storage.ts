import type { MaterialQuestionPool } from '@/types/material'

import { WORKBENCH_STORAGE_KEYS } from '@/utils/storage/workbench-storage'

export const MATERIAL_POOL_STORAGE_KEY = WORKBENCH_STORAGE_KEYS.materialQuestionPools

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage

const readPoolMap = (): Record<string, MaterialQuestionPool> => {
  if (!canUseStorage()) return {}

  try {
    const raw = window.localStorage.getItem(MATERIAL_POOL_STORAGE_KEY)
    return raw ? JSON.parse(raw) as Record<string, MaterialQuestionPool> : {}
  } catch {
    return {}
  }
}

const writePoolMap = (value: Record<string, MaterialQuestionPool>) => {
  if (!canUseStorage()) return
  window.localStorage.setItem(MATERIAL_POOL_STORAGE_KEY, JSON.stringify(value))
}

export const getMaterialQuestionPool = (documentId: string) => {
  return readPoolMap()[documentId] || null
}

export const setMaterialQuestionPool = (pool: MaterialQuestionPool) => {
  const nextMap = readPoolMap()
  nextMap[pool.documentId] = pool
  writePoolMap(nextMap)
  return pool
}

export const removeMaterialQuestionPool = (documentId: string) => {
  const nextMap = readPoolMap()
  delete nextMap[documentId]
  writePoolMap(nextMap)
}

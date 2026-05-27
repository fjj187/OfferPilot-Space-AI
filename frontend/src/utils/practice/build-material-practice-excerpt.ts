import { normalizeQuestionHeading } from '@/services/material/material-prompt'
import type { PersistedPracticeQuestionGroupItem } from '@/types/workbench'
import { getMaterialQuestionPool } from '@/services/storage/material-pool-storage'

const DEFAULT_MAX_LENGTH = 2000

/** 汇总本轮资料题关联分块，供弱项补练 LLM 理解资料语境（上限约 2k 字） */
export function buildMaterialPracticeExcerpt(
  documentId: string,
  groupItems: PersistedPracticeQuestionGroupItem[],
  options?: {
    fallbackRawText?: string
    maxLength?: number
  }
): string {
  const maxLength = options?.maxLength ?? DEFAULT_MAX_LENGTH
  const pool = getMaterialQuestionPool(documentId)
  const chunkIds = [...new Set(
    groupItems
      .map(item => item.sourceChunkId)
      .filter((id): id is string => Boolean(id))
  )]

  const segments: string[] = []
  let totalLength = 0

  const appendSegment = (segment: string) => {
    const normalized = segment.trim()
    if (!normalized) return false

    const remaining = maxLength - totalLength
    if (remaining <= 0) return false

    if (normalized.length <= remaining) {
      segments.push(normalized)
      totalLength += normalized.length + 2
      return true
    }

    segments.push(`${ normalized.slice(0, remaining) }…`)
    totalLength = maxLength
    return false
  }

  if (pool && chunkIds.length) {
    for (const chunkId of chunkIds) {
      const chunk = pool.chunks.find(item => item.id === chunkId)
      if (!chunk?.text?.trim()) continue

      const heading = normalizeQuestionHeading(chunk.heading)
      const body = chunk.text.trim()
      const segment = heading ? `【${ heading }】\n${ body }` : body
      if (!appendSegment(segment)) break
    }
  }

  if (totalLength < maxLength && options?.fallbackRawText?.trim()) {
    appendSegment(options.fallbackRawText.replace(/\s+/g, ' ').trim())
  }

  return segments.join('\n\n').slice(0, maxLength)
}

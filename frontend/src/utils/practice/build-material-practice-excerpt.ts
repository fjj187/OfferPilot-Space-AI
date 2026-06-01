import { normalizeQuestionHeading } from '@/services/material/material-prompt'
import type { MaterialChunk } from '@/types/material'
import type { PersistedPracticeQuestionGroupItem } from '@/types/workbench'
import { getMaterialQuestionPool } from '@/services/storage/material-pool-storage'

const DEFAULT_MAX_LENGTH = 2000

/** 按全文 charStart 去掉与已覆盖区间重叠的正文前缀 */
const resolveChunkExcerptBody = (chunk: MaterialChunk, coveredUntil: number) => {
  const body = chunk.text.trim()
  if (!body) {
    return {
      body: '',
      coveredUntil
    }
  }

  const start = chunk.charStart
  const end = chunk.charEnd ?? (start !== undefined ? start + body.length : undefined)

  if (start === undefined || coveredUntil < 0) {
    return {
      body,
      coveredUntil: end ?? coveredUntil
    }
  }

  if (start >= coveredUntil) {
    return {
      body,
      coveredUntil: end ?? start + body.length
    }
  }

  const skipChars = coveredUntil - start
  if (skipChars >= body.length) {
    return {
      body: '',
      coveredUntil: Math.max(coveredUntil, end ?? coveredUntil)
    }
  }

  return {
    body: body.slice(skipChars).trim(),
    coveredUntil: Math.max(coveredUntil, end ?? start + body.length)
  }
}

const resolveOrderedGroupChunks = (chunks: MaterialChunk[], chunkIds: string[]) => {
  const chunkMap = new Map(chunks.map(chunk => [chunk.id, chunk]))

  return chunkIds
    .map(id => chunkMap.get(id))
    .filter((chunk): chunk is MaterialChunk => Boolean(chunk?.text?.trim()))
    .sort((prev, next) => (
      (prev.charStart ?? 0) - (next.charStart ?? 0)
      || prev.order - next.order
    ))
}

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
    let coveredUntil = -1

    for (const chunk of resolveOrderedGroupChunks(pool.chunks, chunkIds)) {
      const { body, coveredUntil: nextCoveredUntil } = resolveChunkExcerptBody(chunk, coveredUntil)
      coveredUntil = nextCoveredUntil
      if (!body) continue

      const heading = normalizeQuestionHeading(chunk.heading)
      const segment = heading ? `【${ heading }】\n${ body }` : body
      if (!appendSegment(segment)) break
    }
  }

  if (totalLength < maxLength && options?.fallbackRawText?.trim()) {
    appendSegment(options.fallbackRawText.replace(/\s+/g, ' ').trim())
  }

  return segments.join('\n\n').slice(0, maxLength)
}

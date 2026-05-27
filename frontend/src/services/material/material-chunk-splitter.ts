import type { MaterialChunk } from '@/types/material'

const headingPattern = /^(#{1,4})\s+(.+)$/
const maxChunkLength = 1000
const minChunkLength = 80
const minSubstantiveChunkLength = 12

const isSeparatorLine = (line: string) => /^-{3,}$/.test(line.trim()) || /^_{3,}$/.test(line.trim())

const normalizeSectionText = (lines: string[]) => {
  return lines
    .filter(line => !isSeparatorLine(line))
    .join('\n')
    .replace(/\n-{3,}\n/g, '\n')
    .replace(/-{3,}/g, '')
    .trim()
}

const pushChunk = (
  chunks: MaterialChunk[],
  documentId: string,
  heading: string,
  level: number,
  text: string,
  charStart: number
) => {
  const normalized = text.trim()
  if (!normalized) return

  chunks.push({
    id: `chunk-${ documentId }-${ chunks.length }`,
    documentId,
    order: chunks.length,
    heading: heading || `段落 ${ chunks.length + 1 }`,
    level,
    text: normalized,
    charStart,
    charEnd: charStart + normalized.length
  })
}

const splitLongText = (
  chunks: MaterialChunk[],
  documentId: string,
  heading: string,
  level: number,
  text: string,
  charStart: number
) => {
  if (text.length <= maxChunkLength) {
    pushChunk(chunks, documentId, heading, level, text, charStart)
    return
  }

  let offset = 0
  let partIndex = 0
  while (offset < text.length) {
    const slice = text.slice(offset, offset + maxChunkLength).trim()
    if (slice.length >= minChunkLength || offset + maxChunkLength >= text.length) {
      pushChunk(
        chunks,
        documentId,
        partIndex ? `${ heading }（续 ${ partIndex + 1 }）` : heading,
        level,
        slice,
        charStart + offset
      )
      partIndex += 1
    }
    offset += maxChunkLength - 100
  }
}

export function splitMaterialChunks(rawText: string, documentId: string): MaterialChunk[] {
  const normalizedText = rawText.replace(/\r\n/g, '\n').trim()
  if (!normalizedText) return []

  const lines = normalizedText.split('\n')
  const chunks: MaterialChunk[] = []
  let currentHeading = '资料正文'
  let currentLevel = 0
  let currentLines: string[] = []
  let charCursor = 0

  const flushSection = () => {
    const sectionText = normalizeSectionText(currentLines)
    if (!sectionText || sectionText.length < minSubstantiveChunkLength) {
      currentLines = []
      return
    }
    splitLongText(chunks, documentId, currentHeading, currentLevel, sectionText, charCursor)
    charCursor += sectionText.length
    currentLines = []
  }

  for (const line of lines) {
    const headingMatch = line.match(headingPattern)
    if (headingMatch) {
      flushSection()
      currentHeading = headingMatch[2].trim() || currentHeading
      currentLevel = headingMatch[1].length
      continue
    }
    if (!isSeparatorLine(line)) {
      currentLines.push(line)
    }
  }

  flushSection()

  if (!chunks.length) {
    splitLongText(chunks, documentId, '资料正文', 0, normalizedText, 0)
  }

  return chunks.map((chunk, index) => ({
    ...chunk,
    order: index
  }))
}

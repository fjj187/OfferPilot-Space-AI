import { describe, expect, it, vi } from 'vitest'
import type { MaterialQuestionPool } from '@/types/material'
import { buildMaterialPracticeExcerpt } from '@/utils/practice/build-material-practice-excerpt'

const pool: MaterialQuestionPool = {
  documentId: 'doc-1',
  documentVersion: 'v1',
  chunks: [{
    id: 'chunk-1',
    heading: '什么是 composable',
    level: 2,
    text: 'Composable 是复用有状态逻辑的函数封装方式。',
    order: 0
  }],
  questions: [],
  preparedAt: '2026-05-26T00:00:00.000Z',
  status: 'ready'
}

vi.mock('@/utils/storage/material-pool-storage', () => ({
  getMaterialQuestionPool: (documentId: string) => (
    documentId === 'doc-1' ? pool : null
  )
}))

describe('buildMaterialPracticeExcerpt', () => {
  it('拼接关联分块正文', () => {
    const excerpt = buildMaterialPracticeExcerpt('doc-1', [{
      questionId: 'q-1',
      order: 0,
      title: '题一',
      prompt: '题一',
      matchReason: 'focus_area',
      sourceDocumentId: 'doc-1',
      sourceChunkId: 'chunk-1'
    }])

    expect(excerpt).toContain('什么是 composable')
    expect(excerpt).toContain('Composable')
  })
})

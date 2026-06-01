import { describe, expect, it, vi } from 'vitest'
import type { MaterialQuestionPool } from '@/types/material'
import { buildMaterialPracticeExcerpt } from '@/utils/practice/build-material-practice-excerpt'

const pool: MaterialQuestionPool = {
  documentId: 'doc-1',
  documentVersion: 'v1',
  chunks: [{
    id: 'chunk-1',
    documentId: 'doc-1',
    heading: '什么是 composable',
    level: 2,
    text: 'Composable 是复用有状态逻辑的函数封装方式。',
    charStart: 0,
    charEnd: 28,
    order: 0
  }],
  questions: [],
  preparedAt: '2026-05-26T00:00:00.000Z',
  status: 'ready'
}

const overlappingPool: MaterialQuestionPool = {
  documentId: 'doc-overlap',
  documentVersion: 'v1',
  chunks: [
    {
      id: 'chunk-a',
      documentId: 'doc-overlap',
      heading: '长章节',
      level: 2,
      text: 'ABCDEF',
      charStart: 0,
      charEnd: 6,
      order: 0
    },
    {
      id: 'chunk-b',
      documentId: 'doc-overlap',
      heading: '长章节（续 2）',
      level: 2,
      text: 'DEFGHI',
      charStart: 4,
      charEnd: 10,
      order: 1
    }
  ],
  questions: [],
  preparedAt: '2026-05-26T00:00:00.000Z',
  status: 'ready'
}

vi.mock('@/services/storage/material-pool-storage', () => ({
  getMaterialQuestionPool: (documentId: string) => {
    if (documentId === 'doc-1') return pool
    if (documentId === 'doc-overlap') return overlappingPool
    return null
  }
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

  it('相邻块按 charStart 去掉重叠正文', () => {
    const excerpt = buildMaterialPracticeExcerpt('doc-overlap', [
      {
        questionId: 'q-a',
        order: 0,
        title: '题一',
        prompt: '题一',
        matchReason: 'focus_area',
        sourceDocumentId: 'doc-overlap',
        sourceChunkId: 'chunk-a'
      },
      {
        questionId: 'q-b',
        order: 1,
        title: '题二',
        prompt: '题二',
        matchReason: 'focus_area',
        sourceDocumentId: 'doc-overlap',
        sourceChunkId: 'chunk-b'
      }
    ])

    expect(excerpt).toContain('ABCDEF')
    expect(excerpt).toContain('FGHI')
    expect(excerpt).not.toContain('DEFGHI')
    expect((excerpt.match(/DEF/g) || []).length).toBe(1)
  })
})

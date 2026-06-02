import { describe, expect, it } from 'vitest'
import { buildMaterialQuestionPool } from '@/services/material/material-question-builder'
import { prepareMaterialRawText } from '@/services/material/normalize-interview-notes-markdown'
import {
  LIBRARY_IMPORT_ANSWER_PREFIX_EXAMPLE,
  LIBRARY_IMPORT_EXAMPLE_PAGES,
  LIBRARY_IMPORT_MARKDOWN_EXAMPLE,
  LIBRARY_IMPORT_NUMBERED_EXAMPLE
} from '@/services/library/library-import-example-document'
import type { PersistedLibraryDocument } from '@/types/workbench'

const createDocument = (rawText: string, type: PersistedLibraryDocument['type']): PersistedLibraryDocument => ({
  id: 'doc-example',
  name: type === 'md' ? '结构示例.md' : '结构示例.docx',
  type,
  size: 2048,
  importedAt: '2026-05-25T00:00:00.000Z',
  status: 'parsed',
  topicKeys: ['browser'],
  sourceKey: 'library',
  tags: ['示例'],
  summary: '导入结构示例',
  rawText: prepareMaterialRawText(rawText)
})

describe('library-import-example-document', () => {
  it('提供三页资料结构示例', () => {
    expect(LIBRARY_IMPORT_EXAMPLE_PAGES).toHaveLength(3)
    expect(LIBRARY_IMPORT_EXAMPLE_PAGES.map(page => page.label)).toEqual([
      '标题分层',
      '编号分割',
      '答：分隔'
    ])
  })

  it('标题分层示例可稳定产出练习题', () => {
    const pool = buildMaterialQuestionPool(createDocument(LIBRARY_IMPORT_MARKDOWN_EXAMPLE, 'md'))

    expect(pool.status).toBe('ready')
    expect(pool.questions.length).toBeGreaterThanOrEqual(3)
    expect(pool.questions.some(item => item.referenceAnswer)).toBe(true)
  })

  it('编号分割示例可稳定产出练习题', () => {
    const pool = buildMaterialQuestionPool(createDocument(LIBRARY_IMPORT_NUMBERED_EXAMPLE, 'md'))

    expect(pool.status).toBe('ready')
    expect(pool.questions.length).toBeGreaterThanOrEqual(3)
    expect(pool.questions.some(item => /ref|computed|Proxy/.test(item.title))).toBe(true)
  })

  it('答：分隔示例可稳定产出练习题', () => {
    const pool = buildMaterialQuestionPool(createDocument(LIBRARY_IMPORT_ANSWER_PREFIX_EXAMPLE, 'docx'))

    expect(pool.status).toBe('ready')
    expect(pool.questions.length).toBeGreaterThanOrEqual(3)
    expect(pool.questions.some(item => /隐藏元素|Flex|协作/.test(item.title))).toBe(true)
  })
})

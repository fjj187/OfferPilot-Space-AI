import { describe, expect, it, vi } from 'vitest'
import {
  normalizeDocxMarkdown,
  parseDocxArrayBuffer
} from '@/services/material/parse-docx-file'

vi.mock('mammoth', () => ({
  default: {
    convertToMarkdown: vi.fn(async () => ({
      value: '## Vue3 响应式\r\n\r\nref 与 reactive 的区别。\r\n\r\n\r\n',
      messages: [{ type: 'warning', message: 'sample warning' }]
    }))
  }
}))

describe('parse-docx-file', () => {
  it('normalizeDocxMarkdown 统一换行并收敛空行', () => {
    expect(normalizeDocxMarkdown('a\r\n\r\n\r\nb')).toBe('a\n\nb')
  })

  it('parseDocxArrayBuffer 返回 Markdown 正文与 warnings', async () => {
    const result = await parseDocxArrayBuffer(new ArrayBuffer(8))

    expect(result.rawText).toContain('## Vue3 响应式')
    expect(result.rawText).toContain('ref 与 reactive')
    expect(result.warnings).toEqual(['sample warning'])
  })
})

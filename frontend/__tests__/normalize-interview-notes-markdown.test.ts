import { describe, expect, it } from 'vitest'
import { buildMaterialQuestionPool } from '@/services/material/material-question-builder'
import {
  isInterviewNotesMarkdown,
  normalizeInterviewNotesMarkdown,
  prepareMaterialRawText
} from '@/services/material/normalize-interview-notes-markdown'
import { splitMaterialChunks } from '@/services/material/material-chunk-splitter'
import type { PersistedLibraryDocument } from '@/types/workbench'

/** 模拟 mammoth 从面经 docx 转出的原始 Markdown */
const mammothInterviewNotesSample = `
12.10 一面

# __1\\. 隐藏元素的方法__

## __答：常见做法有 display: none、visibility: hidden、opacity: 0。__

它们的核心差异在于是否占据布局空间。

__2\\. display: none 与 visibility: hidden 在浏览器性能上有哪些区别__

## __答：display: none 会让元素脱离文档流，通常涉及 reflow + repaint。__

__3\\. 讲下 flex 和 grid 布局__

## __答：Flex 是一维布局，重点解决沿主轴怎么分配空间。__

Grid 是二维布局，适合卡片矩阵。

__9\\. 手撕快排__

## __答：快排思路是选基准值，把数组分成小于基准和大于基准两边。__

\`\`\`javascript
function quickSort(arr) {
  if (arr.length <= 1) return arr
}
\`\`\`

12.12 二面

1. __你在公司级项目里做前后端协作时，和上下游、后端一般是怎么配合的？__

## __答：我会先对齐接口契约与联调节奏，再分阶段交付。__

1. __你理解的 RESTful 是什么？__

## __答：REST 强调资源导向、统一接口、无状态与可缓存。__
`.trim()

describe('normalize-interview-notes-markdown', () => {
  it('识别面经 docx 结构', () => {
    expect(isInterviewNotesMarkdown(mammothInterviewNotesSample)).toBe(true)
    expect(isInterviewNotesMarkdown('### meta 标签有哪些？\n\n- charset')).toBe(false)
  })

  it('归一化为 ### 题面 + 参考答案正文', () => {
    const normalized = normalizeInterviewNotesMarkdown(mammothInterviewNotesSample)

    expect(normalized).toContain('### 1. 隐藏元素的方法')
    expect(normalized).toContain('display: none、visibility: hidden')
    expect(normalized).toContain('### 3. 讲下 flex 和 grid 布局')
    expect(normalized).toContain('Grid 是二维布局')
    expect(normalized).toContain('## 12.12 二面')
    expect(normalized).not.toMatch(/^## 答/m)
  })

  it('切分后题面不是「答：」开头', () => {
    const normalized = prepareMaterialRawText(mammothInterviewNotesSample)
    const chunks = splitMaterialChunks(normalized, 'doc-notes')

    expect(chunks.length).toBeGreaterThanOrEqual(5)
    expect(chunks.every(chunk => !/^答[：:]/.test(chunk.heading))).toBe(true)
    expect(chunks.some(chunk => /隐藏元素/.test(chunk.heading))).toBe(true)
    expect(chunks.some(chunk => /手撕快排/.test(chunk.heading))).toBe(true)
  })

  it('面经资料能稳定产出带参考答案的题库', () => {
    const document: PersistedLibraryDocument = {
      id: 'doc-mianjing',
      name: '面经.docx',
      type: 'docx',
      size: 4096,
      importedAt: '2026-06-02T00:00:00.000Z',
      status: 'parsed',
      topicKeys: ['browser'],
      sourceKey: 'library',
      tags: ['面经'],
      summary: '面经',
      rawText: mammothInterviewNotesSample
    }

    const pool = buildMaterialQuestionPool(document)

    expect(pool.status).toBe('ready')
    expect(pool.questions.length).toBeGreaterThanOrEqual(5)

    const titles = pool.questions.map(item => item.title)
    expect(titles.some(title => /隐藏元素/.test(title))).toBe(true)
    expect(titles.some(title => /flex 和 grid|flex/.test(title))).toBe(true)
    expect(titles.some(title => /RESTful|REST/.test(title))).toBe(true)

    const withReference = pool.questions.filter(item => item.referenceAnswer)
    expect(withReference.length).toBeGreaterThanOrEqual(4)
    expect(withReference.some(item => /display: none/.test(item.referenceAnswer || ''))).toBe(true)
  })
})

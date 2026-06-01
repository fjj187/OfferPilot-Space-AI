import { describe, expect, it } from 'vitest'
import { splitMaterialChunks } from '@/services/material/material-chunk-splitter'
import { buildMaterialQuestionPool } from '@/services/material/material-question-builder'
import { buildMaterialQuestionGroup, defaultMaterialGroupCompileOptions } from '@/services/material/material-question-group-builder'
import type { PersistedLibraryDocument } from '@/types/workbench'

const interviewMarkdown = `
## HTML 基础

### meta 标签有哪些？分别有什么作用？

- charset：字符编码
- viewport：视口设置
- description：页面描述

### script 标签中 defer 和 async 的区别？

两者都是异步加载脚本，不阻塞 HTML 解析，但执行时机不同：
- async：加载完成后立即执行
- defer：等待 HTML 解析完毕再执行

## 语义化

### 语义化标签有哪些？为什么要用语义化？

常见标签包括 header、nav、main、article、section、aside、footer。
语义化有助于 SEO 与可访问性。

### 如何理解 BFC？

BFC 是块级格式化上下文，用于隔离布局与清除浮动。

### inline 和 block 元素有什么区别？

inline 不换行，block 独占一行并可设置宽高。
`.trim()

const createDocument = (): PersistedLibraryDocument => ({
  id: 'doc-interview-md',
  name: '前端面试.md',
  type: 'md',
  size: 2048,
  importedAt: '2026-05-25T00:00:00.000Z',
  status: 'parsed',
  topicKeys: ['vue3'],
  sourceKey: 'library',
  tags: ['html'],
  summary: '前端面试资料',
  rawText: interviewMarkdown
})

describe('material question pipeline', () => {
  it('从常见面试资料结构稳定产出足够题目', () => {
    const pool = buildMaterialQuestionPool(createDocument())

    expect(pool.status).toBe('ready')
    expect(pool.chunks.length).toBeGreaterThanOrEqual(4)
    expect(pool.questions.length).toBeGreaterThanOrEqual(4)

    const questionHeadings = pool.questions.map(item => item.title)
    expect(questionHeadings.some(title => /meta 标签/.test(title))).toBe(true)
    expect(questionHeadings.some(title => /defer 和 async/.test(title))).toBe(true)
    expect(questionHeadings.some(title => /语义化/.test(title))).toBe(true)

    const withReference = pool.questions.filter(item => item.referenceAnswer)
    expect(withReference.length).toBeGreaterThanOrEqual(3)
  })

  it('默认 5 题组卷时不应 shortfall', () => {
    const pool = buildMaterialQuestionPool(createDocument())
    const result = buildMaterialQuestionGroup(
      pool,
      defaultMaterialGroupCompileOptions(),
      '前端面试.md'
    )

    expect(result.actualCount).toBe(5)
    expect(result.isShortfall).toBe(false)
    expect(result.group.items.every(item => item.referenceAnswer)).toBe(true)
  })

  it('组卷题数跟随 compile count', () => {
    const pool = buildMaterialQuestionPool(createDocument())
    const result = buildMaterialQuestionGroup(pool, {
      count: 3,
      orderMode: 'chapter'
    }, '前端面试.md')

    expect(result.actualCount).toBe(3)
    expect(result.requestedCount).toBe(3)
  })

  it('随机组卷会打乱题目顺序', () => {
    const pool = buildMaterialQuestionPool(createDocument())
    const chapterResult = buildMaterialQuestionGroup(pool, {
      count: pool.questions.length,
      orderMode: 'chapter'
    }, '前端面试.md')
    const randomResult = buildMaterialQuestionGroup(pool, {
      count: pool.questions.length,
      orderMode: 'random',
      shuffleSeed: 20260525
    }, '前端面试.md')

    expect(chapterResult.actualCount).toBe(pool.questions.length)
    expect(randomResult.actualCount).toBe(pool.questions.length)

    const chapterOrder = chapterResult.group.items.map(item => item.questionId).join('|')
    const randomOrder = randomResult.group.items.map(item => item.questionId).join('|')
    expect(randomOrder).not.toBe(chapterOrder)
  })

  it('支持四级标题分块', () => {
    const chunks = splitMaterialChunks(`
#### 什么是闭包？

闭包是函数与其词法环境的组合。

#### 为什么需要闭包？

用于保存状态、延迟执行与工厂模式等场景。
`.trim(), 'doc-closure')

    expect(chunks.length).toBe(2)
    expect(chunks.every(chunk => chunk.level === 4)).toBe(true)
  })

  it('超长章节续篇块不再重复出讲解题', () => {
    const longSectionBody = `${ 'Vue3 响应式依赖收集与触发更新说明。'.repeat(55) }\n\n\`\`\`js\nconst state = reactive({ count: 0 })\n\`\`\``
    const pool = buildMaterialQuestionPool({
      ...createDocument(),
      id: 'doc-long-section',
      rawText: `## 响应式原理\n\n${ longSectionBody }`
    })

    expect(pool.chunks.length).toBeGreaterThan(1)
    expect(pool.chunks.some(chunk => /（续\s*2）/.test(chunk.heading))).toBe(true)

    const explainTitles = pool.questions
      .filter(item => item.title.startsWith('请讲解：'))
      .map(item => item.title)

    expect(explainTitles.some(title => title.includes('响应式原理'))).toBe(true)
    expect(explainTitles.some(title => /（续\s*\d+）/.test(title))).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import {
  extractInterviewFeedbackHint,
  extractLatestInterviewerPrompt
} from '@/services/interview/extract-interview-feedback-hint'

describe('extractInterviewFeedbackHint', () => {
  it('extracts 正确结构 block from corrective feedback', () => {
    const hint = extractInterviewFeedbackHint(`
❌ 回答不完整，存在明显遗漏
✅ **正确结构应包含两部分**:
1. 语义化标签列表：header、nav、main 等
2. 四大核心价值：可读性、SEO、无障碍、可维护性
请补充完整回答
`)

    expect(hint).toContain('语义化标签列表')
    expect(hint).toContain('四大核心价值')
    expect(hint).not.toContain('请补充完整回答')
  })

  it('extracts markdown 修正建议 section', () => {
    const hint = extractInterviewFeedbackHint(`
#### 纠偏反馈
- 回答偏短
#### 修正建议
1. 先概括结论
2. 再分点展开
3. 最后补案例
4. 第四点
5. 第五点
6. 第六点
`)

    expect(hint).toContain('先概括结论')
    expect(hint.split('\n').length).toBeLessThanOrEqual(6)
  })

  it('prefers ❌ diagnostic bullets and limits to five lines', () => {
    const hint = extractInterviewFeedbackHint(`
❌ **概念混淆**：meta 不是语义化标签
❌ **核心标签缺失**：nav、main 未提及
❌ **第二问未作答**：未说明为什么要用语义化
请按下面框架重组回答
1. 列出标签
2. 说明价值
3. 补充 SEO
4. 补充无障碍
`)

    expect(hint).toContain('概念混淆')
    expect(hint).toContain('核心标签缺失')
    expect(hint).not.toContain('列出标签')
    expect(hint.split('\n').filter(Boolean).length).toBeLessThanOrEqual(5)
  })

  it('extracts 请重新回答 line as active follow-up prompt', () => {
    const prompt = extractLatestInterviewerPrompt(`
#### 纠偏提醒
请重新回答：结合实际开发场景，说明 charset 和 viewport 为什么必须写？
`)

    expect(prompt).toContain('charset')
    expect(prompt).toContain('viewport')
  })
})

import { describe, expect, it } from 'vitest'
import {
  buildMaterialTopicTabs,
  filterMaterialQuestionsByTopic,
  inferMaterialQuestionTopicKeys
} from '@/services/material/material-question-topics'
import type { MaterialQuestionItem } from '@/types/material'

const createQuestion = (
  partial: Partial<MaterialQuestionItem> & Pick<MaterialQuestionItem, 'id' | 'title'>
): MaterialQuestionItem => ({
  documentId: 'doc-1',
  chunkId: 'chunk-1',
  order: 0,
  prompt: partial.prompt || partial.title,
  difficulty: 'medium',
  questionType: 'concept',
  generatedBy: 'rule',
  topicKeys: partial.topicKeys,
  sourceHeading: partial.sourceHeading,
  ...partial
})

describe('material-question-topics', () => {
  it('infers browser topic from html headings', () => {
    expect(inferMaterialQuestionTopicKeys({
      title: 'meta 标签有哪些？',
      prompt: '请回答 meta 标签',
      sourceHeading: 'HTML 基础'
    })).toContain('browser')
  })

  it('infers vue3 topic from vue keywords', () => {
    expect(inferMaterialQuestionTopicKeys({
      title: 'Vue3 响应式原理是什么？',
      prompt: '请讲解响应式',
      sourceHeading: 'Vue 核心'
    })).toContain('vue3')
  })

  it('filters questions by topic key', () => {
    const questions = [
      createQuestion({
        id: 'q-1',
        title: 'meta 标签有哪些？',
        topicKeys: ['browser']
      }),
      createQuestion({
        id: 'q-2',
        title: 'Vue3 响应式原理是什么？',
        topicKeys: ['vue3']
      })
    ]

    expect(filterMaterialQuestionsByTopic(questions, ['browser']).map(item => item.id)).toEqual(['q-1'])
  })

  it('buildMaterialTopicTabs counts available topics', () => {
    const tabs = buildMaterialTopicTabs([
      { topicKeys: ['browser'] },
      { topicKeys: ['browser', 'performance'] },
      { topicKeys: ['vue3'] }
    ])

    expect(tabs.find(tab => tab.key === 'browser')?.count).toBe(2)
    expect(tabs.find(tab => tab.key === 'vue3')?.count).toBe(1)
  })
})

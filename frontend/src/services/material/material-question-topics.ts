import type { MaterialQuestionItem } from '@/types/material'
import type { PersistedTopicKey } from '@/types/workbench'

export interface MaterialTopicOption {
  key: PersistedTopicKey
  label: string
}

/** 与资料库预设主题对齐，供组卷筛选 UI 使用 */
export const MATERIAL_TOPIC_OPTIONS: ReadonlyArray<MaterialTopicOption> = [
  { key: 'vue3', label: 'Vue 3' },
  { key: 'typescript', label: 'TypeScript' },
  { key: 'engineering', label: '工程化' },
  { key: 'browser', label: '浏览器' },
  { key: 'performance', label: '性能优化' },
  { key: 'scenario', label: '场景题' }
]

const TOPIC_INFERENCE_RULES: ReadonlyArray<{
  topicKey: PersistedTopicKey
  patterns: RegExp[]
}> = [
  {
    topicKey: 'vue3',
    patterns: [/vue/i, /响应式/, /组合式/, /pinia/i, /虚拟\s*dom/i, /\bdiff\b/i, /组件/]
  },
  {
    topicKey: 'typescript',
    patterns: [/typescript/i, /\bts\b/i, /类型系统/, /泛型/, /\binterface\b/i, /\benum\b/i]
  },
  {
    topicKey: 'engineering',
    patterns: [/webpack/i, /vite/i, /工程化/, /构建/, /打包/, /eslint/i, /\bci\b/i, /monorepo/i, /npm/i]
  },
  {
    topicKey: 'browser',
    patterns: [/浏览器/, /html/i, /\bcss\b/i, /\bdom\b/i, /渲染/, /bfc/i, /语义化/, /\bdefer\b/, /\basync\b/, /meta\s*标签/i]
  },
  {
    topicKey: 'performance',
    patterns: [/性能/, /优化/, /懒加载/, /缓存/, /\bfps\b/i, /\blcp\b/i, /首屏/, /白屏/]
  },
  {
    topicKey: 'scenario',
    patterns: [/场景/, /项目/, /案例/, /沟通/, /架构设计/, /系统设计/, /落地/]
  }
]

const collectInferenceText = (question: Pick<MaterialQuestionItem, 'title' | 'prompt' | 'sourceHeading'>) => (
  [question.title, question.sourceHeading || '', question.prompt].join('\n')
)

/** 从题目标题与章节上下文推断主题，混合资料按题筛选的基础 */
export const inferMaterialQuestionTopicKeys = (
  question: Pick<MaterialQuestionItem, 'title' | 'prompt' | 'sourceHeading'>
): PersistedTopicKey[] => {
  const text = collectInferenceText(question)
  const keys: PersistedTopicKey[] = []

  TOPIC_INFERENCE_RULES.forEach(({ topicKey, patterns }) => {
    if (patterns.some(pattern => pattern.test(text))) {
      keys.push(topicKey)
    }
  })

  return keys.length ? keys : ['scenario']
}

export const matchesMaterialTopicFilter = (
  question: Pick<MaterialQuestionItem, 'topicKeys'>,
  topicFilter?: PersistedTopicKey[]
) => {
  if (!topicFilter?.length) return true
  return question.topicKeys?.some(key => topicFilter.includes(key)) ?? false
}

export const filterMaterialQuestionsByTopic = (
  questions: MaterialQuestionItem[],
  topicFilter?: PersistedTopicKey[]
) => (
  questions.filter(question => matchesMaterialTopicFilter(question, topicFilter))
)

export const buildMaterialTopicTabs = (
  questions: Array<Pick<MaterialQuestionItem, 'topicKeys'>>
) => (
  MATERIAL_TOPIC_OPTIONS
    .map(option => ({
      ...option,
      count: questions.filter(question => question.topicKeys?.includes(option.key)).length
    }))
    .filter(option => option.count > 0)
)

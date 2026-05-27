export type OverviewTopicKey =
  | 'vue3'
  | 'typescript'
  | 'engineering'
  | 'browser'
  | 'performance'
  | 'scenario'

export type GuidanceAction = 'go-mock-interview' | 'go-practice' | 'go-report'

export interface OverviewTopic {
  key: OverviewTopicKey
  label: string
}

export interface LibraryCardItem {
  id: string
  title: string
  meta: string
  desc: string
  accent: string
  topics: OverviewTopicKey[]
  docType: 'md' | 'docx'
}

export interface PracticeQueueItem {
  id: string
  title: string
  progress: number
  note: string
  topicKey: OverviewTopicKey
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount: number
}

export interface GuidanceCardItem {
  id: string
  title: string
  desc: string
  tone: 'primary' | 'neutral'
  action: GuidanceAction
  topicKey?: OverviewTopicKey
}

export interface FlowStepItem {
  id: string
  label: string
  detail: string
  icon: string
}

export interface ReviewSnapshotItem {
  id: string
  title: string
  statusText: string
  score: number
  delta: number
  highlights: string[]
}

export const quickTopics: OverviewTopic[] = [
  { key: 'vue3', label: 'Vue 3' },
  { key: 'typescript', label: 'TypeScript' },
  { key: 'engineering', label: '工程化' },
  { key: 'browser', label: '浏览器' },
  { key: 'performance', label: '性能优化' },
  { key: 'scenario', label: '场景题' }
]

export const libraryCards: LibraryCardItem[] = [
  {
    id: 'library-frontend-notes',
    title: '前端八股总纲.md',
    meta: '128 个知识点 · 已切片',
    desc: '覆盖 Vue、TS、浏览器、工程化和性能优化，适合作为主资料库入口。',
    accent: 'from-[#6aa7ff] to-[#8ed0ff]',
    topics: ['vue3', 'typescript', 'browser', 'performance'],
    docType: 'md'
  },
  {
    id: 'library-project-review',
    title: '项目复盘沉淀.docx',
    meta: '36 个项目问答 · 已解析',
    desc: '偏项目场景与表达组织，适合用于模拟面试中的追问训练。',
    accent: 'from-[#8f7cff] to-[#c7a6ff]',
    topics: ['scenario', 'engineering'],
    docType: 'docx'
  },
  {
    id: 'library-follow-up-questions',
    title: '高频追问清单.md',
    meta: '52 道追问题 · 待补充',
    desc: '用于专项刷题，适合训练“继续追问时怎么答”。',
    accent: 'from-[#57c9a3] to-[#8fe3c9]',
    topics: ['typescript', 'performance', 'scenario'],
    docType: 'md'
  }
]

export const practiceQueue: PracticeQueueItem[] = [
  {
    id: 'queue-vue-reactivity',
    title: 'Vue 响应式原理',
    progress: 82,
    note: '适合继续往源码和调度层深挖',
    topicKey: 'vue3',
    difficulty: 'medium',
    questionCount: 6
  },
  {
    id: 'queue-ts-generics',
    title: 'TypeScript 泛型与约束',
    progress: 61,
    note: '概念能说，场景表达还不够稳',
    topicKey: 'typescript',
    difficulty: 'medium',
    questionCount: 6
  },
  {
    id: 'queue-performance-project',
    title: '性能优化实战',
    progress: 48,
    note: '需要补充量化指标和项目落地点',
    topicKey: 'performance',
    difficulty: 'hard',
    questionCount: 8
  }
]

export const guidanceCards: GuidanceCardItem[] = [
  {
    id: 'guide-start-mock',
    title: '开始一轮模拟面试',
    desc: '基于你当前资料库，生成 10 道前端高频题并逐题追问。',
    tone: 'primary',
    action: 'go-mock-interview'
  },
  {
    id: 'guide-ts-practice',
    title: '针对薄弱点专项刷题',
    desc: '围绕 TypeScript 和性能优化，快速练 6 道题。',
    tone: 'neutral',
    action: 'go-practice',
    topicKey: 'typescript'
  },
  {
    id: 'guide-weekly-report',
    title: '生成本周复盘报告',
    desc: '汇总最近 3 次训练的薄弱点、建议和推荐题单。',
    tone: 'neutral',
    action: 'go-report'
  }
]

export const interviewFlow: FlowStepItem[] = [
  { id: 'flow-import', label: '导入资料', detail: 'md / docx / 文件夹', icon: 'i-lucide-file-up' },
  { id: 'flow-generate', label: 'AI 生成题纲', detail: '按主题与难度定制', icon: 'i-lucide-sparkles' },
  { id: 'flow-follow-up', label: '模拟提问', detail: '逐题追问与引导', icon: 'i-lucide-badge-help' },
  { id: 'flow-report', label: '复盘输出', detail: '弱点报告与完整问卷', icon: 'i-lucide-file-text' }
]

export const reviewSnapshot: ReviewSnapshotItem = {
  id: 'report-latest',
  title: '最近一次模拟面试',
  statusText: '已完成',
  score: 82,
  delta: 9,
  highlights: [
    'Vue 生命周期与组合式 API 表达更流畅',
    'TypeScript 场景题仍有明显卡顿',
    '性能优化回答还缺少量化指标'
  ]
}

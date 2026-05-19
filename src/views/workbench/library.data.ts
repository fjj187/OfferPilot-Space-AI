import type {
  PersistedLibraryDocument,
  PersistedTopicKey
} from '@/types/workbench'

export type LibraryTopicKey = PersistedTopicKey

export interface LibraryStatItem {
  label: string
  value: string
  note: string
  tone?: 'primary' | 'neutral'
}

export interface LibraryFilterTab {
  key: string
  label: string
}

export type LibraryDocument = PersistedLibraryDocument

export const libraryStats: LibraryStatItem[] = [
  {
    label: '总文档数',
    value: '24',
    note: '包含 Markdown 与 Word',
    tone: 'primary'
  },
  {
    label: '已解析文档',
    value: '18',
    note: '可用于训练与问答生成'
  },
  {
    label: '待处理文档',
    value: '06',
    note: '等待进一步切片与摘要'
  }
]

export const filterTabs: LibraryFilterTab[] = [
  {
    key: 'all',
    label: '全部'
  },
  {
    key: 'md',
    label: 'Markdown'
  },
  {
    key: 'docx',
    label: 'Word'
  },
  {
    key: 'vue3',
    label: 'Vue 3'
  },
  {
    key: 'typescript',
    label: 'TypeScript'
  },
  {
    key: 'engineering',
    label: '工程化'
  },
  {
    key: 'browser',
    label: '浏览器'
  },
  {
    key: 'performance',
    label: '性能优化'
  },
  {
    key: 'scenario',
    label: '场景题'
  }
]

export const documentList: LibraryDocument[] = [
  {
    id: 'doc-1',
    name: '前端八股总纲.md',
    type: 'md',
    size: 148 * 1024,
    importedAt: '2026-05-08 21:16',
    summary: '覆盖 Vue、TypeScript、浏览器、工程化与性能优化等高频知识点，适合作为主资料库入口。',
    tags: ['Vue 3', 'TypeScript', '浏览器', '性能优化'],
    status: 'parsed',
    topicKeys: ['vue3', 'typescript', 'browser', 'performance'],
    sourceKey: 'library-frontend-notes',
    recommendedReason: '最适合作为前端主知识库，覆盖范围完整。',
    rawText: '这份文档主要整理了前端高频八股，包括响应式原理、Diff、缓存、事件循环、打包优化等内容。'
  },
  {
    id: 'doc-2',
    name: '项目复盘沉淀.docx',
    type: 'docx',
    size: 86 * 1024,
    importedAt: '2026-05-07 23:44',
    summary: '偏项目场景、表达方式与追问应答，用于模拟面试中的项目问答和深入追问环节。',
    tags: ['场景题', '表达组织', '工程化'],
    status: 'pending',
    topicKeys: ['scenario', 'engineering'],
    sourceKey: 'library-project-review',
    recommendedReason: '适合承接项目追问与场景表达训练。',
    rawText: ''
  },
  {
    id: 'doc-3',
    name: '高频追问清单.md',
    type: 'md',
    size: 42 * 1024,
    importedAt: '2026-05-06 20:12',
    summary: '用于专项刷题和追问训练，帮助你练习“继续追问时怎么答”。',
    tags: ['专项刷题', '追问', 'TypeScript'],
    status: 'parsed',
    topicKeys: ['typescript', 'performance', 'scenario'],
    sourceKey: 'library-follow-up-questions',
    recommendedReason: '最适合承接总览页右侧训练队列与追问链路。',
    rawText: '继续追问时，应优先补足原理、场景、边界和项目实践，不要只停留在概念定义层。'
  }
]

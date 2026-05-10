export type InterviewTopicKey =
  | 'vue3'
  | 'typescript'
  | 'engineering'
  | 'browser'
  | 'performance'
  | 'scenario'

export type InterviewMode = 'standard' | 'guided'

export interface InterviewQuestion {
  id: string
  topic: InterviewTopicKey
  source: string
  docType: 'md' | 'docx'
  stageLabel: string
  title: string
  prompt: string
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  hint: string
  reference: string
  weaknessSignal: string
  followUps: string[]
}

export interface InterviewGuide {
  id: string
  topic: InterviewTopicKey
  title: string
  desc: string
}

export interface TopicOption {
  key: InterviewTopicKey
  label: string
}

export const interviewTopics: TopicOption[] = [
  { key: 'vue3', label: 'Vue 3' },
  { key: 'typescript', label: 'TypeScript' },
  { key: 'engineering', label: '工程化' },
  { key: 'browser', label: '浏览器' },
  { key: 'performance', label: '性能优化' },
  { key: 'scenario', label: '场景题' }
]

export const questionBank: InterviewQuestion[] = [
  {
    id: 'q-vue-composable',
    topic: 'vue3',
    source: 'library-frontend-notes',
    docType: 'md',
    stageLabel: '开场理解题',
    title: '说说你会怎么设计一个可复用的组合式函数',
    prompt: '假设你要把“文档上传 + 面试上下文同步”做成 composable，你会怎样拆分状态、输入参数和副作用？请按设计思路展开。',
    tags: ['组合式 API', '状态拆分', '副作用管理'],
    difficulty: 'medium',
    hint: '先说输入输出，再说内部状态，最后说 watch / 生命周期怎么处理。',
    reference: '前端八股总纲.md',
    weaknessSignal: '组合式 API 的封装边界表达不够稳定',
    followUps: [
      '如果上传成功后还要自动切换当前文档上下文，你会把跳转逻辑放在哪里？',
      '这个 composable 如果以后要接 SSE 状态流，你会提前预留什么字段？'
    ]
  },
  {
    id: 'q-vue-reactivity',
    topic: 'vue3',
    source: 'queue-vue-reactivity',
    docType: 'md',
    stageLabel: '追问深化题',
    title: 'Vue 的响应式为什么能追踪到依赖变化？',
    prompt: '不用讲源码细节到 every line，但请你从“收集依赖、触发更新、调度执行”的角度讲清楚响应式链路。',
    tags: ['响应式原理', '依赖收集', '调度'],
    difficulty: 'hard',
    hint: '把答案分成 track、trigger、scheduler 三段来讲，结构会更稳。',
    reference: '前端八股总纲.md',
    weaknessSignal: '源码原理能讲关键词，但链路顺序容易乱',
    followUps: [
      '为什么有些场景下要配合 computed 或 watch 来减少无效更新？',
      '如果你要向面试官解释 effect 和组件更新的关系，会怎么讲？'
    ]
  },
  {
    id: 'q-ts-generic',
    topic: 'typescript',
    source: 'queue-ts-generics',
    docType: 'md',
    stageLabel: '核心能力题',
    title: '什么时候你会主动设计泛型约束？',
    prompt: '请结合你自己的前端项目说一个真实场景，解释为什么要加 extends 约束，以及不加会有什么问题。',
    tags: ['泛型', '约束', '类型设计'],
    difficulty: 'medium',
    hint: '先给一个业务函数，再讲输入输出约束，最后说 IDE 提示收益。',
    reference: '高频追问清单.md',
    weaknessSignal: '泛型能写，但落到业务场景时例子不够具体',
    followUps: [
      '如果这个泛型要兼容接口返回值兜底，你会怎么设计默认类型？',
      '你会怎么向面试官解释 any、unknown 和泛型的边界差异？'
    ]
  },
  {
    id: 'q-engineering-build',
    topic: 'engineering',
    source: 'library-project-review',
    docType: 'docx',
    stageLabel: '项目表达题',
    title: '你是怎么判断一个前端项目需要做工程化优化的？',
    prompt: '请结合一次实际项目经历，从构建速度、协作成本、规范约束和发布质量四个方向来讲。',
    tags: ['工程化', '构建', '团队协作'],
    difficulty: 'medium',
    hint: '用“问题 - 方案 - 结果”结构会比堆工具名更像真实项目表达。',
    reference: '项目复盘沉淀.docx',
    weaknessSignal: '工程化回答里结果量化指标还不够',
    followUps: [
      '如果团队成员对规范工具排斥，你会怎么推动落地？',
      'CI/CD 改造时，你会优先监控哪两个风险点？'
    ]
  },
  {
    id: 'q-browser-cache',
    topic: 'browser',
    source: 'library-frontend-notes',
    docType: 'md',
    stageLabel: '基础追问题',
    title: '强缓存和协商缓存你怎么讲才不容易乱？',
    prompt: '请按浏览器请求发出前、服务端响应后、再次访问时的顺序，把整个缓存判断链条讲清楚。',
    tags: ['浏览器缓存', 'HTTP', '性能'],
    difficulty: 'easy',
    hint: '时间线比概念堆砌更重要，先说 from memory / disk，再说协商。',
    reference: '前端八股总纲.md',
    weaknessSignal: '缓存概念知道，但时间线表达不够利落',
    followUps: [
      '如果资源是 hash 文件名，缓存策略你会怎么配？',
      '面试官继续问 CDN 缓存和浏览器缓存的关系，你会怎么衔接？'
    ]
  },
  {
    id: 'q-performance-metrics',
    topic: 'performance',
    source: 'queue-performance-project',
    docType: 'md',
    stageLabel: '结果量化题',
    title: '性能优化为什么一定要带量化指标？',
    prompt: '请你从“发现问题、选择指标、执行优化、验证效果”四步回答，并举一个真实例子。',
    tags: ['性能优化', '指标', '验证'],
    difficulty: 'hard',
    hint: '至少给出一个核心指标，例如 LCP、FCP 或白屏时间，答案会更扎实。',
    reference: '高频追问清单.md',
    weaknessSignal: '优化动作能说，指标和结果验证偏弱',
    followUps: [
      '如果你没有真实监控平台，怎么先做低成本验证？',
      '为什么只说“加载更快了”在面试里说服力不够？'
    ]
  },
  {
    id: 'q-scenario-pressure',
    topic: 'scenario',
    source: 'library-project-review',
    docType: 'docx',
    stageLabel: '场景表达题',
    title: '如果面试官连续追问你没做过的内容，你会怎么稳住回答？',
    prompt: '请从承认边界、迁移相近经验、提出验证思路三个步骤来回答。',
    tags: ['场景题', '表达策略', '追问应对'],
    difficulty: 'medium',
    hint: '这题重点不是“硬答”，而是让面试官看到你的判断和沟通能力。',
    reference: '项目复盘沉淀.docx',
    weaknessSignal: '高压追问时答案容易从结构化变成碎片化',
    followUps: [
      '如果面试官继续质疑你的方案不够完整，你下一句会怎么接？',
      '你会怎样把“不会”回答得既诚实又不失分？'
    ]
  }
]

export const interviewGuides: InterviewGuide[] = [
  {
    id: 'guide-answer-structure',
    topic: 'vue3',
    title: '先搭结构，再补细节',
    desc: '这一类题先给三段式回答框架，能明显减少卡顿。'
  },
  {
    id: 'guide-typescript-scene',
    topic: 'typescript',
    title: '多给业务场景，不要只背语法',
    desc: '面试官更在意你如何把类型设计落到真实项目里。'
  },
  {
    id: 'guide-engineering-metric',
    topic: 'engineering',
    title: '工程化题一定要讲收益',
    desc: '别只列工具名，强调构建时间、协作效率和错误率变化。'
  },
  {
    id: 'guide-browser-timeline',
    topic: 'browser',
    title: '浏览器题按时间线讲',
    desc: '从请求前、请求中、响应后讲，比概念堆砌更清楚。'
  },
  {
    id: 'guide-performance-metric',
    topic: 'performance',
    title: '性能题优先说指标和验证',
    desc: '不只说做了什么，还要说你如何证明它真的变好了。'
  },
  {
    id: 'guide-scenario-calm',
    topic: 'scenario',
    title: '场景题先稳住边界',
    desc: '先承认条件，再迁移经验，最后给验证方案，会更从容。'
  }
]

export const modeLabelMap: Record<InterviewMode, string> = {
  standard: '标准模拟',
  guided: '引导模式'
}

export const difficultyLabelMap: Record<InterviewQuestion['difficulty'], string> = {
  easy: '基础',
  medium: '进阶',
  hard: '高阶'
}

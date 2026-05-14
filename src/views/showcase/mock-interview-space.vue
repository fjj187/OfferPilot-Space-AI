<script lang="tsx" setup>
import type { CSSProperties } from 'vue'
import gsap from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import MessageList from '@/components/message/MessageList.vue'
import AnswerInputPanel from '@/components/mock-interview/AnswerInputPanel.vue'
import { useInterviewStream } from '@/composables/useInterviewStream'
import {
  difficultyLabelMap,
  interviewGuides,
  interviewTopics,
  modeLabelMap as interviewModeLabelMap,
  questionBank
} from '@/views/workbench/mock-interview.data'

interface SceneTheme {
  line: string
  dot: string
  activeDot: string
  primary: string
  secondary: string
  planet: string
  planetGlow: string
  planetShadow: string
  atmosphere: string
  ring: string
}

interface SceneItem {
  id: string
  navLabel: string
  eyebrow: string
  title: string
  summary: string
  bullets: string[]
  sectionTitle: string
  sectionBody: string
  theme: SceneTheme
  shellBackground: string
  glowA: string
  glowB: string
  nebula: string
  planetSize: string
  planetRight: string
  planetBottom: string
}

interface VisualSlot {
  x: number
  y: number
  scale: number
  opacity: number
  blur: number
  rotate: number
  zIndex: number
}

interface VisualLayerState {
  x: number
  y: number
  scale: number
  opacity: number
  blur: number
  rotate: number
  zIndex: number
}

interface OrbitSlot {
  left: number
  top: number
  visible: boolean
}

gsap.registerPlugin(MotionPathPlugin)

const scenes: SceneItem[] = [
  {
    id: 'overview',
    navLabel: '总览',
    eyebrow: 'Interview constellation',
    title: '面试总览',
    summary: '把复杂的模拟面试流程压缩成一个更沉浸、更纯粹的宇宙式首页，先看到目标，再进入作答。',
    bullets: [
      '只保留当前任务、进度、下一步动作',
      '减少白卡片和多层滚动，强化沉浸感'
    ],
    sectionTitle: '总览段落',
    sectionBody: '这里展示这次 mock interview 的主题、阶段、候选能力重点与当前状态，作为宇宙首页的第一屏以下内容。',
    theme: {
      line: 'rgba(205, 227, 255, 0.24)',
      dot: 'rgba(255, 255, 255, 0.82)',
      activeDot: '#76f7ea',
      primary: '#76f7ea',
      secondary: '#e8f7ff',
      planet: 'radial-gradient(circle at 32% 28%, #a8fffd 0%, #48d7cf 22%, #12496d 48%, #091322 76%, #050913 100%)',
      planetGlow: 'rgba(118, 247, 234, 0.34)',
      planetShadow: 'rgba(2, 5, 14, 0.9)',
      atmosphere: 'rgba(132, 255, 246, 0.55)',
      ring: 'rgba(118, 247, 234, 0.2)'
    },
    shellBackground: 'linear-gradient(124deg, #091326 0%, #0b1730 34%, #122847 64%, #070c15 100%)',
    glowA: 'radial-gradient(circle at 6% 8%, rgba(88, 239, 226, 0.42) 0%, rgba(88, 239, 226, 0) 38%)',
    glowB: 'radial-gradient(circle at 82% 14%, rgba(120, 166, 255, 0.24) 0%, rgba(120, 166, 255, 0) 32%)',
    nebula: 'linear-gradient(118deg, rgba(17, 33, 57, 0.84) 0%, rgba(7, 11, 23, 0.28) 42%, rgba(2, 4, 9, 0.72) 100%)',
    planetSize: '36vw',
    planetRight: '-7vw',
    planetBottom: '-11vh'
  },
  {
    id: 'mock',
    navLabel: '资料库',
    eyebrow: 'Source intake',
    title: '资料库',
    summary: '资料入口先保留在这条宇宙轨道里，用更轻的方式承接当前训练所依赖的文档来源。',
    bullets: [
      '集中承接当前训练主题下的核心资料',
      '导入、查看、确认来源都在这条链路里完成'
    ],
    sectionTitle: '资料承接区',
    sectionBody: '这里承接当前训练所依赖的资料来源、导入入口和最近使用文档，不再把资料动作甩到旧页面。',
    theme: {
      line: 'rgba(224, 225, 255, 0.24)',
      dot: 'rgba(255, 255, 255, 0.84)',
      activeDot: '#c6ceff',
      primary: '#c6ceff',
      secondary: '#f3f0ff',
      planet: 'radial-gradient(circle at 40% 30%, #f1f1ff 0%, #b6bbdc 22%, #6a5b96 48%, #241835 74%, #09070d 100%)',
      planetGlow: 'rgba(183, 190, 255, 0.32)',
      planetShadow: 'rgba(5, 4, 12, 0.9)',
      atmosphere: 'rgba(205, 212, 255, 0.5)',
      ring: 'rgba(194, 203, 255, 0.18)'
    },
    shellBackground: 'linear-gradient(126deg, #120d24 0%, #261545 42%, #42254e 72%, #09070c 100%)',
    glowA: 'radial-gradient(circle at 4% 6%, rgba(103, 121, 255, 0.42) 0%, rgba(103, 121, 255, 0) 34%)',
    glowB: 'radial-gradient(circle at 78% 18%, rgba(255, 205, 142, 0.18) 0%, rgba(255, 205, 142, 0) 28%)',
    nebula: 'linear-gradient(112deg, rgba(42, 24, 70, 0.86) 0%, rgba(61, 19, 65, 0.44) 42%, rgba(7, 6, 10, 0.72) 100%)',
    planetSize: '33vw',
    planetRight: '-5vw',
    planetBottom: '-7vh'
  },
  {
    id: 'strategy',
    navLabel: '模拟面试',
    eyebrow: 'Live exchange',
    title: '模拟面试',
    summary: '主问题、追问、回答输入和提示应该被收拢成一个强主任务区，而不是很多独立卡片。',
    bullets: [
      '问题区域成为页面主轴',
      '输入与反馈关系更直接'
    ],
    sectionTitle: '模拟面试段落',
    sectionBody: '这里会放大问题与回答流，保留最核心的对话体验，减少侧边信息对注意力的干扰。',
    theme: {
      line: 'rgba(255, 230, 230, 0.22)',
      dot: 'rgba(255, 255, 255, 0.88)',
      activeDot: '#ffffff',
      primary: '#ffffff',
      secondary: '#ffe9dc',
      planet: 'radial-gradient(circle at 32% 26%, #f3c890 0%, #a96b3d 21%, #59341f 44%, #20130f 66%, #090606 100%)',
      planetGlow: 'rgba(255, 159, 70, 0.3)',
      planetShadow: 'rgba(12, 4, 0, 0.86)',
      atmosphere: 'rgba(255, 197, 120, 0.28)',
      ring: 'rgba(255, 255, 255, 0.16)'
    },
    shellBackground: 'linear-gradient(128deg, #8d0718 0%, #b51a20 30%, #c94912 62%, #d97c16 100%)',
    glowA: 'radial-gradient(circle at 6% 4%, rgba(94, 255, 235, 0.44) 0%, rgba(94, 255, 235, 0.08) 18%, rgba(94, 255, 235, 0) 34%)',
    glowB: 'radial-gradient(circle at 82% 72%, rgba(34, 168, 150, 0.18) 0%, rgba(34, 168, 150, 0.08) 16%, rgba(34, 168, 150, 0) 34%)',
    nebula: 'radial-gradient(circle at 74% 62%, rgba(89, 121, 132, 0.12) 0%, rgba(89, 121, 132, 0.06) 16%, rgba(89, 121, 132, 0) 34%), linear-gradient(118deg, rgba(145, 12, 34, 0.56) 0%, rgba(181, 44, 20, 0.32) 44%, rgba(223, 123, 18, 0.18) 100%)',
    planetSize: '40vw',
    planetRight: '-10vw',
    planetBottom: '-18vh'
  },
  {
    id: 'feedback',
    navLabel: '专项刷题',
    eyebrow: 'Focused drills',
    title: '专项刷题',
    summary: '专项刷题承接弱项收敛，不再作为旁支小入口，而是主训练链路中的定向强化阶段。',
    bullets: [
      '围绕薄弱点收敛题目范围',
      '用更短的链路完成定向补练'
    ],
    sectionTitle: '专项刷题区',
    sectionBody: '这里承接当前弱项标签下的训练队列、题量和难度，不再和总览首屏同时争抢注意力。',
    theme: {
      line: 'rgba(212, 247, 255, 0.25)',
      dot: 'rgba(255, 255, 255, 0.82)',
      activeDot: '#baf5ff',
      primary: '#baf5ff',
      secondary: '#e7fbff',
      planet: 'radial-gradient(circle at 38% 28%, #f6ffff 0%, #79cdf6 18%, #15567f 42%, #0b223b 66%, #050911 100%)',
      planetGlow: 'rgba(100, 208, 255, 0.3)',
      planetShadow: 'rgba(1, 6, 15, 0.9)',
      atmosphere: 'rgba(164, 233, 255, 0.56)',
      ring: 'rgba(140, 227, 255, 0.17)'
    },
    shellBackground: 'linear-gradient(126deg, #04121c 0%, #0a2331 38%, #13445c 70%, #092030 100%)',
    glowA: 'radial-gradient(circle at 14% 10%, rgba(100, 224, 255, 0.44) 0%, rgba(100, 224, 255, 0) 33%)',
    glowB: 'radial-gradient(circle at 82% 18%, rgba(111, 255, 220, 0.16) 0%, rgba(111, 255, 220, 0) 28%)',
    nebula: 'linear-gradient(120deg, rgba(7, 24, 39, 0.54) 0%, rgba(16, 54, 76, 0.35) 42%, rgba(4, 10, 17, 0.72) 100%)',
    planetSize: '38vw',
    planetRight: '-8vw',
    planetBottom: '-14vh'
  },
  {
    id: 'report',
    navLabel: '复盘报告 / 训练历史',
    eyebrow: 'Mission archive',
    title: '复盘报告 / 训练历史',
    summary: '复盘报告与训练历史先合并承接，统一展示最近结果、历史 session 和下一轮训练依据。',
    bullets: [
      '强调最近结果与薄弱点总结',
      '从历史记录里回看之前的训练轨迹'
    ],
    sectionTitle: '复盘报告与训练历史',
    sectionBody: '这里承接最近一轮训练完成后的摘要、弱项标签与历史记录，用一个节点统一收束而不增加轨道复杂度。',
    theme: {
      line: 'rgba(221, 222, 255, 0.22)',
      dot: 'rgba(255, 255, 255, 0.82)',
      activeDot: '#7ff8dc',
      primary: '#7ff8dc',
      secondary: '#f0ecff',
      planet: 'radial-gradient(circle at 38% 30%, #d2c8ff 0%, #8672ff 22%, #3c2f8f 50%, #1b1843 72%, #080814 100%)',
      planetGlow: 'rgba(126, 113, 255, 0.34)',
      planetShadow: 'rgba(3, 3, 12, 0.9)',
      atmosphere: 'rgba(168, 158, 255, 0.54)',
      ring: 'rgba(152, 140, 255, 0.18)'
    },
    shellBackground: 'linear-gradient(126deg, #170f3b 0%, #2c1f72 40%, #352d87 69%, #120f2d 100%)',
    glowA: 'radial-gradient(circle at 2% 8%, rgba(124, 249, 219, 0.4) 0%, rgba(124, 249, 219, 0) 34%)',
    glowB: 'radial-gradient(circle at 80% 12%, rgba(180, 108, 255, 0.18) 0%, rgba(180, 108, 255, 0) 30%)',
    nebula: 'linear-gradient(114deg, rgba(43, 29, 103, 0.5) 0%, rgba(35, 26, 85, 0.44) 38%, rgba(7, 8, 17, 0.72) 100%)',
    planetSize: '34vw',
    planetRight: '-5vw',
    planetBottom: '-8vh'
  }
]

const {
  messages: mockMessages,
  isStreaming: isMockStreaming,
  streamError: mockStreamError,
  scrollVersion: mockScrollVersion,
  appendUserMessage: appendMockUserMessage,
  appendAssistantMessage: appendMockAssistantMessage,
  appendSystemMessage: appendMockSystemMessage,
  startStream: startMockStream,
  stopStream: stopMockStream,
  clearMessages: clearMockMessages
} = useInterviewStream()

const topicLabelMap = interviewTopics.reduce<Record<string, string>>((map, item) => {
  map[item.key] = item.label
  return map
}, {})

const activeTopicKey = computed(() => questionBank[0]?.topic || interviewTopics[0]?.key || 'vue3')
const activeMode = ref<'standard' | 'stress' | 'guided'>('standard')
const topicQuestions = computed(() => questionBank.filter(item => item.topic === activeTopicKey.value))
const primaryQuestion = computed(() => topicQuestions.value[0] || null)
const currentGuide = computed(() => {
  return interviewGuides.find(item => item.topic === activeTopicKey.value) || interviewGuides[0]
})
const mockAnswerDraft = ref('')
const mockFollowUpIndex = ref(0)
const mockSubmittedQuestionIds = ref<string[]>([])
const mockWeaknessSignals = ref<string[]>([])

const mockPanelMeta = computed(() => {
  const question = primaryQuestion.value
  if (!question) return []
  return [
    `阶段: ${question.stageLabel}`,
    `难度: ${difficultyLabelMap[question.difficulty]}`,
    `模式: ${interviewModeLabelMap[activeMode.value] || '标准模拟'}`,
    `题源: ${question.reference}`
  ]
})

const mockPanelFollowUps = computed(() => primaryQuestion.value?.followUps?.slice(0, 2) || [])

const currentMockFollowUp = computed(() => {
  const followUps = primaryQuestion.value?.followUps || []
  if (!followUps.length) return ''
  return followUps[mockFollowUpIndex.value] || followUps[0] || ''
})

const isMockCurrentSubmitted = computed(() => {
  const question = primaryQuestion.value
  return !!question && mockSubmittedQuestionIds.value.includes(question.id)
})

const mockDialogueCount = computed(() => mockMessages.value.filter(item => item.role !== 'system').length)

const mockPanelWeakness = computed(() => {
  const fallback = primaryQuestion.value?.weaknessSignal || '当前还没有形成稳定弱项信号。'
  return mockWeaknessSignals.value.length ? mockWeaknessSignals.value.slice(0, 3) : [fallback]
})

const overviewModeLabel = computed(() => interviewModeLabelMap[activeMode.value] || '标准模拟')
const overviewSourceLabel = computed(() => primaryQuestion.value?.reference || '前端八股总纲')
const overviewProgressTotal = computed(() => Math.max(topicQuestions.value.length, 1))
const overviewProgressAnswered = computed(() => Math.min(mockSubmittedQuestionIds.value.length, overviewProgressTotal.value))
const overviewProgressPercent = computed(() => Math.round((overviewProgressAnswered.value / overviewProgressTotal.value) * 100))
const overviewPrimaryActionLabel = computed(() => mockSubmittedQuestionIds.value.length ? '继续面试' : '开始本轮模拟')
const overviewStatusLabel = computed(() => {
  return mockSubmittedQuestionIds.value.length
    ? `当前已答 ${overviewProgressAnswered.value} / ${overviewProgressTotal.value} 题`
    : '当前还没有未完成 session，可直接开始本轮模拟'
})
const overviewSummaryItems = computed(() => ([
  {
    label: '当前模式',
    value: overviewModeLabel.value,
    note: '当前演示会承接 mock 面试模式'
  },
  {
    label: '资料来源',
    value: overviewSourceLabel.value,
    note: '总览页只保留一个最核心来源'
  },
  {
    label: '最近弱项',
    value: mockPanelWeakness.value[0] || '暂无信号',
    note: mockPanelWeakness.value.slice(1, 2)[0] || '继续训练后会逐步收敛'
  }
]))

const initializeMockConversation = () => {
  clearMockMessages()
  const question = primaryQuestion.value
  if (!question) return
  appendMockSystemMessage(`已切换到当前 mock 题目，模式：${interviewModeLabelMap[activeMode.value] || '标准模拟'}。`)
  appendMockAssistantMessage(
    [
      '### 当前主问题',
      `**${question.title}**`,
      '',
      question.prompt
    ].join('\n'),
    'markdown'
  )
}

const submitMockAnswer = () => {
  const question = primaryQuestion.value
  const answer = mockAnswerDraft.value.trim()
  if (!question || !answer || isMockStreaming.value) return

  if (!mockSubmittedQuestionIds.value.includes(question.id)) {
    mockSubmittedQuestionIds.value = [...mockSubmittedQuestionIds.value, question.id]
  }

  if (answer.length < 60) {
    mockWeaknessSignals.value = [...new Set(['回答偏短，可继续补结构、案例和结果。', ...mockWeaknessSignals.value])]
  }
  else {
    mockWeaknessSignals.value = [...new Set([question.weaknessSignal, ...mockWeaknessSignals.value])]
  }

  appendMockUserMessage(answer)
  startMockStream({
    prompt: `${question.title}\n${answer}`,
    topicLabel: topicLabelMap[activeTopicKey.value] || 'Vue 3',
    questionTitle: question.title,
    questionPrompt: question.prompt,
    answer,
    format: 'markdown'
  })
  mockAnswerDraft.value = ''
}

const clearMockAnswer = () => {
  if (isMockStreaming.value) return
  mockAnswerDraft.value = ''
}

const rotateMockFollowUp = () => {
  const followUps = primaryQuestion.value?.followUps || []
  if (!followUps.length) return
  mockFollowUpIndex.value = (mockFollowUpIndex.value + 1) % followUps.length
  if (currentMockFollowUp.value) {
    appendMockSystemMessage(`当前推荐追问：${currentMockFollowUp.value}`)
  }
}

watch(
  () => primaryQuestion.value?.id,
  () => {
    mockAnswerDraft.value = ''
    mockFollowUpIndex.value = 0
    mockSubmittedQuestionIds.value = []
    mockWeaknessSignals.value = []
    initializeMockConversation()
  },
  { immediate: true }
)

const transitionMs = 420
const cycleDurationMs = 6200
const centerSlot = 2
const orbitMotionTransition = `left ${transitionMs}ms cubic-bezier(0.2, 0.9, 0.24, 1.02), top ${transitionMs}ms cubic-bezier(0.2, 0.9, 0.24, 1.02), opacity 0.3s ease`

const orbitSlots = ref<OrbitSlot[]>([
  { left: 20.4, top: 53.8, visible: true },
  { left: 36.8, top: 69.2, visible: true },
  { left: 50.0, top: 74.1, visible: true },
  { left: 64.9, top: 70.0, visible: true },
  { left: 81.2, top: 56.1, visible: true }
])
const offscreenOrbitLeft = { left: -18, top: 47 }
const offscreenOrbitRight = { left: 118, top: 48 }

const visualSlots: VisualSlot[] = [
  { x: -0.52, y: -0.32, scale: 1, opacity: 0.84, blur: 6, rotate: 0, zIndex: 3 },
  { x: -0.88, y: 0.34, scale: 1, opacity: 0.9, blur: 6, rotate: 0, zIndex: 3 },
  { x: 0.18, y: -0.26, scale: 1, opacity: 1, blur: 0, rotate: 0, zIndex: 6 },
  { x: 0.04, y: 0.16, scale: 1, opacity: 0.82, blur: 7, rotate: 0, zIndex: 2 },
  { x: 0.66, y: 0.32, scale: 1, opacity: 0.86, blur: 8, rotate: 0, zIndex: 2 }
]

const router = useRouter()
const orbitOrder = ref([3, 4, 0, 1, 2])
const activeIndex = ref(orbitOrder.value[centerSlot])
const displayIndex = ref(orbitOrder.value[centerSlot])
const copySceneIndex = ref(orbitOrder.value[centerSlot])
const orbitProgress = ref(0)
const autoplay = ref(true)
const isOrbitTransitioning = ref(false)
const pendingTargetIndex = ref<number | null>(null)
let progressTimer: ReturnType<typeof setInterval> | null = null
let scrollDelayTimer: ReturnType<typeof setTimeout> | null = null
let scrollAnimationFrame: number | null = null
let orbitSettleTimer: ReturnType<typeof setTimeout> | null = null
let copyRevealTimer: ReturnType<typeof setTimeout> | null = null
const pageRef = ref<HTMLElement | null>(null)
const visualColumnRef = ref<HTMLElement | null>(null)
const contentSectionRef = ref<HTMLElement | null>(null)
const contentPanelRef = ref<HTMLElement | null>(null)
const contentLeadRef = ref<HTMLElement | null>(null)
const isPanelTransitioning = ref(false)
const isAutoScrolling = ref(false)
const isFastOrbitTransition = ref(false)
const orbitOverrides = ref<Record<number, CSSProperties>>({})
const orbitGhosts = ref<Array<{
  label: string
  style: CSSProperties
}>>([])
const visualLayerRefs = ref<Array<HTMLElement | null>>(Array.from({ length: scenes.length }, () => null))
const planetShellRefs = ref<Array<HTMLElement | null>>(Array.from({ length: scenes.length }, () => null))
const visualLayerStates = ref<Array<VisualLayerState | null>>(Array.from({ length: scenes.length }, () => null))
const lastOrbitDirection = ref<1 | -1>(1)
const headerRef = ref<HTMLElement | null>(null)
const headerFade = ref(0)
const activeScene = computed(() => scenes[activeIndex.value])
const displayScene = computed(() => scenes[displayIndex.value])
const copyScene = computed(() => scenes[copySceneIndex.value])
const activeSceneIndexBySlot = computed(() => orbitOrder.value[centerSlot])
const orderedSceneIndexes = computed(() => orbitOrder.value)
const isCopyVisible = ref(true)

const sceneShellStyle = computed<CSSProperties>(() => ({
  background: activeScene.value.shellBackground,
  '--scene-line': activeScene.value.theme.line,
  '--scene-primary': activeScene.value.theme.primary,
  '--scene-secondary': activeScene.value.theme.secondary,
  '--scene-dot': activeScene.value.theme.dot,
  '--scene-dot-active': activeScene.value.theme.activeDot
} as CSSProperties))

const headerStyle = computed<CSSProperties>(() => {
  const fade = headerFade.value
  const blurActive = fade < 0.02
  return {
    opacity: String(1 - fade),
    transform: `translateY(${fade * -14}px)`,
    pointerEvents: fade > 0.98 ? 'none' : 'auto',
    backdropFilter: blurActive ? 'blur(14px)' : 'none',
    WebkitBackdropFilter: blurActive ? 'blur(14px)' : 'none',
    '--header-mask-opacity': String(1 - fade),
    '--header-border-opacity': String(0.08 * (1 - fade)),
    '--header-bg-opacity': String(Math.max(0, 0.92 - fade * 0.92))
  } as CSSProperties
})

const contentRevealTarget = computed(() => {
  const host = pageRef.value
  const target = contentLeadRef.value ?? contentPanelRef.value ?? contentSectionRef.value
  if (!host || !target) return 0
  const hostRect = host.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()
  return Math.max(host.scrollTop + (targetRect.top - hostRect.top), 0)
})

const glowAStyle = computed<CSSProperties>(() => ({
  background: activeScene.value.glowA
}))

const glowBStyle = computed<CSSProperties>(() => ({
  background: activeScene.value.glowB
}))

const nebulaStyle = computed<CSSProperties>(() => ({
  background: activeScene.value.nebula
}))

const planetVars = computed<CSSProperties>(() => ({
  '--planet-atmosphere': activeScene.value.theme.atmosphere,
  '--planet-ring': activeScene.value.theme.ring
} as CSSProperties))

const planetStyle = computed<CSSProperties>(() => ({
  width: `min(${activeScene.value.planetSize}, 720px)`,
  height: `min(${activeScene.value.planetSize}, 720px)`,
  right: activeScene.value.planetRight,
  bottom: activeScene.value.planetBottom,
  background: activeScene.value.theme.planet,
  boxShadow: `0 0 80px ${activeScene.value.theme.planetGlow}, inset -80px -80px 140px ${activeScene.value.theme.planetShadow}`
}))

const planetVarsFor = (scene: SceneItem): CSSProperties => ({
  '--planet-atmosphere': scene.theme.atmosphere,
  '--planet-ring': scene.theme.ring
} as CSSProperties)

const planetStyleFor = (scene: SceneItem, sceneIndex: number): CSSProperties => {
  const slotIndex = orderedSceneIndexes.value.indexOf(sceneIndex)
  const isHeroPlanet = slotIndex === centerSlot
  const isLowerRightPlanet = slotIndex === 4
  const size = 'min(18vw, 360px)'

  return {
    width: size,
    height: size,
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    background: scene.theme.planet,
    '--planet-shadow-strength': isLowerRightPlanet ? '0.36' : '1',
    '--planet-shadow-mid-strength': isLowerRightPlanet ? '0.08' : '0.12',
    boxShadow: isHeroPlanet
      ? `0 0 56px ${scene.theme.planetGlow}, inset -44px -44px 72px ${scene.theme.planetShadow}`
      : isLowerRightPlanet
          ? `0 0 28px ${scene.theme.planetGlow}, inset -16px -16px 28px ${scene.theme.planetShadow}`
          : `0 0 36px ${scene.theme.planetGlow}, inset -32px -32px 56px ${scene.theme.planetShadow}`,
    opacity: '1'
  }
}

const sceneLayerClass = (sceneIndex: number) => ({
  'is-active': sceneIndex === activeIndex.value,
  'is-trailing': sceneIndex !== activeIndex.value
})

const orbitClass = (index: number) => ({
  'is-active': !isFastOrbitTransition.value && index === activeIndex.value,
  'is-center-node': index === activeSceneIndexBySlot.value
})

const setVisualLayerRef = (element: Element | null, index: number) => {
  visualLayerRefs.value[index] = element instanceof HTMLElement ? element : null
}

const setPlanetShellRef = (element: Element | null, index: number) => {
  planetShellRefs.value[index] = element instanceof HTMLElement ? element : null
}

const resolveVisualLayerState = (sceneIndex: number): VisualLayerState => {
  const host = visualColumnRef.value
  const slotIndex = orderedSceneIndexes.value.indexOf(sceneIndex)
  const slot = visualSlots[Math.max(slotIndex, 0)]
  const width = host?.clientWidth ?? 960
  const height = host?.clientHeight ?? 560

  return {
    x: slot.x * width,
    y: slot.y * height,
    scale: slot.scale,
    opacity: slot.opacity,
    blur: slot.blur,
    rotate: slot.rotate,
    zIndex: slot.zIndex
  }
}

const applyVisualLayerState = (sceneIndex: number, state: VisualLayerState) => {
  const layer = visualLayerRefs.value[sceneIndex]
  const shell = planetShellRefs.value[sceneIndex]
  if (!layer) return
  layer.style.zIndex = String(state.zIndex)
  gsap.set(layer, {
    x: state.x,
    y: state.y,
    scale: state.scale,
    rotation: state.rotate,
    opacity: state.opacity
  })
  if (shell) {
    gsap.set(shell, {
      filter: `blur(${state.blur}px)`
    })
  }
  visualLayerStates.value[sceneIndex] = state
}

const animateVisualLayerState = (sceneIndex: number, direction: 1 | -1, immediate = false) => {
  const layer = visualLayerRefs.value[sceneIndex]
  const shell = planetShellRefs.value[sceneIndex]
  if (!layer) return

  const target = resolveVisualLayerState(sceneIndex)
  const previous = visualLayerStates.value[sceneIndex] ?? target
  const travel = target.x - previous.x
  const verticalLift = (sceneIndex === activeSceneIndexBySlot.value ? -88 : -42) + Math.abs(target.rotate) * -0.6
  const control = {
    x: previous.x + travel * 0.45,
    y: Math.min(previous.y, target.y) + verticalLift,
    scale: Math.max(previous.scale, target.scale) + 0.05
  }

  gsap.killTweensOf(layer)
  if (shell) {
    gsap.killTweensOf(shell)
  }
  layer.style.zIndex = String(Math.max(previous.zIndex, target.zIndex))

  if (immediate) {
    applyVisualLayerState(sceneIndex, target)
    return
  }

  const motionDuration = Math.max(transitionMs / 1000, 0.42)
  const blurDelay = motionDuration * 0.18
  const blurDuration = motionDuration * 0.76
  const timeline = gsap.timeline({
    defaults: {
      ease: 'power3.inOut'
    },
    onComplete: () => {
      layer.style.zIndex = String(target.zIndex)
    }
  })

  timeline.to(layer, {
    duration: motionDuration,
    motionPath: {
      path: [
        { x: previous.x, y: previous.y },
        {
          x: control.x + direction * 26,
          y: control.y
        },
        { x: target.x, y: target.y }
      ],
      curviness: 1.25
    },
    scale: target.scale,
    rotation: target.rotate,
    opacity: target.opacity
  }, 0)

  if (shell) {
    timeline.to(shell, {
      duration: blurDuration,
      filter: `blur(${target.blur}px)`
    }, blurDelay)
  }

  visualLayerStates.value[sceneIndex] = target
}

const syncVisualLayers = (immediate = false) => {
  scenes.forEach((_, sceneIndex) => {
    animateVisualLayerState(sceneIndex, lastOrbitDirection.value, immediate)
  })
}

const resolveOrbitTop = (slotIndex: number, top: number) => {
  if (slotIndex === 0 || slotIndex === orbitSlots.value.length - 1) {
    return `calc(${top}% + 10px)`
  }
  return `${top}%`
}

const orbitStopStyle = (index: number): CSSProperties => {
  const override = orbitOverrides.value[index]
  if (override) {
    const slotIndex = orbitOrder.value.indexOf(index)
    return {
      ...override,
      zIndex: String(slotIndex >= centerSlot ? 12 - slotIndex : 6 - slotIndex)
    }
  }
  const slotIndex = orbitOrder.value.indexOf(index)
  const slot = orbitSlots.value[slotIndex]
  if (!slot) {
    return { left: '50%', top: '82%', opacity: '0' }
  }
  return {
    left: `${slot.left}%`,
    top: resolveOrbitTop(slotIndex, slot.top),
    opacity: slot.visible ? '1' : '0',
    zIndex: String(slotIndex >= centerSlot ? 12 - slotIndex : 6 - slotIndex)
  }
}

const clearAutoplay = () => {
  if (progressTimer) {
    window.clearInterval(progressTimer)
    progressTimer = null
  }
}

const clearTransitionTimers = () => {
  if (scrollDelayTimer) {
    window.clearTimeout(scrollDelayTimer)
    scrollDelayTimer = null
  }
  if (scrollAnimationFrame !== null) {
    window.cancelAnimationFrame(scrollAnimationFrame)
    scrollAnimationFrame = null
  }
  if (orbitSettleTimer) {
    window.clearTimeout(orbitSettleTimer)
    orbitSettleTimer = null
  }
  if (copyRevealTimer) {
    window.clearTimeout(copyRevealTimer)
    copyRevealTimer = null
  }
  orbitGhosts.value = []
  orbitOverrides.value = {}
}

const pauseAutoplay = () => {
  autoplay.value = false
  orbitProgress.value = 0
  clearAutoplay()
}

const startAutoplay = () => {
  clearAutoplay()
  if (!autoplay.value) return
  progressTimer = window.setInterval(() => {
    orbitProgress.value += 0.02
    if (orbitProgress.value >= 1) {
      orbitProgress.value = 0
      requestSceneChange((activeIndex.value + 1) % scenes.length)
    }
  }, 120)
}

const resolveScrollTop = () => {
  return pageRef.value?.scrollTop ?? 0
}

const easeInOutCinematic = (t: number) => {
  return 1 - Math.pow(1 - t, 4)
}

const animateScrollTo = (top: number, duration: number) => {
  const host = pageRef.value
  if (!host) return
  if (scrollAnimationFrame !== null) {
    window.cancelAnimationFrame(scrollAnimationFrame)
    scrollAnimationFrame = null
  }
  const startTop = host.scrollTop
  const maxScrollTop = Math.max(host.scrollHeight - host.clientHeight, 0)
  const destination = Math.min(Math.max(top, 0), maxScrollTop)
  const distance = destination - startTop
  if (Math.abs(distance) < 2) {
    host.scrollTop = destination
    isAutoScrolling.value = false
    return
  }

  const startTime = performance.now()
  isAutoScrolling.value = true

  const tick = (now: number) => {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeInOutCinematic(progress)
    host.scrollTop = startTop + distance * eased

    if (progress < 1) {
      scrollAnimationFrame = window.requestAnimationFrame(tick)
      return
    }

    host.scrollTop = destination
    scrollAnimationFrame = null
    isAutoScrolling.value = false
  }

  scrollAnimationFrame = window.requestAnimationFrame(tick)
}

const handleWheelDuringAutoScroll = (event: WheelEvent) => {
  if (!isAutoScrolling.value) return
  event.preventDefault()
}

const updateHeaderFade = () => {
  const currentHeaderHeight = headerRef.value?.offsetHeight ?? 112
  if (!currentHeaderHeight) {
    headerFade.value = 0
    return
  }

  const start = currentHeaderHeight
  headerFade.value = resolveScrollTop() > start ? 1 : 0
}

type OrbitNavOptions = {
  scrollToContent?: boolean
  pauseAutoplay?: boolean
  suppressSceneActivation?: boolean
  fastOrbit?: boolean
}

const hideSceneCopy = () => {
  if (!isCopyVisible.value) return
  isCopyVisible.value = false
  if (copyRevealTimer) {
    window.clearTimeout(copyRevealTimer)
    copyRevealTimer = null
  }
}

const revealSceneCopy = (index: number) => {
  copySceneIndex.value = index
  if (copyRevealTimer) {
    window.clearTimeout(copyRevealTimer)
  }
  copyRevealTimer = window.setTimeout(() => {
    isCopyVisible.value = true
    copyRevealTimer = null
  }, 20)
}

const startPanelTransition = (index: number) => {
  isPanelTransitioning.value = true
  displayIndex.value = index
  revealSceneCopy(index)
  window.setTimeout(() => {
    isPanelTransitioning.value = false
  }, transitionMs)
}

const setActiveByCenterSlot = (options?: OrbitNavOptions) => {
  const nextIndex = orbitOrder.value[centerSlot]
  if (options?.suppressSceneActivation) {
    return
  }
  activeIndex.value = nextIndex
  startPanelTransition(nextIndex)
}

const resolveOrbitTravel = (center: number, index: number) => {
  const forward = (index - center + scenes.length) % scenes.length
  const backward = (center - index + scenes.length) % scenes.length
  return {
    forward,
    backward,
    direction: (forward <= backward ? 1 : -1) as 1 | -1
  }
}

const shiftOrbitOrder = (order: number[], direction: 1 | -1, steps = 1) => {
  let nextOrder = [...order]
  for (let count = 0; count < steps; count += 1) {
    nextOrder = direction === 1
      ? [...nextOrder.slice(1), nextOrder[0]]
      : [nextOrder[nextOrder.length - 1], ...nextOrder.slice(0, nextOrder.length - 1)]
  }
  return nextOrder
}

const applySceneChange = (index: number, options?: OrbitNavOptions) => {
  if (options?.pauseAutoplay) {
    pauseAutoplay()
  }
  activeIndex.value = index
  orbitProgress.value = 0
  startPanelTransition(index)
  if (autoplay.value) {
    startAutoplay()
  }
}

const jumpOrbitToScene = (index: number, direction: 1 | -1, steps: number, options?: OrbitNavOptions) => {
  if (isOrbitTransitioning.value) return
  isOrbitTransitioning.value = true
  isFastOrbitTransition.value = true
  orbitProgress.value = 0
  if (options?.pauseAutoplay) {
    pauseAutoplay()
  } else {
    clearAutoplay()
  }
  if (orbitSettleTimer) {
    window.clearTimeout(orbitSettleTimer)
    orbitSettleTimer = null
  }
  orbitGhosts.value = []
  orbitOverrides.value = {}
  lastOrbitDirection.value = direction

  const currentOrder = [...orbitOrder.value]
  const ghostEnd = direction === 1 ? offscreenOrbitLeft : offscreenOrbitRight
  const reenterStart = direction === 1 ? offscreenOrbitRight : offscreenOrbitLeft

  const outgoingScenes = direction === 1
    ? currentOrder.slice(0, steps)
    : currentOrder.slice(currentOrder.length - steps)
  const incomingScenes = direction === 1
    ? currentOrder.slice(0, steps)
    : currentOrder.slice(currentOrder.length - steps)

  orbitGhosts.value = outgoingScenes.map((sceneIndex, ghostIndex) => {
    const slotIndex = direction === 1 ? ghostIndex : orbitSlots.value.length - steps + ghostIndex
    const slot = orbitSlots.value[slotIndex]
    return {
      label: scenes[sceneIndex].navLabel,
      style: {
        left: `${slot?.left ?? 50}%`,
        top: resolveOrbitTop(slotIndex, slot?.top ?? 82),
        opacity: '0.72',
        transition: 'none'
      }
    }
  })

  orbitOrder.value = shiftOrbitOrder(currentOrder, direction, steps)
  orbitOverrides.value = Object.fromEntries(incomingScenes.map(sceneIndex => [
    sceneIndex,
    {
      left: `${reenterStart.left}%`,
      top: `${reenterStart.top}%`,
      opacity: '0',
      pointerEvents: 'none',
      transition: 'none'
    }
  ]))

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      orbitOverrides.value = Object.fromEntries(incomingScenes.map(sceneIndex => {
        const slotIndex = orbitOrder.value.indexOf(sceneIndex)
        const slot = orbitSlots.value[slotIndex]
        return [sceneIndex, {
          left: `${slot?.left ?? 50}%`,
          top: resolveOrbitTop(slotIndex, slot?.top ?? 82),
          opacity: '1',
          transition: orbitMotionTransition
        }]
      }))
      if (orbitGhosts.value.length) {
        orbitGhosts.value = orbitGhosts.value.map((ghost, ghostIndex) => ({
          ...ghost,
          style: {
            left: `${ghostEnd.left}%`,
            top: `${ghostEnd.top + (direction === 1 ? ghostIndex : -ghostIndex) * 1.6}%`,
            opacity: '0',
            transition: orbitMotionTransition
          }
        }))
      }
    })
  })

  orbitSettleTimer = window.setTimeout(() => {
    orbitOverrides.value = {}
    orbitGhosts.value = []
    isOrbitTransitioning.value = false
    isFastOrbitTransition.value = false
    orbitSettleTimer = null
    pendingTargetIndex.value = null
    applySceneChange(index, options)
  }, 380)
}

const stepOrbit = (direction: 1 | -1, options?: OrbitNavOptions) => {
  if (isOrbitTransitioning.value) return
  isOrbitTransitioning.value = true
  isFastOrbitTransition.value = Boolean(options?.fastOrbit)
  orbitProgress.value = 0
  if (options?.pauseAutoplay) {
    pauseAutoplay()
  } else {
    clearAutoplay()
  }
  if (orbitSettleTimer) {
    window.clearTimeout(orbitSettleTimer)
    orbitSettleTimer = null
  }
  orbitGhosts.value = []
  orbitOverrides.value = {}
  lastOrbitDirection.value = direction

  const currentOrder = [...orbitOrder.value]
  const exitingScene = direction === 1 ? currentOrder[0] : currentOrder[currentOrder.length - 1]
  const ghostStart = direction === 1 ? orbitSlots.value[0] : orbitSlots.value[orbitSlots.value.length - 1]
  const ghostEnd = direction === 1 ? offscreenOrbitLeft : offscreenOrbitRight
  const reenterStart = direction === 1 ? offscreenOrbitRight : offscreenOrbitLeft
  const reenterEnd = direction === 1 ? orbitSlots.value[orbitSlots.value.length - 1] : orbitSlots.value[0]
  const ghostStartSlotIndex = direction === 1 ? 0 : orbitSlots.value.length - 1
  const reenterEndSlotIndex = direction === 1 ? orbitSlots.value.length - 1 : 0
  const newOrder = shiftOrbitOrder(currentOrder, direction)

  orbitGhosts.value = [{
    label: scenes[exitingScene].navLabel,
    style: {
      left: `${ghostStart.left}%`,
      top: resolveOrbitTop(ghostStartSlotIndex, ghostStart.top),
      opacity: '0.72',
      transition: 'none'
    }
  }]

  orbitOrder.value = newOrder
  orbitOverrides.value = {
    [exitingScene]: {
      left: `${reenterStart.left}%`,
      top: `${reenterStart.top}%`,
      opacity: '0',
      pointerEvents: 'none',
      transition: 'none'
    }
  }

  setActiveByCenterSlot(options)

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const motionTransition = options?.fastOrbit
        ? 'left 0.36s cubic-bezier(0.2, 0.9, 0.24, 1.02), top 0.36s cubic-bezier(0.2, 0.9, 0.24, 1.02), opacity 0.22s ease'
        : orbitMotionTransition
      orbitOverrides.value = {
        [exitingScene]: {
          left: `${reenterEnd?.left ?? 50}%`,
          top: resolveOrbitTop(reenterEndSlotIndex, reenterEnd?.top ?? 82),
          opacity: '1',
          transition: motionTransition
        }
      }
      if (orbitGhosts.value.length) {
        orbitGhosts.value = orbitGhosts.value.map(ghost => ({
          ...ghost,
          style: {
            left: `${ghostEnd.left}%`,
            top: `${ghostEnd.top}%`,
            opacity: '0',
            transition: motionTransition
          }
        }))
      }
    })
  })

  orbitSettleTimer = window.setTimeout(() => {
    orbitOverrides.value = {}
    orbitGhosts.value = []
    orbitSettleTimer = null

    if (pendingTargetIndex.value !== null) {
      const target = pendingTargetIndex.value
      const { forward, backward, direction: nextDirection } = resolveOrbitTravel(orbitOrder.value[centerSlot], target)
      if (forward === 0 && backward === 0) {
        isOrbitTransitioning.value = false
        isFastOrbitTransition.value = false
        pendingTargetIndex.value = null
        applySceneChange(target, { ...options, suppressSceneActivation: false })
        if (autoplay.value) {
          startAutoplay()
        }
        return
      }
      if (forward > 1 || backward > 1) {
        isOrbitTransitioning.value = false
        stepOrbit(nextDirection, { ...options, suppressSceneActivation: true, fastOrbit: true })
        return
      }
      isOrbitTransitioning.value = false
      pendingTargetIndex.value = null
      stepOrbit(nextDirection, { ...options, suppressSceneActivation: false, fastOrbit: true })
      return
    }

    isOrbitTransitioning.value = false
    isFastOrbitTransition.value = false
    if (autoplay.value) {
      startAutoplay()
    }
  }, options?.fastOrbit ? 380 : transitionMs + 80)
}

const handleBack = () => {
  router.push({ name: 'WorkbenchMockInterview' })
}

const scrollToContentPreview = () => {
  pauseAutoplay()
  animateScrollTo(contentRevealTarget.value, 980)
}

const handleOverviewPrimaryAction = () => {
  requestSceneChange(2, { pauseAutoplay: true, scrollToContent: true })
}

const handleOverviewSecondaryAction = () => {
  requestSceneChange(1, { pauseAutoplay: true, scrollToContent: true })
}

const handleOverviewReportAction = () => {
  requestSceneChange(scenes.findIndex(item => item.id === 'report'), { pauseAutoplay: true, scrollToContent: true })
}

const requestSceneChange = (index: number, options?: OrbitNavOptions) => {
  if (index === activeSceneIndexBySlot.value && index === displayIndex.value && !isPanelTransitioning.value && !isOrbitTransitioning.value) {
    return
  }
  navigateToScene(index, options)
}

const navigateToScene = (index: number, options?: OrbitNavOptions) => {
  if (index === activeSceneIndexBySlot.value) {
    pendingTargetIndex.value = null
    applySceneChange(index, options)
    return
  }
  hideSceneCopy()
  if (isOrbitTransitioning.value) {
    pendingTargetIndex.value = index
    return
  }

  const center = activeSceneIndexBySlot.value
  const { forward, backward, direction } = resolveOrbitTravel(center, index)
  if (forward > 1 || backward > 1) {
    pendingTargetIndex.value = index
    stepOrbit(direction, { ...options, suppressSceneActivation: true, fastOrbit: true })
    return
  }
  pendingTargetIndex.value = null
  stepOrbit(direction, options)
}

const goToNext = () => {
  pendingTargetIndex.value = null
  hideSceneCopy()
  stepOrbit(-1)
}

const goToPrev = () => {
  pendingTargetIndex.value = null
  hideSceneCopy()
  stepOrbit(1)
}

const toggleAutoplay = () => {
  autoplay.value = !autoplay.value
  if (!autoplay.value) {
    clearAutoplay()
    return
  }
  startAutoplay()
}

const handleVisualResize = () => {
  syncVisualLayers(true)
}

watch(orderedSceneIndexes, async () => {
  await nextTick()
  syncVisualLayers()
})

onMounted(() => {
  nextTick(() => {
    syncVisualLayers(true)
  })
  startAutoplay()
  updateHeaderFade()
  window.addEventListener('resize', handleVisualResize)
  pageRef.value?.addEventListener('scroll', updateHeaderFade, { passive: true })
  pageRef.value?.addEventListener('wheel', handleWheelDuringAutoScroll, { passive: false })
})

onBeforeUnmount(() => {
  clearAutoplay()
  clearTransitionTimers()
  window.removeEventListener('resize', handleVisualResize)
  visualLayerRefs.value.forEach((layer) => {
    if (layer) {
      gsap.killTweensOf(layer)
    }
  })
  pageRef.value?.removeEventListener('scroll', updateHeaderFade)
  pageRef.value?.removeEventListener('wheel', handleWheelDuringAutoScroll)
})
</script>

<template>
  <div
    ref="pageRef"
    class="interview-space-showcase"
    :class="{ 'is-auto-scrolling': isAutoScrolling, 'is-fast-orbit-transition': isFastOrbitTransition }"
    :style="sceneShellStyle"
  >
    <div class="space-noise"></div>
    <div
      class="space-glow glow-a"
      :style="glowAStyle"
    ></div>
    <div
      class="space-glow glow-b"
      :style="glowBStyle"
    ></div>
    <div
      class="space-nebula"
      :style="nebulaStyle"
    ></div>

    <header
      ref="headerRef"
      class="space-header"
      :style="headerStyle"
    >
      <div class="brand-lockup">
        <div class="brand-mark">
          <span class="i-lucide-orbit"></span>
        </div>
        <div>
          <div class="brand-name">Interview Cosmos</div>
          <div class="brand-meta">Mock redesign / scene preview</div>
        </div>
      </div>

      <nav class="space-nav">
        <a href="#">Overview</a>
        <a href="#">Interview</a>
        <a href="#">Strategy</a>
        <a href="#">Feedback</a>
        <a href="#">Result</a>
      </nav>

      <div class="header-tools">
        <button
          type="button"
          class="icon-tool"
          aria-label="Search"
        >
          <span class="i-lucide-search"></span>
        </button>
        <button
          type="button"
          class="back-link"
          @click="handleBack"
        >
          Return to interview
        </button>
      </div>
    </header>

    <button
      type="button"
      class="scroll-capsule"
      aria-label="Scroll to content"
      @click="scrollToContentPreview"
    >
      <span class="scroll-capsule-arrow i-lucide-arrow-down"></span>
    </button>

    <main class="hero-stage">
      <section class="copy-column">
        <Transition
          mode="out-in"
          name="scene-copy"
        >
          <div
            v-if="isCopyVisible"
            :key="copyScene.id"
            class="copy-inner"
            :class="{ 'is-overview-copy': copyScene.id === 'overview' }"
          >
            <div class="eyebrow">
              <span class="eyebrow-dot"></span>
              <span>{{ copyScene.eyebrow }}</span>
            </div>
            <h1>{{ copyScene.title }}</h1>
            <p class="summary">{{ copyScene.summary }}</p>

            <ul class="bullet-list">
              <li
                v-for="bullet in copyScene.bullets"
                :key="bullet"
              >
                {{ bullet }}
              </li>
            </ul>
          </div>
        </Transition>
      </section>

      <section
        ref="visualColumnRef"
        class="visual-column"
      >
        <div
          v-for="(scene, index) in scenes"
          :key="scene.id"
          class="visual-layer"
          :class="sceneLayerClass(index)"
          :ref="(element) => setVisualLayerRef(element, index)"
        >
          <div
            class="planet-shell"
            :style="[planetVarsFor(scene), planetStyleFor(scene, index)]"
            :ref="(element) => setPlanetShellRef(element, index)"
          >
            <div class="planet-flare"></div>
            <div class="planet-atmosphere"></div>
            <div class="planet-rings"></div>
            <div class="planet-wave"></div>
            <div class="planet-shadow"></div>
          </div>
        </div>
      </section>
    </main>

    <section class="orbit-rail">
      <div class="orbit-glow"></div>
      <svg
        class="orbit-svg"
        viewBox="0 0 1200 220"
        preserveAspectRatio="none"
      >
        <path d="M -40 88 C 120 110, 250 132, 418 148 C 556 160, 670 160, 810 148 C 972 134, 1088 112, 1240 88" />
      </svg>

      <div class="orbit-controls">
        <button
          type="button"
          class="orbit-arrow"
          @click="goToPrev"
        >
          <span class="i-lucide-chevron-left"></span>
        </button>

        <button
          type="button"
          class="orbit-play"
          @click="toggleAutoplay"
        >
          <svg
            class="orbit-progress"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              class="orbit-progress-track"
              cx="50"
              cy="50"
              r="44"
            />
            <circle
              class="orbit-progress-value"
              cx="50"
              cy="50"
              r="44"
              :style="{ strokeDashoffset: String(276.46 * (1 - orbitProgress)) }"
            />
          </svg>
          <span :class="autoplay ? 'i-lucide-pause' : 'i-lucide-play'"></span>
        </button>

        <button
          type="button"
          class="orbit-arrow"
          @click="goToNext"
        >
          <span class="i-lucide-chevron-right"></span>
        </button>
      </div>

      <button
        v-for="(scene, index) in scenes"
        :key="scene.id"
        type="button"
        class="orbit-stop"
        :class="orbitClass(index)"
        :style="orbitStopStyle(index)"
        @click="navigateToScene(index, { pauseAutoplay: true })"
      >
        <span class="orbit-label">{{ scene.navLabel }}</span>
        <span class="orbit-dot"></span>
      </button>

      <div
        v-for="(ghost, ghostIndex) in orbitGhosts"
        :key="`orbit-ghost-${ghost.label}-${ghostIndex}`"
        class="orbit-stop orbit-ghost"
        :style="ghost.style"
      >
        <span class="orbit-label">{{ ghost.label }}</span>
        <span class="orbit-dot"></span>
      </div>
    </section>

    <section
      ref="contentSectionRef"
      class="content-stack"
    >
      <article
        ref="contentPanelRef"
        class="content-panel"
      >
        <div class="panel-inner">
          <Transition
            mode="out-in"
            name="panel-swap"
          >
            <div
              :key="displayScene.id"
              ref="contentLeadRef"
              class="panel-swap-shell"
            >
              <div class="panel-kicker">{{ displayScene.navLabel }}</div>
              <div
                class="panel-grid"
                :class="{ 'is-mock-panel': displayScene.id === 'mock' }"
              >
                <div>
                  <h2>{{ displayScene.sectionTitle }}</h2>
                  <p>{{ displayScene.sectionBody }}</p>
                  <template v-if="displayScene.id === 'overview'">
                    <div class="overview-panel-shell">
                      <div class="overview-progress-card">
                        <div class="overview-progress-head">
                          <div>
                            <div class="overview-progress-label">主任务区</div>
                            <strong>{{ overviewPrimaryActionLabel }}</strong>
                          </div>
                          <span>{{ overviewProgressPercent }}%</span>
                        </div>
                        <div class="overview-progress-track">
                          <div class="overview-progress-fill" :style="{ width: `${overviewProgressPercent}%` }"></div>
                        </div>
                        <p>{{ overviewStatusLabel }}</p>
                      </div>

                      <div class="overview-summary-grid">
                        <div v-for="item in overviewSummaryItems" :key="item.label" class="overview-summary-card">
                          <span>{{ item.label }}</span>
                          <strong>{{ item.value }}</strong>
                          <small>{{ item.note }}</small>
                        </div>
                      </div>

                      <div class="overview-action-row">
                        <button type="button" class="overview-action primary" @click="handleOverviewPrimaryAction">
                          {{ overviewPrimaryActionLabel }}
                        </button>
                        <button type="button" class="overview-action" @click="handleOverviewSecondaryAction">
                          查看资料
                        </button>
                        <button type="button" class="overview-action" @click="handleOverviewReportAction">
                          查看报告
                        </button>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="displayScene.id === 'mock'">
                    <div class="mock-meta-row">
                      <span
                        v-for="item in mockPanelMeta"
                        :key="item"
                        class="mock-meta-chip"
                      >
                        {{ item }}
                      </span>
                    </div>

                    <div class="mock-prompt-card">
                      <div class="mock-prompt-label">当前题干</div>
                      <div class="mock-prompt-body">{{ primaryQuestion?.prompt || displayScene.sectionBody }}</div>
                    </div>

                    <div class="mock-live-shell">
                      <div class="mock-support-grid">
                        <section class="mock-side-block">
                          <div class="mock-side-label">回答提示</div>
                          <p>{{ primaryQuestion?.hint || currentGuide?.desc || '当前还没有提示内容。' }}</p>
                        </section>

                        <section class="mock-side-block">
                          <div class="mock-side-label">面试官可能继续追问</div>
                          <div class="mock-follow-up-current">{{ currentMockFollowUp || '等待追问建议' }}</div>
                          <button
                            type="button"
                            class="mock-follow-up-switch"
                            @click="rotateMockFollowUp"
                          >
                            换一条追问
                          </button>
                          <ul class="mock-side-list">
                            <li
                              v-for="item in mockPanelFollowUps"
                              :key="item"
                            >
                              {{ item }}
                            </li>
                          </ul>
                        </section>

                        <section class="mock-side-block">
                          <div class="mock-side-label">当前弱项信号</div>
                          <ul class="mock-side-list is-signal">
                            <li
                              v-for="item in mockPanelWeakness"
                              :key="item"
                            >
                              {{ item }}
                            </li>
                          </ul>
                        </section>
                      </div>

                      <section class="mock-stream-card">
                        <div class="mock-stream-head">
                          <div>
                            <div class="mock-stream-title">AI 面试官流式追问区</div>
                            <div class="mock-stream-note">当前对话会围绕这道题继续追问、补反馈和拉高回答密度。</div>
                          </div>
                          <div class="mock-stream-stats">
                            <span class="mock-stream-stat">{{ mockDialogueCount }} 条对话</span>
                            <span class="mock-stream-stat" :class="{ 'is-streaming': isMockStreaming }">
                              {{ isMockStreaming ? '生成中' : '等待输入' }}
                            </span>
                          </div>
                        </div>
                        <MessageList
                          :messages="mockMessages"
                          :scroll-version="mockScrollVersion"
                        />
                        <div v-if="mockStreamError" class="mock-stream-error">
                          {{ mockStreamError }}
                        </div>
                      </section>

                      <AnswerInputPanel
                        :value="mockAnswerDraft"
                        :submitted="isMockCurrentSubmitted"
                        :streaming="isMockStreaming"
                        @update:value="mockAnswerDraft = $event"
                        @submit="submitMockAnswer"
                        @clear="clearMockAnswer"
                        @stop="stopMockStream"
                      />
                    </div>
                  </template>
                </div>

                <div v-if="displayScene.id !== 'mock'" class="panel-card">
                  <div class="panel-card-title">{{ displayScene.title }}</div>
                  <ul>
                    <li
                      v-for="bullet in displayScene.bullets"
                      :key="bullet"
                    >
                      {{ bullet }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </article>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.interview-space-showcase {
  --ease-orbit: cubic-bezier(0.2, 0.9, 0.22, 1);
  --ease-cinematic: cubic-bezier(0.18, 0.92, 0.2, 1);
  --ease-reform: cubic-bezier(0.16, 1, 0.24, 1);
  --scene-takeover-duration: 0.98s;
  --scene-flare-duration: 0.9s;
  --panel-collapse-duration: 0.9s;
  --panel-reform-duration: 1.08s;
  --scroll-sync-duration: 0.92s;
  position: relative;
  flex: 1;
  min-height: 0;
  height: 100%;
  color: #fff;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  transition: background var(--scene-takeover-duration) var(--ease-orbit);
  background-color: #071123;
}

.interview-space-showcase.is-auto-scrolling {
  scroll-behavior: auto;
}

.space-noise,
.space-nebula,
.space-glow {
  position: absolute;
  inset: 0 0 auto;
  height: 150vh;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 86%, transparent 100%);
  mask-image: linear-gradient(180deg, #000 0%, #000 86%, transparent 100%);
}

.space-noise {
  opacity: 0.16;
  background-image:
    radial-gradient(circle at 20% 18%, rgb(255 255 255 / 0.9) 0 1px, transparent 1.6px),
    radial-gradient(circle at 62% 11%, rgb(255 255 255 / 0.75) 0 1px, transparent 1.5px),
    radial-gradient(circle at 88% 26%, rgb(255 255 255 / 0.85) 0 1.2px, transparent 1.7px),
    radial-gradient(circle at 32% 44%, rgb(255 255 255 / 0.55) 0 1px, transparent 1.6px),
    radial-gradient(circle at 77% 58%, rgb(255 255 255 / 0.55) 0 1px, transparent 1.7px);
  background-size: 520px 320px, 560px 340px, 580px 360px, 500px 300px, 680px 420px;
}

.space-nebula {
  mix-blend-mode: screen;
  opacity: 0.84;
  transition: background var(--scene-takeover-duration) var(--ease-orbit);
}

.space-glow {
  filter: blur(18px);
  transition: background var(--scene-takeover-duration) var(--ease-orbit);
}

.interview-space-showcase.is-auto-scrolling .space-noise,
.interview-space-showcase.is-auto-scrolling .space-nebula,
.interview-space-showcase.is-auto-scrolling .space-glow {
  -webkit-mask-image: none;
  mask-image: none;
}

.interview-space-showcase.is-auto-scrolling .space-nebula {
  mix-blend-mode: normal;
  opacity: 0.48;
}

.interview-space-showcase.is-auto-scrolling .space-glow {
  filter: none;
  opacity: 0.22;
}

.glow-a {
  inset: -10% auto auto -6%;
  width: 50vw;
  height: 42vw;
}

.glow-b {
  inset: auto -10% 6% auto;
  width: 44vw;
  height: 40vw;
}

.space-header {
  position: sticky;
  top: 0;
  z-index: 10;
  isolation: isolate;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 10px 28px;
  border-bottom: 1px solid rgb(255 255 255 / var(--header-border-opacity, 0.08));
  background: linear-gradient(180deg, rgb(7 15 30 / var(--header-bg-opacity, 0.92)) 0%, rgb(7 15 30 / 0.34) 100%);
  backdrop-filter: blur(14px);
  transition:
    opacity 0.5s ease,
    transform 0.5s var(--ease-orbit),
    border-color 0.5s ease,
    background 0.5s ease;
}

.interview-space-showcase.is-auto-scrolling .space-header {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.space-header::after {
  content: "";
  position: absolute;
  inset: auto 0 -32px;
  height: 32px;
  background: linear-gradient(180deg, rgb(7 15 30 / calc(var(--header-mask-opacity, 1) * 0.34)) 0%, rgb(7 15 30 / 0) 100%);
  pointer-events: none;
  transition: opacity 0.5s ease, background 0.5s ease;
}

.interview-space-showcase.is-auto-scrolling .space-header::after {
  opacity: 0;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 12px;
  background: rgb(255 255 255 / 0.06);
  color: var(--scene-primary);
  font-size: 18px;
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
}

.brand-meta {
  margin-top: 2px;
  color: rgb(232 244 255 / 0.62);
  font-size: 11px;
}

.space-nav {
  display: flex;
  gap: 22px;
}

.space-nav a {
  color: rgb(255 255 255 / 0.82);
  font-size: 14px;
  transition: color 0.22s ease;
}

.space-nav a:hover {
  color: var(--scene-primary);
}

.back-link,
.icon-tool,
.orbit-arrow,
.orbit-play,
.orbit-stop {
  font: inherit;
}

.header-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-tool {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  color: #fff;
  cursor: pointer;
  transition: background 0.24s ease, border-color 0.24s ease, transform 0.24s ease;
}

.icon-tool:hover {
  border-color: rgb(255 255 255 / 0.24);
  background: rgb(255 255 255 / 0.08);
  transform: translateY(-1px);
}

.back-link {
  height: 38px;
  padding: 0 16px;
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
  color: #fff;
  cursor: pointer;
  transition: background 0.24s ease, border-color 0.24s ease, transform 0.24s ease;
}

.back-link:hover {
  border-color: rgb(255 255 255 / 0.26);
  background: rgb(255 255 255 / 0.1);
  transform: translateY(-1px);
}

.scroll-capsule {
  position: fixed;
  top: 50%;
  right: 54px;
  z-index: 26;
  display: grid;
  place-items: start center;
  width: 28px;
  height: 60px;
  padding-top: 20px;
  border: 1px solid rgb(255 255 255 / 0.42);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.12), rgb(255 255 255 / 0.02)),
    rgb(4 18 34 / 0.18);
  color: rgb(255 255 255 / 0.94);
  box-shadow:
    0 18px 42px rgb(5 16 31 / 0.28),
    inset 0 0 0 1px rgb(255 255 255 / 0.06);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  cursor: pointer;
  transform: translateY(-50%);
  overflow: hidden;
  transition: transform 0.24s ease, border-color 0.24s ease, background 0.24s ease, opacity 0.24s ease;
}

.scroll-capsule:hover {
  border-color: rgb(255 255 255 / 0.64);
  background:
    linear-gradient(180deg, rgb(255 255 255 / 0.18), rgb(255 255 255 / 0.05)),
    rgb(4 18 34 / 0.26);
  transform: translateY(calc(-50% - 2px));
}

.scroll-capsule-arrow {
  font-size: 15px;
  transition: transform 0.85s cubic-bezier(0.22, 0.84, 0.24, 1);
}

.scroll-capsule:hover .scroll-capsule-arrow {
  transform: translateY(18px);
}

.hero-stage {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(320px, 520px) 1fr;
  gap: 20px;
  min-height: calc(100vh - 92px);
  padding: 10px 34px 240px;
}

.copy-column {
  position: relative;
  padding-top: 12px;
  min-height: 420px;
}

.copy-inner {
  position: absolute;
  inset: 0 auto auto 0;
  width: min(520px, 100%);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  color: var(--scene-secondary);
  font-size: 13px;
}

.eyebrow-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--scene-primary);
  box-shadow: 0 0 18px var(--scene-primary);
}

.copy-column h1 {
  max-width: 6ch;
  font-size: clamp(39px, 4.5vw, 68px);
  line-height: 0.98;
  font-weight: 600;
}

.summary {
  max-width: 520px;
  margin-top: 18px;
  color: rgb(250 250 255 / 0.9);
  font-size: 12px;
  line-height: 1.6;
  font-weight: 400;
}

.overview-panel-shell {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}

.overview-progress-card,
.overview-summary-card {
  padding: 18px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 22px;
  background: rgb(10 18 34 / 0.5);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
}

.overview-progress-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.overview-progress-label,
.overview-summary-card span {
  display: block;
  color: rgb(220 232 255 / 0.62);
  font-size: 12px;
}

.overview-progress-head strong,
.overview-summary-card strong {
  display: block;
  margin-top: 6px;
  color: #fff;
  font-size: 20px;
}

.overview-progress-head span {
  color: var(--scene-primary);
  font-size: 24px;
  font-weight: 700;
}

.overview-progress-track {
  height: 10px;
  margin-top: 16px;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.08);
}

.overview-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--scene-primary) 0%, rgb(255 255 255 / 0.86) 100%);
}

.overview-progress-card p,
.overview-summary-card small {
  margin: 10px 0 0;
  color: rgb(228 238 255 / 0.72);
  font-size: 13px;
  line-height: 1.5;
}

.overview-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.overview-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.overview-action {
  height: 46px;
  padding: 0 18px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.05);
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.24s ease, border-color 0.24s ease, transform 0.24s ease;
}

.overview-action.primary {
  border-color: rgb(255 255 255 / 0.06);
  background: var(--scene-primary);
  color: #081421;
}

.overview-action:hover {
  border-color: rgb(255 255 255 / 0.24);
  background: rgb(255 255 255 / 0.1);
  transform: translateY(-1px);
}

.overview-action.primary:hover {
  background: #fff;
}

.bullet-list {
  display: grid;
  gap: 10px;
  margin-top: 22px;
  padding-left: 20px;
}

.bullet-list li {
  color: rgb(251 252 255 / 0.92);
  font-size: 14px;
  line-height: 1.4;
}

.visual-column {
  position: relative;
  min-height: 560px;
  overflow: visible;
  isolation: isolate;
}

.visual-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  will-change: transform, opacity, filter;
  opacity: 0;
  transform-origin: 50% 50%;
}

.visual-layer.is-active .planet-shell {
  z-index: 3;
}

.visual-layer.is-trailing .planet-shell::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, rgb(255 255 255 / 0.03) 0%, rgb(0 0 0 / 0.16) 100%);
}

.planet-shell {
  position: absolute;
  aspect-ratio: 1;
  border-radius: 50%;
  will-change: filter, opacity, box-shadow;
  transition:
    width var(--scene-takeover-duration) var(--ease-orbit),
    height var(--scene-takeover-duration) var(--ease-orbit),
    right var(--scene-takeover-duration) var(--ease-orbit),
    bottom var(--scene-takeover-duration) var(--ease-orbit),
    background var(--scene-takeover-duration) var(--ease-orbit),
    box-shadow 0.58s cubic-bezier(0.22, 0.88, 0.24, 1.02),
    filter 0.58s cubic-bezier(0.22, 0.88, 0.24, 1.02),
    opacity 0.58s cubic-bezier(0.22, 0.88, 0.24, 1.02);
}

.planet-shell--background {
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
  mix-blend-mode: screen;
}

.planet-shell::before {
  content: "";
  position: absolute;
  inset: -4% -4% auto auto;
  width: 68%;
  height: 68%;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(255 255 255 / 0.56) 0%, rgb(255 255 255 / 0) 58%);
  filter: blur(12px);
  opacity: 0.72;
}

.planet-shell--background::before {
  inset: 8% 8% auto auto;
  width: 52%;
  height: 52%;
  filter: blur(18px);
  opacity: 0.34;
}

.planet-atmosphere,
.planet-rings,
.planet-flare,
.planet-wave,
.planet-shadow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  transition:
    opacity 0.58s cubic-bezier(0.22, 0.88, 0.24, 1.02),
    filter 0.58s cubic-bezier(0.22, 0.88, 0.24, 1.02),
    background 0.58s cubic-bezier(0.22, 0.88, 0.24, 1.02),
    border-color 0.58s cubic-bezier(0.22, 0.88, 0.24, 1.02);
}

.planet-atmosphere {
  inset: -2%;
  border: 2px solid var(--planet-atmosphere);
  filter: blur(6px);
  opacity: 0.82;
}

.planet-rings {
  inset: 26% -8% auto -8%;
  height: 44%;
  border: 1px solid var(--planet-ring);
  border-left-color: transparent;
  border-right-color: transparent;
  transform: rotate(-16deg);
  opacity: 0.58;
}

.planet-flare {
  inset: -12%;
  background:
    radial-gradient(circle at 32% 34%, rgb(255 255 255 / 0.38) 0%, rgb(255 255 255 / 0.05) 20%, rgb(255 255 255 / 0) 48%),
    radial-gradient(circle at 54% 48%, rgb(133 244 255 / 0.18) 0%, rgb(133 244 255 / 0) 54%);
  filter: blur(20px);
  opacity: 0;
  mix-blend-mode: screen;
}

.planet-wave {
  inset: -7%;
  border: 1px solid rgb(255 255 255 / 0.16);
  opacity: 0;
  transform: scale(0.88);
}

.planet-shadow {
  background: linear-gradient(
    115deg,
    rgb(255 255 255 / 0) 10%,
    rgb(0 0 0 / var(--planet-shadow-mid-strength, 0.12)) 42%,
    rgb(0 0 0 / var(--planet-shadow-strength, 0.72)) 100%
  );
}

.planet-shell--background .planet-atmosphere {
  inset: -6%;
  border-width: 1px;
  opacity: 0.4;
  filter: blur(12px);
}

.planet-shell--background .planet-shadow {
  opacity: 0.72;
}

.planet-shell.is-taking-over {
  animation: planetTakeover var(--scene-takeover-duration) var(--ease-orbit);
}

.planet-shell.is-taking-over .planet-rings {
  animation: planetRingsTakeover var(--scene-takeover-duration) var(--ease-orbit);
}

.planet-shell.is-taking-over .planet-flare {
  animation: planetFlareTakeover var(--scene-flare-duration) var(--ease-orbit);
}

.planet-shell.is-taking-over .planet-wave {
  animation: planetWaveTakeover var(--scene-takeover-duration) var(--ease-orbit);
}

.orbit-rail {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100vh - 250px);
  z-index: 8;
  height: 250px;
}

.orbit-glow {
  position: absolute;
  inset: 38% 12% auto;
  height: 64px;
  background: radial-gradient(circle at 50% 50%, rgb(255 255 255 / 0.08) 0%, rgb(255 255 255 / 0) 72%);
  filter: blur(18px);
  pointer-events: none;
}

.interview-space-showcase.is-auto-scrolling .orbit-glow {
  filter: none;
  opacity: 0.2;
}

.orbit-svg {
  width: 100%;
  height: 100%;
}

.orbit-svg path {
  fill: none;
  stroke: var(--scene-line);
  stroke-width: 1.4;
  filter: drop-shadow(0 0 12px rgb(255 255 255 / 0.1));
}

.orbit-controls {
  position: absolute;
  left: 50%;
  top: 73.5%;
  display: flex;
  align-items: center;
  gap: 18px;
  transform: translate(-50%, -50%);
  z-index: 4;
}

.orbit-arrow,
.orbit-play {
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
}

.orbit-arrow {
  width: 34px;
  height: 34px;
  border: 0;
  background: transparent;
  color: rgb(255 255 255 / 0.88);
  font-size: 18px;
}

.orbit-play {
  position: relative;
  width: 42px;
  height: 42px;
  border: 1px solid rgb(255 255 255 / 0.4);
  background: rgb(255 255 255 / 0.05);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.12);
  font-size: 13px;
}

.orbit-progress {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.orbit-progress-track,
.orbit-progress-value {
  fill: none;
  stroke-width: 1.4;
}

.orbit-progress-track {
  stroke: rgb(255 255 255 / 0.14);
}

.orbit-progress-value {
  stroke: rgb(255 255 255 / 0.88);
  stroke-linecap: round;
  stroke-dasharray: 276.46;
  transition: stroke-dashoffset 0.12s linear;
}

.orbit-stop {
  position: absolute;
  width: 132px;
  height: 84px;
  padding: 0;
  border: 0;
  background: transparent;
  transform: translate(-50%, -50%);
  cursor: pointer;
  pointer-events: auto;
  transform: translate(-50%, -50%);
  transition:
    left 1.04s cubic-bezier(0.2, 0.9, 0.24, 1.02),
    top 1.04s cubic-bezier(0.2, 0.9, 0.24, 1.02),
    opacity 0.3s ease;
}

.interview-space-showcase.is-fast-orbit-transition .orbit-stop {
  transition:
    left 0.36s cubic-bezier(0.2, 0.9, 0.24, 1.02),
    top 0.36s cubic-bezier(0.2, 0.9, 0.24, 1.02),
    opacity 0.22s ease;
}

.orbit-label {
  position: absolute;
  left: 50%;
  top: -2px;
  color: rgb(255 255 255 / 0.84);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transform: translateX(-50%);
  transition: color 0.3s ease, top 0.3s ease, font-size 0.3s ease;
}

.orbit-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--scene-dot);
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 4px transparent;
  transition: transform 0.28s ease, box-shadow 0.28s ease, background 0.28s ease;
}

.orbit-stop.is-active .orbit-label {
  top: -10px;
  color: #fff;
  font-size: 14px;
}

.orbit-stop.is-active .orbit-dot {
  background: var(--scene-dot-active);
  box-shadow: 0 0 0 6px rgb(255 255 255 / 0.08);
  transform: translate(-50%, -50%) scale(1.08);
}

.orbit-stop.is-center-node .orbit-dot {
  opacity: 0;
  box-shadow: none;
  transform: translate(-50%, -50%) scale(0.6);
}

.orbit-ghost {
  pointer-events: none;
  opacity: 0.72;
}

.scene-copy-enter-active {
  transition:
    opacity 0.42s var(--ease-orbit),
    transform 0.42s var(--ease-orbit),
    filter 0.42s var(--ease-orbit);
}

.scene-copy-leave-active {
  transition:
    opacity 0.24s ease,
    transform 0.24s ease,
    filter 0.24s ease;
}

.scene-copy-enter-from,
.scene-copy-leave-to {
  opacity: 0;
  filter: blur(5px);
  transform: translateY(10px);
}

.content-stack {
  position: relative;
  z-index: 3;
  padding: 240px 34px 120px;
  margin-top: -241px;
  background: transparent;
}

.content-panel {
  min-height: 82vh;
  display: flex;
  align-items: center;
}

.panel-inner {
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 66vh;
  padding: 42px 0;
}

.panel-swap-shell {
  position: relative;
  z-index: 2;
}

.panel-kicker {
  color: var(--scene-primary);
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.panel-grid {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) 320px;
  gap: 34px;
  margin-top: 18px;
}

.panel-grid.is-mock-panel {
  grid-template-columns: minmax(0, 1fr);
}

.panel-grid h2 {
  font-size: clamp(34px, 4vw, 58px);
  line-height: 1.02;
}

.panel-grid p {
  max-width: 640px;
  margin-top: 16px;
  color: rgb(237 244 255 / 0.82);
  font-size: 16px;
  line-height: 1.7;
}

.panel-card {
  align-self: start;
  padding: 24px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 20px;
  background: rgb(255 255 255 / 0.05);
  backdrop-filter: blur(14px);
}

.panel-card-title {
  margin-bottom: 14px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.panel-card ul {
  display: grid;
  gap: 10px;
  padding-left: 18px;
  color: rgb(239 245 255 / 0.86);
  font-size: 14px;
  line-height: 1.5;
}

.mock-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 26px;
}

.mock-meta-chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.05);
  color: rgb(245 248 255 / 0.88);
  font-size: 13px;
  white-space: nowrap;
}

.mock-prompt-card {
  margin-top: 24px;
  padding: 24px 24px 26px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 24px;
  background: linear-gradient(180deg, rgb(255 255 255 / 0.06) 0%, rgb(255 255 255 / 0.02) 100%);
}

.mock-prompt-label,
.mock-side-label {
  color: var(--scene-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mock-prompt-body {
  margin-top: 14px;
  color: rgb(244 247 255 / 0.94);
  font-size: 17px;
  line-height: 1.86;
}

.mock-live-shell {
  display: grid;
  gap: 18px;
  margin-top: 20px;
}

.mock-support-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.mock-side-block,
.mock-stream-card {
  padding: 20px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 20px;
  background: rgb(255 255 255 / 0.04);
  backdrop-filter: blur(14px);
}

.mock-side-block p {
  margin-top: 12px;
  color: rgb(237 244 255 / 0.84);
  font-size: 14px;
  line-height: 1.7;
}

.mock-follow-up-current {
  margin-top: 12px;
  color: rgb(244 248 255 / 0.94);
  font-size: 15px;
  line-height: 1.7;
}

.mock-follow-up-switch {
  margin-top: 12px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--scene-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.mock-side-list {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  padding-left: 18px;
  color: rgb(239 245 255 / 0.88);
  font-size: 14px;
  line-height: 1.6;
}

.mock-side-list.is-signal {
  color: rgb(255 233 214 / 0.9);
}

.mock-stream-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.mock-stream-title {
  font-size: 17px;
  font-weight: 700;
  color: rgb(248 250 255 / 0.96);
}

.mock-stream-note {
  margin-top: 6px;
  color: rgb(225 233 248 / 0.68);
  font-size: 13px;
  line-height: 1.65;
}

.mock-stream-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.mock-stream-stat {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid rgb(255 255 255 / 0.09);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  color: rgb(236 242 255 / 0.78);
  font-size: 12px;
  font-weight: 600;
}

.mock-stream-stat.is-streaming {
  border-color: rgb(198 206 255 / 0.26);
  background: rgb(198 206 255 / 0.12);
  color: rgb(239 242 255 / 0.96);
}

.mock-stream-error {
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid rgb(255 186 186 / 0.2);
  border-radius: 14px;
  background: rgb(255 112 112 / 0.08);
  color: rgb(255 219 219 / 0.94);
  font-size: 13px;
  line-height: 1.6;
}

.mock-live-shell :deep(.message-list) {
  min-height: 260px;
  max-height: 420px;
  padding-right: 4px;
}

.panel-swap-enter-active,
.panel-swap-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.panel-swap-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.panel-swap-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes planetTakeover {
  0% {
    transform: translate3d(5vw, 5vh, 0) scale(0.82);
    filter: blur(10px);
  }

  28% {
    transform: translate3d(-2.2vw, -1.8vh, 0) scale(1.11) rotate(-4deg);
    filter: blur(1px);
  }

  56% {
    transform: translate3d(0.8vw, 1.2vh, 0) scale(0.96) rotate(2deg);
    filter: blur(1px);
  }

  100% {
    transform: translate3d(0, 0, 0) scale(1) rotate(0);
    filter: blur(0);
  }
}

@keyframes planetRingsTakeover {
  0% {
    opacity: 0.16;
    transform: rotate(-24deg) scale(0.86);
  }

  32% {
    opacity: 0.92;
    transform: rotate(-6deg) scale(1.12);
  }

  58% {
    opacity: 0.66;
    transform: rotate(-21deg) scale(0.97);
  }

  100% {
    opacity: 0.58;
    transform: rotate(-16deg) scale(1);
  }
}

@keyframes planetFlareTakeover {
  0% {
    opacity: 0;
    transform: scale(0.7);
  }

  36% {
    opacity: 1;
    transform: scale(1.08);
  }

  100% {
    opacity: 0;
    transform: scale(1.2);
  }
}

@keyframes planetWaveTakeover {
  0% {
    opacity: 0.54;
    transform: scale(0.72);
  }

  54% {
    opacity: 0.22;
    transform: scale(1.08);
  }

  100% {
    opacity: 0;
    transform: scale(1.32);
  }
}

@keyframes nebulaSwirlA {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.28) rotate(-36deg);
    filter: blur(28px);
  }

  34% {
    opacity: 0.92;
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.18) rotate(154deg);
    filter: blur(18px);
  }
}

@keyframes nebulaSwirlB {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.24) rotate(18deg);
    filter: blur(14px);
  }

  42% {
    opacity: 0.88;
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.26) rotate(-170deg);
    filter: blur(10px);
  }
}

@keyframes nebulaCoreFlash {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.14);
  }

  30% {
    opacity: 0.96;
    transform: translate(-50%, -50%) scale(1.18);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(2.2);
  }
}

@keyframes contentCollapseIntoNebula {
  0% {
    opacity: 1;
    filter: blur(0);
    transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
  }

  42% {
    opacity: 0.96;
    filter: blur(2px);
    transform: translate3d(10px, -8px, 0) scale(0.88) rotate(-4deg);
  }

  100% {
    opacity: 0;
    filter: blur(16px);
    transform: translate3d(6px, -18px, 0) scale(0.08) rotate(-14deg);
  }
}

@keyframes contentCardCollapse {
  0% {
    opacity: 1;
    filter: blur(0);
    transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
  }

  46% {
    opacity: 0.92;
    filter: blur(3px);
    transform: translate3d(-14px, 12px, 0) scale(0.84) rotate(7deg);
  }

  100% {
    opacity: 0;
    filter: blur(18px);
    transform: translate3d(8px, -14px, 0) scale(0.08) rotate(-12deg);
  }
}

@keyframes contentReformFromNebula {
  0% {
    opacity: 0;
    filter: blur(18px);
    transform: translate3d(-6px, 20px, 0) scale(0.08) rotate(14deg);
  }

  56% {
    opacity: 0.92;
    filter: blur(4px);
    transform: translate3d(-8px, 6px, 0) scale(1.02) rotate(-4deg);
  }

  100% {
    opacity: 1;
    filter: blur(0);
    transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
  }
}

@keyframes contentCardReform {
  0% {
    opacity: 0;
    filter: blur(20px);
    transform: translate3d(8px, 18px, 0) scale(0.08) rotate(-16deg);
  }

  58% {
    opacity: 0.9;
    filter: blur(5px);
    transform: translate3d(10px, -8px, 0) scale(1.02) rotate(4deg);
  }

  100% {
    opacity: 1;
    filter: blur(0);
    transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
  }
}

@keyframes panelMassCollapse {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    filter: blur(0);
  }

  38% {
    transform: translate3d(6px, -8px, 0) scale(0.94) rotate(-1.8deg);
    filter: blur(2px);
  }

  100% {
    transform: translate3d(6px, -14px, 0) scale(0.04) rotate(-9deg);
    filter: blur(20px);
  }
}

@keyframes panelMassReform {
  0% {
    transform: translate3d(-6px, 18px, 0) scale(0.04) rotate(10deg);
    filter: blur(22px);
  }

  56% {
    transform: translate3d(-4px, -4px, 0) scale(1.03) rotate(-2deg);
    filter: blur(5px);
  }

  100% {
    transform: translate3d(0, 0, 0) scale(1);
    filter: blur(0);
  }
}

@keyframes panelCoreIgnite {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2);
  }

  36% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.4);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.32);
  }
}

@keyframes panelCoreReappear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2);
  }

  34% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.55);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.36);
  }
}

@media (max-width: 1100px) {
  .space-header {
    flex-wrap: wrap;
  }

  .space-nav {
    order: 3;
    width: 100%;
    overflow-x: auto;
  }

  .hero-stage {
    grid-template-columns: 1fr;
    padding-bottom: 320px;
  }

  .visual-column {
    min-height: 420px;
  }

  .planet-shell {
    right: -10vw !important;
    bottom: calc(-10vh + 300px) !important;
    width: min(72vw, 520px) !important;
    height: min(72vw, 520px) !important;
  }

  .scroll-capsule {
    right: 22px;
    width: 24px;
    height: 52px;
    padding-top: 16px;
  }

  .panel-grid {
    grid-template-columns: 1fr;
  }

  .mock-support-grid {
    grid-template-columns: 1fr;
  }

  .mock-stream-head {
    flex-direction: column;
  }

  .mock-stream-stats {
    justify-content: flex-start;
  }

}

@media (max-width: 780px) {
  .space-header,
  .hero-stage,
  .content-stack {
    padding-left: 18px;
    padding-right: 18px;
  }

  .header-tools {
    width: 100%;
    justify-content: space-between;
  }

  .back-link {
    flex: 1;
  }

  .copy-column h1 {
    font-size: clamp(46px, 15vw, 74px);
  }

  .orbit-label {
    font-size: 12px;
  }

  .mock-prompt-card,
  .mock-side-block,
  .mock-stream-card {
    padding: 18px;
    border-radius: 18px;
  }
}
</style>



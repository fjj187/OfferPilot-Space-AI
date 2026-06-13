<script setup lang="ts">
import type { InterviewMessage } from '@/types/message'
import type { PersistedInterviewFeedbackStyle, PersistedPracticePlan } from '@/types/workbench'
import {
  type MockInterviewQuestionThread,
  feedbackStyleLabelMap
} from '@/composables/showcase/useMockInterviewSpaceMockState'
import { MATERIAL_BASIS_MARKER, resolveThreadDisplayPrompt } from '@/services/material/material-prompt'
import Pagination from '@/components/Pagination/index.vue'
import MessageList from '@/components/message/MessageList.vue'
import AnswerInputPanel from '@/components/mock-interview/AnswerInputPanel.vue'
import SpaceSceneHeader from '@/components/showcase/mock-interview-space/SpaceSceneHeader.vue'

const props = defineProps<{
  navLabel: string
  sectionTitle: string
  sectionBody: string
  panelMeta: string[]
  feedbackStyle: PersistedInterviewFeedbackStyle
  allMessages: InterviewMessage[]
  sourceMeta: string[]
  knowledgeTags: string[]
  questionThreads: MockInterviewQuestionThread[]
  activeQuestionThreadId: string
  isViewingHistoryPreview: boolean
  questionPrompt: string
  hintText: string
  hintLabel: string
  questionReference: string
  messages: InterviewMessage[]
  answeredCount: number
  currentQuestionPosition: number
  hasNextQuestion: boolean
  hasRecentHistory: boolean
  isAwaitingSetup: boolean
  practicePlan: PersistedPracticePlan | null
  streamMode: string
  streamModeLabel: string
  scrollVersion?: string
  answerDraft: string
  submitted: boolean
  totalCount: number
  generatedThreadCount: number
  streaming: boolean
  streamError?: string
  sessionStatusText: string
}>()

const emit = defineEmits<{
  'update:answerDraft': [value: string]
  'update:feedbackStyle': [value: PersistedInterviewFeedbackStyle]
  submit: []
  finish: []
  nextQuestion: []
  clear: []
  clearHistory: []
  openLibrary: []
  openHistory: []
  openPractice: []
  stop: []
  selectQuestionThread: [value: string]
}>()

interface FeedbackStyleOption {
  value: PersistedInterviewFeedbackStyle
  label: string
  description: string
}

interface MetaChip {
  key: string
  label: string
  displayLabel: string
  priority: number
  tone?: 'source' | 'document' | 'topic' | 'knowledge'
}

interface TopicKnowledgeEntry {
  key: string
  label: string
  value: string
  tone: 'topic' | 'knowledge'
}

interface TopicKnowledgePopoverStyle {
  top: string
  left: string
  width: string
}

interface MetaDetailState {
  key: string
  label: string
  title: string
}

const metaPriorityMap: Record<string, number> = {
  资料: 10,
  专项: 15,
  模式: 20,
  难度: 35,
  阶段: 40,
  题源: 50,
  主题: 60,
  知识点: 70,
  类型: 80,
  命中: 90,
  命中标签: 100
}

const metaToneMap: Record<string, MetaChip['tone']> = {
  命中: 'source',
  命中标签: 'knowledge',
  题源: 'source',
  资料: 'document',
  类型: 'document',
  主题: 'topic',
  知识点: 'knowledge'
}

const metaLabelKey = (label: string) => label.split(':')[0]?.trim() || label
const metaLabelValue = (label: string) => label.split(':').slice(1).join(':').trim()

const metaValueMaxLengthMap: Partial<Record<string, number>> = {
  资料: 16,
  题源: 14,
  专项: 14,
  命中标签: 18
}

const expandableMetaKeys = new Set(['资料', '题源', '专项', '命中标签'])

const formatMetaChipLabel = (label: string) => {
  const key = metaLabelKey(label)
  const value = metaLabelValue(label)
  const maxLength = metaValueMaxLengthMap[key]
  if (!value || !maxLength || value.length <= maxLength) {
    return label
  }

  return `${ key }: ${ value.slice(0, maxLength) }...`
}

const normalizeMetaChip = (label: string, fallbackIndex: number): MetaChip => {
  const key = metaLabelKey(label)
  return {
    key: `meta-${ key }-${ label }`,
    label,
    displayLabel: formatMetaChipLabel(label),
    priority: metaPriorityMap[key] || 100 + fallbackIndex,
    tone: metaToneMap[key]
  }
}

const topicKnowledgeShellRef = ref<HTMLElement | null>(null)
const topicKnowledgeTriggerRef = ref<HTMLElement | null>(null)
const topicKnowledgePopoverRef = ref<HTMLElement | null>(null)
const isTopicKnowledgeOpen = ref(false)
const metaChipTriggerRefs = ref<Record<string, HTMLElement | null>>({})
const metaDetailPopoverRef = ref<HTMLElement | null>(null)
const activeMetaDetail = ref<MetaDetailState | null>(null)
const metaDetailPopoverStyle = ref<TopicKnowledgePopoverStyle>({
  top: '0px',
  left: '0px',
  width: '340px'
})
const topicKnowledgePopoverStyle = ref<TopicKnowledgePopoverStyle>({
  top: '0px',
  left: '0px',
  width: '340px'
})

const topicKnowledgeEntries = computed<TopicKnowledgeEntry[]>(() => {
  const seenValues = new Set<string>()
  const orderedLabels = [
    ...props.sourceMeta,
    ...props.panelMeta,
    ...props.knowledgeTags.map(item => `知识点: ${ item }`)
  ]

  return orderedLabels
    .map((item, index) => {
      const key = metaLabelKey(item)
      const value = metaLabelValue(item)
      if (!value || (key !== '主题' && key !== '知识点')) {
        return null
      }

      const normalizedValue = value.toLocaleLowerCase()
      if (seenValues.has(normalizedValue)) {
        return null
      }

      seenValues.add(normalizedValue)
      return {
        key: `topic-knowledge-${ key }-${ index }`,
        label: key,
        value,
        tone: key === '主题' ? 'topic' : 'knowledge'
      } satisfies TopicKnowledgeEntry
    })
    .filter((item): item is TopicKnowledgeEntry => Boolean(item))
})

const visibleMetaChips = computed<MetaChip[]>(() => {
  if (viewState.value.isAwaitingSetup) {
    return []
  }
  const seenLabels = new Set<string>()
  const orderedLabels = [
    ...props.panelMeta,
    ...props.sourceMeta
  ]

  const chips = orderedLabels
    .map((item, index) => normalizeMetaChip(item, index))
    .filter(item => item.tone !== 'topic' && item.tone !== 'knowledge')
    .sort((first, second) => first.priority - second.priority)
    .filter((item) => {
      if (seenLabels.has(item.label)) {
        return false
      }

      seenLabels.add(item.label)
      return true
    })

  return chips
})

const topicKnowledgeChipLabel = computed(() => {
  if (viewState.value.isAwaitingSetup) {
    return ''
  }
  const count = topicKnowledgeEntries.value.length
  if (!count) {
    return '主题 / 知识点'
  }

  return `主题 / 知识点 · ${ count }`
})

const isMetaChipExpandable = (item: MetaChip) => {
  const key = metaLabelKey(item.label)
  return expandableMetaKeys.has(key) || item.displayLabel !== item.label
}

const setMetaChipTriggerRef = (key: string, el: Element | null) => {
  metaChipTriggerRefs.value[key] = el as HTMLElement | null
}

const syncTopicKnowledgePopoverPosition = async () => {
  if (!isTopicKnowledgeOpen.value || !topicKnowledgeTriggerRef.value) return
  await nextTick()
  const triggerRect = topicKnowledgeTriggerRef.value.getBoundingClientRect()
  const popoverEl = topicKnowledgePopoverRef.value
  const viewportWidth = window.innerWidth
  const targetWidth = Math.min(340, Math.max(280, triggerRect.width))
  const renderedWidth = popoverEl?.offsetWidth || targetWidth
  const width = Math.min(renderedWidth, viewportWidth - 24)
  const left = Math.min(
    Math.max(12, triggerRect.right - width),
    viewportWidth - width - 12
  )
  const popoverHeight = popoverEl?.offsetHeight || 160
  const top = Math.max(12, triggerRect.top - popoverHeight - 12)

  topicKnowledgePopoverStyle.value = {
    top: `${ top }px`,
    left: `${ left }px`,
    width: `${ width }px`
  }
}

const syncMetaDetailPopoverPosition = async () => {
  if (!activeMetaDetail.value) return
  const triggerEl = metaChipTriggerRefs.value[activeMetaDetail.value.key]
  if (!triggerEl) return
  await nextTick()
  const triggerRect = triggerEl.getBoundingClientRect()
  const popoverEl = metaDetailPopoverRef.value
  const viewportWidth = window.innerWidth
  const targetWidth = Math.min(360, Math.max(300, triggerRect.width + 24))
  const renderedWidth = popoverEl?.offsetWidth || targetWidth
  const width = Math.min(renderedWidth, viewportWidth - 24)
  const left = Math.min(
    Math.max(12, triggerRect.right - width),
    viewportWidth - width - 12
  )
  const popoverHeight = popoverEl?.offsetHeight || 120
  const top = Math.max(12, triggerRect.top - popoverHeight - 12)

  metaDetailPopoverStyle.value = {
    top: `${ top }px`,
    left: `${ left }px`,
    width: `${ width }px`
  }
}

const closeTopicKnowledge = () => {
  isTopicKnowledgeOpen.value = false
}

const closeMetaDetail = () => {
  activeMetaDetail.value = null
}

const toggleTopicKnowledge = () => {
  if (!topicKnowledgeEntries.value.length) return
  closeMetaDetail()
  isTopicKnowledgeOpen.value = !isTopicKnowledgeOpen.value
  if (isTopicKnowledgeOpen.value) {
    void syncTopicKnowledgePopoverPosition()
  }
}

const toggleMetaDetail = (item: MetaChip) => {
  if (!isMetaChipExpandable(item)) return
  closeTopicKnowledge()
  activeMetaDetail.value = activeMetaDetail.value?.key === item.key
    ? null
    : {
      key: item.key,
      label: item.label,
      title: metaLabelKey(item.label)
    }
  if (activeMetaDetail.value) {
    void syncMetaDetailPopoverPosition()
  }
}

const handleTopicKnowledgeViewportChange = () => {
  if (isTopicKnowledgeOpen.value) {
    void syncTopicKnowledgePopoverPosition()
  }
  if (activeMetaDetail.value) {
    void syncMetaDetailPopoverPosition()
  }
}

const handleTopicKnowledgeDocumentPointerDown = (event: Event) => {
  const target = event.target as Node | null
  if (!target) return
  if (topicKnowledgeShellRef.value?.contains(target)) return
  if (topicKnowledgePopoverRef.value?.contains(target)) return
  const metaChipElements = Object.values(metaChipTriggerRefs.value).filter(Boolean) as HTMLElement[]
  if (metaChipElements.some(element => element.contains(target))) return
  if (metaDetailPopoverRef.value?.contains(target)) return
  closeTopicKnowledge()
  closeMetaDetail()
}

const feedbackStyleOptions: FeedbackStyleOption[] = [
  {
    value: 'followup',
    label: feedbackStyleLabelMap.followup,
    description: '更像真实面试官，优先连续追问。'
  },
  {
    value: 'corrective',
    label: feedbackStyleLabelMap.corrective,
    description: '先指出回答和资料重点哪里没对齐。'
  },
  {
    value: 'guided',
    label: feedbackStyleLabelMap.guided,
    description: '先提醒资料重点，再继续往下问。'
  }
]

const isQuestionHistoryView = ref(true)
const isSessionFullscreen = ref(false)
const sessionFullscreenPhase = ref<'idle' | 'entering' | 'leaving'>('idle')
const sessionFullscreenTransitionMs = 320
let sessionFullscreenTransitionTimer: ReturnType<typeof setTimeout> | null = null
const isClearHistoryConfirmVisible = ref(false)
const historyCurrentPage = ref(1)
const finishSnapshot = ref<null | {
  allMessages: InterviewMessage[]
  messages: InterviewMessage[]
  questionThreads: MockInterviewQuestionThread[]
  activeQuestionThreadId: string
  questionPrompt: string
  hintText: string
  answeredCount: number
  currentQuestionPosition: number
  hasNextQuestion: boolean
  hasRecentHistory: boolean
  isAwaitingSetup: boolean
  practicePlan: PersistedPracticePlan | null
  streamMode: string
  streamModeLabel: string
  scrollVersion?: string
  answerDraft: string
  submitted: boolean
  totalCount: number
  generatedThreadCount: number
  streaming: boolean
  streamError?: string
  sessionStatusText: string
}>(null)

const viewState = computed(() => {
  return finishSnapshot.value || {
    allMessages: props.allMessages,
    messages: props.messages,
    questionThreads: props.questionThreads,
    activeQuestionThreadId: props.activeQuestionThreadId,
    questionPrompt: props.questionPrompt,
    hintText: props.hintText,
    answeredCount: props.answeredCount,
    currentQuestionPosition: props.currentQuestionPosition,
    hasNextQuestion: props.hasNextQuestion,
    hasRecentHistory: props.hasRecentHistory,
    isAwaitingSetup: props.isAwaitingSetup,
    practicePlan: props.practicePlan,
    streamMode: props.streamMode,
    streamModeLabel: props.streamModeLabel,
    scrollVersion: props.scrollVersion,
    answerDraft: props.answerDraft,
    submitted: props.submitted,
    totalCount: props.totalCount,
    generatedThreadCount: props.generatedThreadCount,
    streaming: props.streaming,
    streamError: props.streamError,
    sessionStatusText: props.sessionStatusText
  }
})

const activeQuestionThread = computed(() => {
  return viewState.value.questionThreads.find(item => item.id === viewState.value.activeQuestionThreadId) || viewState.value.questionThreads[0] || null
})

const questionThreadCards = computed(() => {
  return viewState.value.questionThreads.map((item) => {
    const threadMessages = viewState.value.allMessages.filter(message => message.threadId === item.id)
    const hasReply = threadMessages.some(message => message.role === 'user')
    const isLocked = item.order >= viewState.value.generatedThreadCount
      && item.id !== viewState.value.activeQuestionThreadId
      && !hasReply
    return {
      ...item,
      statusLabel: item.id === viewState.value.activeQuestionThreadId
        ? '当前作答'
        : hasReply
          ? '已回答'
          : isLocked
            ? '待解锁'
            : '未回答',
      preview: resolveThreadDisplayPrompt(item),
      isLocked
    }
  })
})

const historyPageSize = 4

const historyPageCount = computed(() => {
  return Math.max(1, Math.ceil(questionThreadCards.value.length / historyPageSize))
})

const pagedQuestionThreadCards = computed(() => {
  const startIndex = (historyCurrentPage.value - 1) * historyPageSize
  return questionThreadCards.value.slice(startIndex, startIndex + historyPageSize)
})

const historyPlaceholderItems = computed(() => {
  const placeholderCount = Math.max(0, historyPageSize - pagedQuestionThreadCards.value.length)
  return Array.from({
    length: placeholderCount
  }, (_, index) => `history-placeholder-${ index }`)
})

const openQuestionThread = (threadId: string) => {
  const target = questionThreadCards.value.find(item => item.id === threadId)
  if (target?.isLocked) return
  emit('selectQuestionThread', threadId)
  isQuestionHistoryView.value = false
}

const displayQuestionInstruction = computed(() => {
  const thread = activeQuestionThread.value
  const instruction = thread
    ? resolveThreadDisplayPrompt(thread)
    : viewState.value.questionPrompt
  if (!instruction) return ''
  return instruction.replace(/\n{3,}/g, '\n\n').trim()
})

interface QuestionSideCard {
  label: string
  body: string
  kind: 'reference' | 'hint'
}

/** 专项补练入口与资料刷题一致：侧栏只保留作答建议 + 面试风格，资料依据仅在资料刷题展示 */
const showQuestionReferenceCard = computed(() => (
  !props.practicePlan
  && Boolean(props.questionReference.replace(MATERIAL_BASIS_MARKER, '').trim())
))

const questionSideCards = computed(() => {
  const cards: QuestionSideCard[] = []
  const reference = props.questionReference.replace(MATERIAL_BASIS_MARKER, '').trim()
  const hint = viewState.value.hintText.trim()
  const instruction = displayQuestionInstruction.value

  if (showQuestionReferenceCard.value) {
    cards.push({
      label: '资料依据',
      body: reference,
      kind: 'reference'
    })
  }
  if (hint && hint !== instruction) {
    cards.push({
      label: props.hintLabel || '作答建议',
      body: hint,
      kind: 'hint'
    })
  }
  return cards
})

const showStandaloneHint = computed(() => {
  const hint = viewState.value.hintText.trim()
  if (!hint) return false
  return !questionSideCards.value.some(card => card.body === hint)
})

const syncSessionFullscreenLock = (active: boolean) => {
  document.documentElement.classList.toggle('mock-session-is-fullscreen', active)
}

const clearSessionFullscreenTransitionTimer = () => {
  if (!sessionFullscreenTransitionTimer) return
  window.clearTimeout(sessionFullscreenTransitionTimer)
  sessionFullscreenTransitionTimer = null
}

const enterSessionFullscreen = () => {
  if (isSessionFullscreen.value || sessionFullscreenPhase.value === 'entering') return
  clearSessionFullscreenTransitionTimer()
  closeTopicKnowledge()
  closeMetaDetail()
  isSessionFullscreen.value = true
  sessionFullscreenPhase.value = 'entering'
  syncSessionFullscreenLock(true)
  sessionFullscreenTransitionTimer = window.setTimeout(() => {
    sessionFullscreenPhase.value = 'idle'
    sessionFullscreenTransitionTimer = null
  }, sessionFullscreenTransitionMs)
}

const exitSessionFullscreen = () => {
  if (!isSessionFullscreen.value || sessionFullscreenPhase.value === 'leaving') return
  clearSessionFullscreenTransitionTimer()
  sessionFullscreenPhase.value = 'leaving'
  sessionFullscreenTransitionTimer = window.setTimeout(() => {
    isSessionFullscreen.value = false
    sessionFullscreenPhase.value = 'idle'
    syncSessionFullscreenLock(false)
    sessionFullscreenTransitionTimer = null
  }, sessionFullscreenTransitionMs)
}

const toggleSessionFullscreen = () => {
  if (isSessionFullscreen.value) {
    exitSessionFullscreen()
    return
  }
  enterSessionFullscreen()
}

const handleSessionFullscreenEscape = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !isSessionFullscreen.value) return
  exitSessionFullscreen()
}

const openClearHistoryConfirm = () => {
  if (viewState.value.streaming) return
  isClearHistoryConfirmVisible.value = true
}

const closeClearHistoryConfirm = () => {
  isClearHistoryConfirmVisible.value = false
}

const confirmClearHistory = () => {
  isQuestionHistoryView.value = true
  emit('clearHistory')
  closeClearHistoryConfirm()
}

const handleFinish = () => {
  if (props.isViewingHistoryPreview) {
    window.$ModalMessage?.warning?.('当前正在查看历史记录，请先返回当前训练后再结束本轮。', {
      duration: 2200,
      closable: false
    })
    return
  }
  finishSnapshot.value = {
    allMessages: [...props.allMessages],
    messages: [...props.messages],
    questionThreads: props.questionThreads.map(item => ({
      ...item
    })),
    activeQuestionThreadId: props.activeQuestionThreadId,
    questionPrompt: props.questionPrompt,
    hintText: props.hintText,
    answeredCount: props.answeredCount,
    currentQuestionPosition: props.currentQuestionPosition,
    hasNextQuestion: props.hasNextQuestion,
    hasRecentHistory: props.hasRecentHistory,
    isAwaitingSetup: props.isAwaitingSetup,
    practicePlan: props.practicePlan ? {
      ...props.practicePlan
    } : null,
    streamMode: props.streamMode,
    streamModeLabel: props.streamModeLabel,
    scrollVersion: props.scrollVersion,
    answerDraft: props.answerDraft,
    submitted: props.submitted,
    totalCount: props.totalCount,
    generatedThreadCount: props.generatedThreadCount,
    streaming: props.streaming,
    streamError: props.streamError,
    sessionStatusText: props.sessionStatusText
  }
  emit('finish')
}

watch(isTopicKnowledgeOpen, (open) => {
  if (!open) return
  void syncTopicKnowledgePopoverPosition()
})

watch(activeMetaDetail, (detail) => {
  if (!detail) return
  void syncMetaDetailPopoverPosition()
})

watch(
  () => props.isAwaitingSetup,
  (isAwaitingSetup) => {
    if (isAwaitingSetup) {
      isQuestionHistoryView.value = true
    }
  },
  {
    immediate: true
  }
)

watch(
  () => props.activeQuestionThreadId,
  (threadId) => {
    if (!threadId) {
      isQuestionHistoryView.value = true
    }
  }
)

watch(questionThreadCards, (cards) => {
  const nextPageCount = Math.max(1, Math.ceil(cards.length / historyPageSize))
  if (historyCurrentPage.value > nextPageCount) {
    historyCurrentPage.value = nextPageCount
  }
}, {
  immediate: true
})

watch(
  () => [viewState.value.activeQuestionThreadId, questionThreadCards.value] as const,
  ([activeThreadId, cards]) => {
    if (!activeThreadId || !cards.length) return
    const activeIndex = cards.findIndex(item => item.id === activeThreadId)
    if (activeIndex < 0) return
    historyCurrentPage.value = Math.floor(activeIndex / historyPageSize) + 1
  },
  {
    immediate: true,
    deep: true
  }
)

onMounted(() => {
  document.addEventListener('pointerdown', handleTopicKnowledgeDocumentPointerDown)
  window.addEventListener('resize', handleTopicKnowledgeViewportChange)
  window.addEventListener('scroll', handleTopicKnowledgeViewportChange, true)
  document.addEventListener('keydown', handleSessionFullscreenEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleTopicKnowledgeDocumentPointerDown)
  window.removeEventListener('resize', handleTopicKnowledgeViewportChange)
  window.removeEventListener('scroll', handleTopicKnowledgeViewportChange, true)
  document.removeEventListener('keydown', handleSessionFullscreenEscape)
  clearSessionFullscreenTransitionTimer()
  isSessionFullscreen.value = false
  sessionFullscreenPhase.value = 'idle'
  syncSessionFullscreenLock(false)
})

</script>

<template>
  <div
    class="mock-scene-shell"
    :class="{ 'is-session-fullscreen': isSessionFullscreen }"
  >
    <div
      v-show="!isSessionFullscreen"
      class="mock-scene-header-wrap"
    >
      <SpaceSceneHeader
        :title="sectionTitle"
        :body="sectionBody"
        aside-min-width="560px"
      >
        <template #aside>
          <div class="mock-meta-row">
            <span
              v-for="item in visibleMetaChips"
              :key="item.key"
              :ref="(el) => setMetaChipTriggerRef(item.key, el)"
              class="mock-meta-chip"
              :class="{
                'is-expandable': isMetaChipExpandable(item),
                'is-open': activeMetaDetail?.key === item.key,
                'is-source': item.tone === 'source',
                'is-document': item.tone === 'document',
                'is-topic': item.tone === 'topic',
                'is-knowledge': item.tone === 'knowledge'
              }"
              :title="isMetaChipExpandable(item) ? item.label : undefined"
              @click="toggleMetaDetail(item)"
            >
              <span class="mock-meta-chip-text">{{ item.displayLabel }}</span>
              <span
                v-if="isMetaChipExpandable(item)"
                class="mock-meta-chip-expand"
                :class="{ 'is-open': activeMetaDetail?.key === item.key }"
                aria-hidden="true"
              >+</span>
            </span>
            <div
              v-if="!isAwaitingSetup && topicKnowledgeEntries.length"
              ref="topicKnowledgeShellRef"
              class="mock-meta-popover-shell"
            >
              <button
                ref="topicKnowledgeTriggerRef"
                type="button"
                class="mock-meta-chip mock-meta-trigger"
                :class="{ 'is-open': isTopicKnowledgeOpen }"
                @click="toggleTopicKnowledge"
              >
                <span class="mock-meta-chip-text">{{ topicKnowledgeChipLabel }}</span>
                <span
                  class="mock-meta-trigger-arrow"
                  :class="{ 'is-open': isTopicKnowledgeOpen }"
                  aria-hidden="true"
                >+</span>
              </button>
              <Teleport to="body">
                <Transition name="mock-meta-popover-fade">
                  <div
                    v-if="isTopicKnowledgeOpen"
                    ref="topicKnowledgePopoverRef"
                    class="mock-meta-popover"
                    :style="topicKnowledgePopoverStyle"
                  >
                    <div class="mock-meta-popover-title">主题与知识点</div>
                    <div class="mock-meta-popover-list">
                      <span
                        v-for="item in topicKnowledgeEntries"
                        :key="item.key"
                        class="mock-meta-popover-item"
                        :class="{
                          'is-topic': item.tone === 'topic',
                          'is-knowledge': item.tone === 'knowledge'
                        }"
                      >
                        {{ item.label }}: {{ item.value }}
                      </span>
                    </div>
                  </div>
                </Transition>
              </Teleport>
            </div>
          </div>
          <Teleport to="body">
            <Transition name="mock-meta-popover-fade">
              <div
                v-if="activeMetaDetail"
                ref="metaDetailPopoverRef"
                class="mock-meta-popover"
                :style="metaDetailPopoverStyle"
              >
                <div class="mock-meta-popover-title">{{ activeMetaDetail.title }}</div>
                <div class="mock-meta-detail-copy">{{ activeMetaDetail.label }}</div>
              </div>
            </Transition>
          </Teleport>
        </template>
      </SpaceSceneHeader>
    </div>

    <Teleport to="body" :disabled="!isSessionFullscreen">
      <div
        class="mock-live-shell"
        :class="{ 'is-fullscreen': isSessionFullscreen }"
      >
        <section
          class="mock-session-card"
          :class="{
            'is-fullscreen': isSessionFullscreen,
            'is-fullscreen-entering': sessionFullscreenPhase === 'entering',
            'is-fullscreen-leaving': sessionFullscreenPhase === 'leaving'
          }"
        >
        <div class="mock-session-layout">
          <div
            class="mock-conversation-shell"
            :class="{ 'has-history-actions': isQuestionHistoryView }"
          >
            <div class="mock-conversation-head">
              <div class="mock-conversation-head-top">
                <div class="mock-conversation-label">问答内容区</div>
                <div
                  v-if="!viewState.isAwaitingSetup"
                  class="mock-conversation-head-meta"
                >
                  <button
                    type="button"
                    class="mock-fullscreen-button"
                    :aria-label="isSessionFullscreen ? '退出全屏' : '全屏'"
                    :title="isSessionFullscreen ? '退出全屏' : '全屏'"
                    @click="toggleSessionFullscreen"
                  >
                    <svg
                      v-if="!isSessionFullscreen"
                      class="mock-fullscreen-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.8"
                      />
                    </svg>
                    <svg
                      v-else
                      class="mock-fullscreen-icon"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M9 4H4v5M20 9V4h-5M4 15v5h5M15 20h5v-5"
                        fill="none"
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.8"
                      />
                    </svg>
                  </button>
                  <button
                    v-if="!isQuestionHistoryView && viewState.totalCount > 1"
                    type="button"
                    class="mock-history-back-button"
                    @click="isQuestionHistoryView = true"
                  >
                    返回问题历史
                  </button>
                  <span
                    class="mock-stream-mode-pill"
                    :class="{ 'is-remote': viewState.streamMode === 'remote', 'is-mock': viewState.streamMode === 'mock' }"
                  >
                    {{ viewState.streamModeLabel }}
                  </span>
                  <span class="mock-session-pill">
                    {{ viewState.currentQuestionPosition }} / {{ viewState.totalCount || 0 }} 题
                  </span>
                </div>
              </div>
            </div>
            <div
              class="mock-conversation-body"
              :class="{ 'has-dialogue-frame': !viewState.isAwaitingSetup && !isQuestionHistoryView }"
            >
              <p
                v-if="!viewState.isAwaitingSetup && !isQuestionHistoryView && activeQuestionThread"
                class="mock-thread-caption"
              >
                {{ activeQuestionThread.title }}
              </p>
              <div
                v-if="viewState.isAwaitingSetup"
                class="mock-empty-state"
              >
                <div class="mock-empty-orb"></div>
                <strong>从这里开始你的回答</strong>
                <p>请先去资料页或专项刷题页选择对应资料或题型，再回来开始面试。</p>
                <div class="mock-empty-actions">
                  <button
                    type="button"
                    class="mock-empty-action primary"
                    @click="emit('openLibrary')"
                  >
                    去资料页
                  </button>
                  <button
                    type="button"
                    class="mock-empty-action"
                    @click="emit('openPractice')"
                  >
                    去专项刷题页
                  </button>
                  <button
                    type="button"
                    class="mock-empty-action"
                    @click="emit('openHistory')"
                  >
                    查看上次模拟面试历史
                  </button>
                </div>
              </div>
              <div
                v-else-if="isQuestionHistoryView"
                class="mock-thread-history"
              >
                <button
                  v-for="item in pagedQuestionThreadCards"
                  :key="item.id"
                  type="button"
                  class="mock-thread-card"
                  :class="{ 'is-locked': item.isLocked }"
                  :disabled="item.isLocked"
                  @click="openQuestionThread(item.id)"
                >
                  <div class="mock-thread-card-head">
                    <strong>{{ item.title }}</strong>
                    <span>{{ item.statusLabel }}</span>
                  </div>
                  <p>{{ item.preview }}</p>
                </button>
                <div
                  v-for="placeholder in historyPlaceholderItems"
                  :key="placeholder"
                  class="mock-thread-card mock-thread-card-placeholder"
                  aria-hidden="true"
                ></div>
              </div>
              <div
                v-else-if="!isQuestionHistoryView"
                class="mock-dialogue-pane"
              >
                <MessageList
                  :messages="viewState.messages"
                  :scroll-version="viewState.scrollVersion"
                />
                <div
                  v-if="viewState.streamError"
                  class="mock-stream-error"
                >
                  {{ viewState.streamError }}
                </div>
              </div>
            </div>
            <div
              v-if="isQuestionHistoryView && historyPageCount > 1"
              class="mock-conversation-actions is-history-view"
            >
              <div class="mock-thread-pagination-row">
                <Pagination
                  :page="historyCurrentPage"
                  :page-count="historyPageCount"
                  @update:page="historyCurrentPage = $event"
                  @change="historyCurrentPage = $event"
                />
              </div>
            </div>
          </div>

          <aside class="mock-side-column">
            <div class="mock-side-top-stack">
              <div
                class="mock-side-guide-panel"
                :class="{
                  'is-empty': viewState.isAwaitingSetup,
                  'is-practice-entry': Boolean(viewState.practicePlan && !viewState.isAwaitingSetup)
                }"
              >
                <template v-if="viewState.isAwaitingSetup">
                  <section class="mock-side-guide-section mock-question-info is-empty">
                    <div class="mock-side-label">提示</div>
                    <p>完成资料或题型选择后，系统会在左侧对话区展示题目并开放作答。</p>
                  </section>
                </template>
                <template v-else>
                  <div class="mock-side-guide-scroll">
                    <section
                      v-for="card in questionSideCards"
                      :key="card.label"
                      class="mock-side-guide-section mock-question-requirement-card"
                      :class="{
                        'is-reference-card': card.kind === 'reference',
                        'is-hint-card': card.kind === 'hint',
                        'is-feedback-card': card.label === '本轮回馈'
                      }"
                    >
                      <div class="mock-side-label">{{ card.label }}</div>
                      <p
                        class="mock-prompt-body"
                        :class="{
                          'is-reference-clamp': card.kind === 'reference',
                          'is-hint-clamp': card.kind === 'hint'
                        }"
                      >
                        {{ card.body }}
                      </p>
                    </section>

                    <section
                      v-if="showStandaloneHint"
                      class="mock-side-guide-section mock-question-info"
                    >
                      <div class="mock-side-label">提示</div>
                      <p>{{ viewState.hintText }}</p>
                    </section>
                  </div>

                  <section class="mock-side-guide-section mock-feedback-style-section">
                    <div class="mock-side-label">面试风格</div>
                    <div class="mock-feedback-style-group">
                      <button
                        v-for="option in feedbackStyleOptions"
                        :key="option.value"
                        type="button"
                        class="mock-feedback-style-button"
                        :class="{ 'is-active': props.feedbackStyle === option.value }"
                        :disabled="viewState.streaming"
                        @click="$emit('update:feedbackStyle', option.value)"
                      >
                        <strong>{{ option.label }}</strong>
                        <span>{{ option.description }}</span>
                      </button>
                    </div>
                  </section>
                </template>
              </div>
            </div>

            <div
              v-if="viewState.isAwaitingSetup"
              class="mock-draft-empty mock-draft-slot"
            >
              <strong>你的回答草稿</strong>
              <p>当前未开始面试，暂不开放回答输入。</p>
            </div>
            <div
              v-else
              class="mock-draft-shell mock-draft-slot"
            >
              <AnswerInputPanel
                :value="viewState.answerDraft"
                :submitted="viewState.submitted"
                :streaming="viewState.streaming"
                variant="space"
                @update:value="emit('update:answerDraft', $event)"
                @submit="emit('submit')"
                @clear="emit('clear')"
                @stop="emit('stop')"
              />
            </div>
          </aside>
        </div>

        <Transition name="mock-confirm-fade">
          <div
            v-if="isClearHistoryConfirmVisible"
            class="mock-confirm-overlay"
            @click.self="closeClearHistoryConfirm"
          >
            <div class="mock-confirm-dialog">
              <div class="mock-confirm-title">确认清空对话历史？</div>
              <p>清空后会删除当前对话与进行中的面试进度；已生成的复盘报告和专项训练入口会保留。</p>
              <div class="mock-confirm-actions">
                <button
                  type="button"
                  class="mock-confirm-button is-danger"
                  @click="confirmClearHistory"
                >
                  确认清空
                </button>
                <button
                  type="button"
                  class="mock-confirm-button"
                  @click="closeClearHistoryConfirm"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <div class="mock-session-footer">
          <button
            type="button"
            class="mock-secondary-button"
            :disabled="props.isViewingHistoryPreview || viewState.streaming || !viewState.hasNextQuestion || viewState.isAwaitingSetup"
            @click="emit('nextQuestion')"
          >
            下一题
          </button>
          <button
            type="button"
            class="mock-finish-button"
            :disabled="props.isViewingHistoryPreview || viewState.streaming || !viewState.answeredCount || viewState.isAwaitingSetup"
            @click="handleFinish"
          >
            结束本轮并查看报告
          </button>
          <button
            type="button"
            class="mock-clear-history-button"
            :disabled="viewState.streaming"
            @click="openClearHistoryConfirm"
          >
            清空对话历史
          </button>
        </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.mock-scene-shell {
  position: relative;
  z-index: 5;
  display: grid;
  gap: 24px;
}

.mock-scene-shell.is-session-fullscreen {
  gap: 0;
}

.mock-scene-header-wrap {
  min-width: 0;
}

.mock-prompt-label,
.mock-side-label,
.mock-conversation-label {
  color: var(--scene-primary);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mock-meta-row {
  position: relative;
  z-index: 9;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
  gap: 10px 12px;
  justify-content: end;
  align-content: start;
  width: 100%;
  overflow: visible;
}

.mock-meta-chip {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  min-height: 34px;
  min-width: 0;
  gap: 10px;
  padding: 0 14px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.05);
  color: rgb(245 248 255 / 0.88);
  font-size: 15px;
  font-weight: 400;
}

.mock-meta-chip.is-expandable {
  cursor: pointer;
}

.mock-meta-chip.is-expandable:hover,
.mock-meta-chip.is-expandable.is-open {
  border-color: rgb(255 255 255 / 0.24);
  background: rgb(255 255 255 / 0.09);
}

.mock-meta-chip-text {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mock-meta-chip-expand {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 15px;
  line-height: 1;
  opacity: 0.72;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.mock-meta-chip-expand.is-open {
  opacity: 0.96;
  transform: rotate(45deg);
}

.mock-meta-popover-shell {
  position: relative;
  z-index: 12;
  overflow: visible;
}

.mock-meta-chip.is-source {
  border-color: rgb(198 206 255 / 0.18);
  background: rgb(198 206 255 / 0.12);
  color: rgb(241 244 255 / 0.96);
}

.mock-meta-chip.is-document {
  border-color: rgb(168 210 255 / 0.18);
  background: rgb(96 142 188 / 0.14);
  color: rgb(236 246 255 / 0.96);
}

.mock-meta-chip.is-topic {
  border-color: rgb(255 220 150 / 0.18);
  background: rgb(166 123 52 / 0.14);
  color: rgb(255 248 232 / 0.96);
}

.mock-meta-chip.is-knowledge {
  border-color: rgb(138 236 208 / 0.2);
  background: rgb(90 146 125 / 0.14);
  color: rgb(232 255 245 / 0.96);
}

.mock-meta-trigger {
  width: 100%;
  justify-content: space-between;
  gap: 10px;
  font: inherit;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.mock-meta-trigger.is-open,
.mock-meta-trigger:hover {
  border-color: rgb(255 255 255 / 0.24);
  background: rgb(255 255 255 / 0.09);
}

.mock-meta-trigger-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 16px;
  line-height: 1;
  transition: transform 0.2s ease;
}

.mock-meta-trigger-arrow.is-open {
  transform: rotate(45deg);
}

.mock-meta-popover {
  position: fixed;
  z-index: 2000;
  min-width: 280px;
  max-width: calc(100vw - 24px);
  padding: 14px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 16px;
  background: rgb(24 20 60 / 0.96);
  box-shadow: 0 18px 40px rgb(0 0 0 / 0.26);
  backdrop-filter: blur(16px);
}

.mock-meta-popover::before {
  content: '';
  position: absolute;
  right: 18px;
  bottom: -6px;
  width: 12px;
  height: 12px;
  border-right: 1px solid rgb(255 255 255 / 0.12);
  border-bottom: 1px solid rgb(255 255 255 / 0.12);
  background: inherit;
  transform: rotate(45deg);
}

.mock-meta-popover-title {
  color: rgb(246 249 255 / 0.94);
  font-size: 14px;
  font-weight: 600;
}

.mock-meta-popover-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.mock-meta-detail-copy {
  margin-top: 10px;
  color: rgb(239 244 255 / 0.92);
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.mock-meta-popover-item {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  color: rgb(239 244 255 / 0.92);
  font-size: 14px;
  white-space: nowrap;
}

.mock-meta-popover-item.is-topic {
  border-color: rgb(255 220 150 / 0.18);
  background: rgb(166 123 52 / 0.16);
  color: rgb(255 248 232 / 0.96);
}

.mock-meta-popover-item.is-knowledge {
  border-color: rgb(138 236 208 / 0.2);
  background: rgb(90 146 125 / 0.16);
  color: rgb(232 255 245 / 0.96);
}

.mock-meta-popover-fade-enter-active,
.mock-meta-popover-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  transform-origin: bottom right;
  pointer-events: none;
}

.mock-meta-popover-fade-enter-from,
.mock-meta-popover-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.mock-live-shell {
  display: grid;
  gap: 18px;
  min-height: 0;
}

.mock-live-shell.is-fullscreen {
  position: fixed;
  inset: 12px;
  z-index: 1200;
  display: block;
}

.mock-session-card {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 2px;
  height: clamp(750px, calc(90vh - 40px), 940px);
  min-height: 750px;
  max-height: 940px;
  padding: 20px;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 20px;
  background: rgb(255 255 255 / 0.04);
  backdrop-filter: blur(14px);
}

.mock-session-card.is-fullscreen,
.mock-session-card.is-fullscreen-leaving {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: none;
  margin: 0;
  box-shadow:
    0 24px 80px rgb(8 6 24 / 0.32),
    inset 0 1px 0 rgb(255 255 255 / 0.08);
}

.mock-session-card.is-fullscreen {
  border-radius: 20px;
}

.mock-session-card.is-fullscreen-entering {
  animation: mock-session-fullscreen-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.mock-session-card.is-fullscreen-leaving {
  animation: mock-session-fullscreen-out 0.28s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes mock-session-fullscreen-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes mock-session-fullscreen-out {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

.mock-conversation-head {
  display: grid;
  gap: 6px;
}

.mock-conversation-head-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 30px;
}

.mock-conversation-head-meta {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.mock-session-layout {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(360px, 3.2fr);
  gap: 20px;
  align-items: stretch;
  min-height: 0;
  height: 100%;
}

.mock-side-column {
  --mock-draft-slot-height: 200px;
  display: grid;
  grid-template-rows: minmax(0, 1fr) var(--mock-draft-slot-height);
  gap: 12px;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.mock-side-top-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.mock-side-guide-panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  overflow: hidden;
  padding: 14px;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 20px;
  background: rgb(255 255 255 / 0.04);
}

.mock-side-guide-scroll {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  overflow: hidden auto;
}

.mock-side-guide-scroll .mock-side-guide-section + .mock-side-guide-section {
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid rgb(255 255 255 / 0.08);
}

.mock-side-guide-section {
  flex: 0 0 auto;
  min-width: 0;
  overflow: visible;
}

.mock-side-guide-section + .mock-side-guide-section {
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid rgb(255 255 255 / 0.08);
}

.mock-side-guide-panel .mock-feedback-style-section {
  display: grid;
  flex: 0 0 auto;
  gap: 10px;
  padding-top: 12px;
  padding-bottom: 2px;
  margin-top: auto;
  border-top: 1px solid rgb(255 255 255 / 0.08);
}

.mock-side-guide-panel .mock-side-label {
  flex: 0 0 auto;
  color: rgb(248 250 255 / 0.96);
  line-height: 1.35;
}

.mock-side-guide-panel .mock-question-info {
  max-height: none;
  overflow: visible;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

/* 未选资料/题型时：只加高内侧「提示」小卡片，外层 guide 面板仍占满侧栏 */
.mock-side-guide-panel.is-empty .mock-question-info.is-empty {
  min-height: 128px;
  padding: 14px 16px 20px;
  max-height: none;
  overflow: visible;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 20px;
  background: rgb(255 255 255 / 0.04);
  box-sizing: border-box;
}

.mock-side-guide-panel.is-empty .mock-question-info.is-empty p {
  margin-top: 8px;
  margin-bottom: 0;
  line-height: 1.65;
}

.mock-draft-slot {
  height: var(--mock-draft-slot-height);
  min-height: var(--mock-draft-slot-height);
  max-height: var(--mock-draft-slot-height);
  overflow: hidden;
}

.mock-question-card,
.mock-question-info,
.mock-draft-shell {
  padding: 12px 14px;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 20px;
  background: rgb(255 255 255 / 0.04);
}

.mock-question-info {
  min-height: 0;
  max-height: 112px;
  overflow: hidden;
}

.mock-side-guide-panel .mock-question-info,
.mock-side-guide-panel .mock-question-info.is-empty {
  max-height: none;
  overflow: visible;
}

.mock-conversation-body .mock-question-card {
  min-height: 0;
  max-height: none;
  margin-bottom: 10px;
  overflow: visible;
}

.mock-conversation-body .mock-prompt-body {
  max-height: 220px;
  overflow-y: auto;
}

.mock-side-guide-panel .mock-question-requirement-card {
  flex: 0 0 auto;
  min-height: 0;
  max-height: none;
  overflow: visible;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.mock-side-guide-panel .mock-question-requirement-card .mock-prompt-body:not(.is-reference-clamp, .is-hint-clamp) {
  max-height: none;
  overflow: hidden;
}

.mock-side-guide-panel .mock-question-requirement-card.is-reference-card {
  --mock-reference-line-count: 2;
}

.mock-side-guide-panel .mock-question-requirement-card.is-reference-card + .mock-question-requirement-card.is-hint-card {
  padding-top: 8px;
  margin-top: 8px;
}

.mock-side-guide-panel .mock-question-requirement-card.is-reference-card .mock-prompt-body.is-reference-clamp {
  --mock-reference-line-count: 2;
  display: -webkit-box;
  overflow: hidden;
  margin-top: 8px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--mock-reference-line-count);
  line-clamp: var(--mock-reference-line-count);
  max-height: calc(1em * 1.48 * var(--mock-reference-line-count));
  text-overflow: ellipsis;
}

.mock-side-guide-panel .mock-question-requirement-card.is-hint-card {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
}

.mock-side-guide-panel.is-practice-entry .mock-question-requirement-card.is-hint-card:first-child:not(.is-feedback-card) {
  flex: 1 1 auto;
  min-height: 0;
}

.mock-side-guide-panel.is-practice-entry .mock-question-requirement-card.is-hint-card:first-child:not(.is-feedback-card) .mock-prompt-body.is-hint-clamp {
  flex: 1 1 auto;
  display: block;
  overflow-y: auto;
  max-height: none;
  -webkit-line-clamp: unset;
  line-clamp: unset;
}

.mock-side-guide-panel .mock-question-requirement-card.is-feedback-card .mock-prompt-body.is-hint-clamp {
  --mock-hint-line-count: 10;
}

.mock-side-guide-panel.is-practice-entry .mock-question-requirement-card.is-feedback-card .mock-prompt-body.is-hint-clamp {
  flex: 0 0 auto;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 10;
  line-clamp: 10;
  max-height: calc(1em * 1.48 * 10);
}

.mock-side-guide-panel .mock-question-requirement-card.is-hint-card .mock-prompt-body.is-hint-clamp {
  --mock-hint-line-count: 5;
  flex: 0 0 auto;
  display: -webkit-box;
  overflow: hidden;
  margin-top: 8px;
  white-space: pre-line;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--mock-hint-line-count);
  line-clamp: var(--mock-hint-line-count);
  max-height: calc(1em * 1.48 * var(--mock-hint-line-count));
  text-overflow: ellipsis;
}

.mock-thread-card.is-locked,
.mock-thread-card:disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.mock-question-card {
  min-height: 126px;
  max-height: 126px;
  overflow: hidden;
}

.mock-prompt-body {
  margin-top: 8px;
  color: rgb(244 247 255 / 0.94);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.48;
}


.mock-question-info p {
  margin-top: 6px;
  color: rgb(240 245 255 / 0.92);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
}

.mock-feedback-style-card {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}

.mock-feedback-style-group {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.mock-feedback-style-button {
  display: grid;
  gap: 4px;
  min-height: 84px;
  padding: 10px 12px;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 14px;
  background: rgb(255 255 255 / 0.04);
  color: rgb(229 236 255 / 0.8);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
}

.mock-feedback-style-button strong {
  color: rgb(247 249 255 / 0.96);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
}

.mock-feedback-style-button span {
  color: rgb(223 231 252 / 0.72);
  font-size: 12px;
  line-height: 1.45;
}

.mock-feedback-style-button:hover:not(:disabled) {
  border-color: rgb(168 154 255 / 0.34);
  background: rgb(112 94 219 / 0.14);
  transform: translateY(-1px);
}

.mock-feedback-style-button.is-active {
  border-color: rgb(176 156 255 / 0.48);
  background: linear-gradient(180deg, rgb(118 97 255 / 0.26) 0%, rgb(93 73 222 / 0.22) 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08);
}

.mock-feedback-style-button:disabled {
  opacity: 0.56;
  cursor: not-allowed;
}

.mock-conversation-shell {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  padding: 22px 22px 22px 26px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 24px;
  background: linear-gradient(180deg, rgb(88 80 154 / 0.32) 0%, rgb(64 57 126 / 0.24) 100%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08);
}

.mock-conversation-shell.has-history-actions {
  grid-template-rows: auto minmax(0, 1fr) auto;
}

.mock-conversation-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.mock-conversation-body.has-dialogue-frame {
  gap: 10px;
}

.mock-dialogue-pane {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  overscroll-behavior: contain;
  border-top: 1px solid rgb(255 255 255 / 0.1);
  border-bottom: 1px solid rgb(255 255 255 / 0.1);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.04),
    inset 0 -1px 0 rgb(255 255 255 / 0.04);
}

.mock-conversation-body.has-dialogue-frame .mock-thread-caption {
  flex-shrink: 0;
}

.mock-conversation-label {
  color: rgb(92 82 152 / 0.92);
}

.mock-thread-caption {
  margin: 0;
  color: rgb(245 248 255 / 0.96);
  font-size: 18px;
  line-height: 1.45;
}

.mock-session-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
  color: rgb(235 241 255 / 0.84);
  font-size: 14px;
}

.mock-stream-mode-pill {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.05);
  color: rgb(231 237 255 / 0.82);
  font-size: 13px;
  white-space: nowrap;
}

.mock-fullscreen-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  min-width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.05);
  color: rgb(238 243 255 / 0.9);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.mock-fullscreen-button:hover {
  border-color: rgb(255 255 255 / 0.22);
  background: rgb(255 255 255 / 0.09);
  transform: translateY(-1px);
}

.mock-fullscreen-icon {
  width: 15px;
  height: 15px;
}

.mock-history-back-button {
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.05);
  color: rgb(238 243 255 / 0.9);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.mock-history-back-button:hover {
  border-color: rgb(255 255 255 / 0.22);
  background: rgb(255 255 255 / 0.09);
  transform: translateY(-1px);
}

.mock-stream-mode-pill.is-remote {
  border-color: rgb(139 246 220 / 0.24);
  background: rgb(77 130 118 / 0.18);
  color: rgb(230 255 247 / 0.98);
}

.mock-stream-mode-pill.is-mock {
  border-color: rgb(160 188 255 / 0.22);
  background: rgb(92 82 152 / 0.18);
  color: rgb(239 243 255 / 0.96);
}

.mock-stream-error {
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid rgb(255 186 186 / 0.2);
  border-radius: 14px;
  background: rgb(255 112 112 / 0.08);
  color: rgb(255 219 219 / 0.94);
  font-size: 15px;
  font-weight: 400;
  line-height: 1.7;
}

.mock-thread-history {
  display: grid;
  grid-template-rows: repeat(4, minmax(96px, auto));
  align-content: start;
  gap: 18px;
  min-height: 0;
  height: auto;
  padding: 8px 8px 16px 0;
  overflow: hidden;
}

.mock-conversation-actions.is-history-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding-top: 4px;
}

.mock-empty-state {
  display: grid;
  align-content: center;
  justify-items: center;
  min-height: 420px;
  padding: 32px 24px;
  text-align: center;
}

.mock-empty-orb {
  width: 84px;
  aspect-ratio: 1;
  margin-bottom: 20px;
  border-radius: 999px;
  background: radial-gradient(circle at 34% 28%, rgb(255 255 255 / 0.94) 0%, rgb(214 198 255 / 0.92) 20%, rgb(171 146 255 / 0.72) 48%, rgb(120 101 220 / 0.34) 76%, rgb(120 101 220 / 0.08) 100%);
  box-shadow:
    0 0 0 10px rgb(198 176 255 / 0.06),
    0 22px 48px rgb(32 16 82 / 0.24);
}

.mock-empty-state strong {
  color: rgb(248 250 255 / 0.96);
  font-size: 20px;
  font-weight: 700;
}

.mock-empty-state p {
  max-width: 560px;
  margin: 14px 0 0;
  color: rgb(224 230 248 / 0.72);
  font-size: 15px;
  line-height: 1.85;
}

.mock-empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 22px;
}

.mock-empty-action {
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
  color: rgb(243 247 255 / 0.92);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.mock-empty-action:hover {
  border-color: rgb(255 255 255 / 0.22);
  background: rgb(255 255 255 / 0.12);
  transform: translateY(-1px);
}

.mock-empty-action.primary {
  border-color: rgb(255 255 255 / 0.08);
  background: var(--scene-primary);
  color: #0b1522;
}

.mock-empty-action.primary:hover {
  background: #fff;
}

.mock-question-card.is-empty,
.mock-question-info.is-empty,
.mock-draft-empty {
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 24px;
  background: rgb(255 255 255 / 0.04);
}

.mock-draft-empty {
  padding: 22px 24px;
  color: rgb(232 238 255 / 0.82);
}

.mock-draft-empty strong {
  display: block;
  color: rgb(248 250 255 / 0.96);
  font-size: 20px;
  font-weight: 700;
}

.mock-draft-empty p {
  margin: 10px 0 0;
  line-height: 1.7;
}

.mock-confirm-overlay {
  position: absolute;
  inset: 0;
  z-index: 18;
  display: grid;
  place-items: center;
  padding: 24px;
  border-radius: 28px;
  background: rgb(7 10 22 / 0.46);
  backdrop-filter: blur(10px);
}

.mock-confirm-dialog {
  width: min(420px, 100%);
  padding: 22px 22px 18px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 20px;
  background: linear-gradient(180deg, rgb(29 29 73 / 0.96) 0%, rgb(36 32 95 / 0.96) 100%);
  box-shadow:
    0 22px 54px rgb(3 6 18 / 0.32),
    inset 0 1px 0 rgb(255 255 255 / 0.06);
}

.mock-confirm-title {
  color: #fff;
  font-size: 20px;
  font-weight: 700;
}

.mock-confirm-dialog p {
  margin: 10px 0 0;
  color: rgb(232 238 255 / 0.78);
  font-size: 14px;
  line-height: 1.7;
}

.mock-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.mock-confirm-button {
  min-height: 38px;
  padding: 0 16px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
  color: rgb(244 247 255 / 0.92);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.mock-confirm-button:hover {
  border-color: rgb(255 255 255 / 0.22);
  background: rgb(255 255 255 / 0.11);
  transform: translateY(-1px);
}

.mock-confirm-button.is-danger {
  border-color: rgb(113 227 224 / 0.14);
  background: var(--scene-primary);
  color: #0a1520;
}

.mock-confirm-button.is-danger:hover {
  border-color: rgb(255 255 255 / 0.12);
  background: #fff;
}

.mock-confirm-fade-enter-active,
.mock-confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.mock-confirm-fade-enter-from,
.mock-confirm-fade-leave-to {
  opacity: 0;
}

.mock-clear-history-button {
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  color: rgb(232 238 255 / 0.76);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.mock-clear-history-button:hover:not(:disabled) {
  border-color: rgb(255 255 255 / 0.2);
  background: rgb(255 255 255 / 0.08);
  color: rgb(246 248 255 / 0.92);
}

.mock-clear-history-button:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.mock-thread-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 12px;
  width: 100%;
  min-height: 96px;
  height: auto;
  padding: 20px 22px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 18px;
  background: rgb(255 255 255 / 0.04);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.mock-thread-card-placeholder {
  opacity: 0;
  pointer-events: none;
}

.mock-thread-card:hover,
.mock-thread-card.is-active {
  border-color: rgb(169 156 255 / 0.26);
  background: rgb(255 255 255 / 0.08);
  transform: translateY(-1px);
}

.mock-thread-card-head,
.mock-thread-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mock-thread-card-head strong {
  min-width: 0;
  overflow: hidden;
  color: rgb(248 250 255 / 0.96);
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mock-thread-card-head span,
.mock-thread-card-foot span {
  color: rgb(228 234 255 / 0.7);
  font-size: 13px;
  white-space: nowrap;
}

.mock-thread-card p {
  display: -webkit-box;
  flex: 0 0 auto;
  margin: 0;
  overflow: hidden;
  color: rgb(242 246 255 / 0.88);
  font-size: 15px;
  line-height: 1.65;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.mock-thread-pagination-row {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 42px;
  padding-top: 0;
}

.mock-draft-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 10px 12px;
}

.mock-draft-shell :deep(.answer-panel) {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 8px;
  height: 100%;
  min-height: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.mock-draft-shell :deep(.panel-head) {
  gap: 8px;
}

.mock-draft-shell :deep(.panel-title) {
  font-size: 16px;
  font-weight: 600;
  color: rgb(248 250 255 / 0.96);
}

.mock-draft-shell :deep(.panel-note) {
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
  color: rgb(229 236 255 / 0.78);
}

.mock-draft-shell :deep(.answer-status) {
  min-height: 24px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 400;
  background: rgb(255 255 255 / 0.08);
  color: rgb(235 241 255 / 0.86);
}

.mock-draft-shell :deep(.answer-input .n-input-wrapper) {
  min-height: 48px !important;
}

.mock-draft-shell :deep(.panel-actions) {
  gap: 8px;
}

.mock-draft-shell :deep(.panel-actions .n-button) {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
}

.mock-session-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 16px;
  padding-top: 8px;
}

.mock-session-footer .mock-clear-history-button {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 14px;
  font-size: 14px;
}

.mock-secondary-button,
.mock-finish-button {
  min-height: 44px;
  padding: 0 18px;
  margin-top: 0;
  font: inherit;
  font-size: 15px;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    border-color 0.22s ease,
    opacity 0.22s ease,
    background 0.22s ease;
}

.mock-secondary-button {
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 14px;
  background: rgb(255 255 255 / 0.06);
  color: rgb(241 246 255 / 0.92);
}

.mock-finish-button {
  border: 1px solid rgb(139 246 220 / 0.3);
  border-radius: 14px;
  background: linear-gradient(180deg, rgb(77 130 118 / 0.38) 0%, rgb(45 90 80 / 0.3) 100%);
  color: #fff;
}

.mock-secondary-button:hover:not(:disabled),
.mock-finish-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.mock-secondary-button:hover:not(:disabled) {
  background: rgb(255 255 255 / 0.1);
  border-color: rgb(255 255 255 / 0.22);
}

.mock-finish-button:hover:not(:disabled) {
  border-color: rgb(139 246 220 / 0.45);
}

.mock-secondary-button:disabled,
.mock-finish-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.mock-dialogue-pane :deep(.message-list) {
  flex: 1;
  min-height: 0;
  max-height: none;
  height: auto;
  box-sizing: border-box;
  padding: 8px 14px 8px 8px;
  overflow-y: hidden;
}

.mock-dialogue-pane :deep(.message-list.has-messages) {
  overflow-y: auto;
}

.mock-live-shell :deep(.message-bubble) {
  padding: 8px 0 18px;
  border: 0;
  border-bottom: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.mock-live-shell :deep(.message-bubble.is-user) {
  border-color: rgb(255 255 255 / 0.08);
  background: transparent;
}

.mock-live-shell :deep(.message-bubble.is-system) {
  border-style: solid;
  border-color: rgb(255 255 255 / 0.08);
  background: transparent;
}

.mock-live-shell :deep(.message-bubble:last-child) {
  padding-bottom: 4px;
  border-bottom: 0;
}

.mock-live-shell :deep(.role-label),
.mock-live-shell :deep(.time-label) {
  font-size: 15px;
  font-weight: 500;
  color: rgb(232 236 255 / 0.76);
}

.mock-live-shell :deep(.bubble-head) {
  margin-bottom: 14px;
}

.mock-live-shell :deep(.bubble-body),
.mock-live-shell :deep(.plain-text),
.mock-live-shell :deep(.markdown-message),
.mock-live-shell :deep(.markdown-message p),
.mock-live-shell :deep(.markdown-message li),
.mock-live-shell :deep(.markdown-message ol),
.mock-live-shell :deep(.markdown-message ul) {
  color: rgb(247 249 255 / 0.96);
  font-size: 17px;
  font-weight: 500;
  line-height: 1.85;
}

.mock-live-shell :deep(.markdown-message h1),
.mock-live-shell :deep(.markdown-message h2),
.mock-live-shell :deep(.markdown-message h3),
.mock-live-shell :deep(.markdown-message h4),
.mock-live-shell :deep(.markdown-message strong) {
  color: rgb(255 255 255 / 0.98);
}

.mock-live-shell :deep(.markdown-message ul),
.mock-live-shell :deep(.markdown-message ol) {
  padding-left: 24px;
}

.mock-live-shell :deep(.markdown-message li) {
  padding-left: 2px;
}

/* 行内 code / 英文术语与正文同字体同字重，避免等宽细体与中文反差过大 */
.mock-live-shell :deep(.markdown-message code) {
  font-family: inherit;
  font-size: inherit;
  font-weight: 500;
  font-style: normal;
  letter-spacing: 0;
  padding: 0 0.2em;
  border-radius: 4px;
  background: rgb(255 255 255 / 0.1);
  color: rgb(247 249 255 / 0.96);
}

.mock-live-shell :deep(.markdown-message .markdown-code-wrapper) {
  margin: 12px 0;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 12px;
  background: rgb(255 255 255 / 0.04);
}

.mock-live-shell :deep(.markdown-message .markdown-code-header) {
  border-bottom: 1px solid rgb(255 255 255 / 0.08);
  background: rgb(255 255 255 / 0.03);
}

.mock-live-shell :deep(.markdown-message .markdown-code-lang),
.mock-live-shell :deep(.markdown-message .markdown-code-copy) {
  color: rgb(232 236 255 / 0.72);
  background: transparent;
}

.mock-live-shell :deep(.markdown-message pre) {
  margin: 0;
  padding: 14px 16px;
  border-radius: 0;
  background: transparent;
  overflow-x: auto;
}

.mock-live-shell :deep(.markdown-message pre code),
.mock-live-shell :deep(.markdown-message .markdown-code-wrapper code),
.mock-live-shell :deep(.markdown-message .hljs) {
  font-family: inherit;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.85;
  background: transparent;
  padding: 0;
  color: rgb(247 249 255 / 0.94);
}

/* highlight.js 默认配色偏深/偏灰，在深色页面上统一提亮，避免「灰底 + 浅蓝字」看不清 */
.mock-live-shell :deep(.markdown-message pre .hljs *) {
  color: rgb(247 249 255 / 0.94);
}

.mock-live-shell :deep(.markdown-message strong) {
  font-weight: 600;
}

.mock-live-shell :deep(.empty-title) {
  font-size: 20px;
  font-weight: 600;
  color: rgb(243 246 255 / 0.96);
}

.mock-live-shell :deep(.empty-desc) {
  font-size: 16px;
  line-height: 1.8;
  color: rgb(225 231 248 / 0.8);
}

.mock-live-shell :deep(.empty-state) {
  transform: translateY(15px);
}

.mock-draft-shell :deep(.draft-bubble),
.mock-draft-shell :deep(.bubble-body),
.mock-draft-shell :deep(.answer-input) {
  min-height: 0;
}

.mock-draft-shell :deep(.answer-status.is-submitted) {
  background: rgb(131 245 202 / 0.18);
  color: rgb(226 255 242 / 0.98);
}

.mock-draft-shell :deep(.answer-status.is-streaming) {
  background: rgb(160 188 255 / 0.16);
  color: rgb(236 242 255 / 0.98);
}

.mock-draft-shell :deep(.n-input),
.mock-draft-shell :deep(.n-input textarea),
.mock-draft-shell :deep(.n-input .n-input__textarea),
.mock-draft-shell :deep(.n-input .n-input__textarea-el),
.mock-draft-shell :deep(.n-input .n-input__input-el),
.mock-draft-shell :deep(.n-input .n-input__textarea-mirror) {
  font-size: 14px;
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
  line-height: 1.5;
  caret-color: #fff !important;
  background: transparent !important;
  opacity: 1 !important;
  text-shadow: none !important;
}

.mock-draft-shell :deep(.n-input) {
  --n-text-color: #fff !important;
  --n-text-color-disabled: #fff !important;
  --n-placeholder-color: rgb(255 255 255 / 0.72) !important;
  --n-caret-color: #fff !important;
}

.mock-draft-shell :deep(.n-input .n-input-wrapper),
.mock-draft-shell :deep(.n-input .n-input__border),
.mock-draft-shell :deep(.n-input .n-input__state-border) {
  min-height: 48px !important;
  background: transparent !important;
  box-shadow: none !important;
  border-color: transparent !important;
}

.mock-draft-shell :deep(.n-input .n-input__placeholder),
.mock-draft-shell :deep(.n-input textarea::placeholder),
.mock-draft-shell :deep(.n-input .n-input__textarea-el::placeholder) {
  color: rgb(255 255 255 / 0.72) !important;
  -webkit-text-fill-color: rgb(255 255 255 / 0.72) !important;
  opacity: 1 !important;
}

.mock-draft-shell :deep(.n-button) {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 500;
}

.mock-draft-shell :deep(.n-button--primary-type) {
  background: linear-gradient(180deg, rgb(114 88 255 / 0.88) 0%, rgb(89 62 228 / 0.92) 100%);
  border-color: rgb(167 145 255 / 0.36);
  color: #fff;
}

.mock-draft-shell :deep(.n-button--primary-type:disabled) {
  opacity: 0.55;
  color: rgb(255 255 255 / 0.78);
}

.mock-draft-shell :deep(.n-button:not(.n-button--primary-type)) {
  color: rgb(228 236 255 / 0.88);
}

.mock-thread-pagination-row :deep(.pagination-container) {
  padding: 4px 0 0;
}

.mock-thread-pagination-row :deep(.pagination-container > *) {
  margin-left: 8px;
}

.mock-thread-pagination-row :deep(.pagination-container > *:first-child) {
  margin-left: 0;
}

.mock-thread-pagination-row :deep(.pagination-container .c-primary) {
  min-width: 42px;
  height: 42px;
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  color: rgb(228 238 255 / 0.9);
  font-size: 15px;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.mock-thread-pagination-row :deep(.pagination-container .c-primary:hover) {
  border-color: rgb(255 255 255 / 0.24);
  background: rgb(255 255 255 / 0.08);
  transform: translateY(-1px);
}

.mock-thread-pagination-row :deep(.pagination-container .b-primary) {
  border-color: rgb(203 230 255 / 0.34);
  background: rgb(191 224 255 / 0.16);
  color: #fff;
}

@media (max-width: 1100px) {
  .mock-meta-row {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    justify-content: flex-start;
  }

  .mock-session-card {
    height: clamp(700px, calc(88vh - 40px), 860px);
    min-height: 700px;
  }

  .mock-session-layout {
    grid-template-columns: 1fr;
  }

  .mock-side-column {
    --mock-draft-slot-height: 200px;
    grid-template-rows: minmax(0, 1fr) var(--mock-draft-slot-height);
  }

  .mock-conversation-shell {
    min-height: 420px;
  }

  .mock-feedback-style-group {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 780px) {
  .mock-session-card {
    padding: 18px;
    border-radius: 18px;
  }

  .mock-meta-row {
    grid-template-columns: 1fr;
  }

  .mock-meta-popover {
    min-width: 0;
  }

  .mock-session-card:not(.is-fullscreen) {
    height: 750px;
    min-height: 750px;
    max-height: 750px;
  }

  .mock-session-card.is-fullscreen {
    border-radius: 18px;
  }

  .mock-conversation-shell {
    min-height: 360px;
    max-height: 360px;
    padding: 16px;
  }

  .mock-session-card.is-fullscreen .mock-conversation-shell {
    min-height: 0;
    max-height: none;
  }

  .mock-conversation-head-top,
  .mock-session-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .mock-conversation-head-meta {
    justify-content: flex-start;
  }
}
</style>

<style lang="scss">
html.mock-session-is-fullscreen,
html.mock-session-is-fullscreen body {
  overflow: hidden;
}

html.mock-session-is-fullscreen .interview-space-showcase {
  overflow: hidden !important;
}
</style>

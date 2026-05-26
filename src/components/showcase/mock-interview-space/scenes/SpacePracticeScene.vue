<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import SpaceSceneHeader from '@/components/showcase/mock-interview-space/SpaceSceneHeader.vue'
import {
  practiceFocusAreaLabelMap,
  practiceQuestionMatchReasonLabelMap
} from '@/services/practice/practice-question-group-builder'
import { cleanReportQuestionTitle } from '@/utils/report/clean-report-question-title'
import type {
  PersistedPracticePlan,
  PersistedReportSummary
} from '@/types/workbench'

interface PracticePreviewItem {
  order: number
  questionId: string
  title: string
  matchReason: string
  focusArea?: string
}

interface PracticeDrill {
  id: string
  title: string
  desc: string
  value: string
}

interface PracticeOption {
  label: string
  value: string
}

const props = defineProps<{
  navLabel: string
  sectionTitle: string
  sectionBody: string
  primaryWeakness: string
  reportSummary: PersistedReportSummary | null
  weaknessTags: string[]
  practiceCompileCount: number
  practicePoolPlanSnapshot: PersistedPracticePlan | null
  practicePoolQuestionTotal: number
  practicePreviewItems: PracticePreviewItem[]
  practicePreviewSignature: string
  practiceGroupShortfallText: string
  practiceIsPreparing: boolean
  practicePoolStatusLabel: string
  practicePoolStaleText: string
  canStartPractice: boolean
}>()

const emit = defineEmits<{
  startPractice: [plan: PersistedPracticePlan]
  openReport: []
  preparePractice: [plan: PersistedPracticePlan]
  'update:practiceCompileCount': [value: number]
}>()

const fallbackWeaknessTags = ['结构化表达', '追问应对', '指标量化']
const zoneOptions: PracticeOption[] = [
  {
    label: 'Vue',
    value: 'vue'
  },
  {
    label: 'JavaScript',
    value: 'javascript'
  },
  {
    label: 'TypeScript',
    value: 'typescript'
  },
  {
    label: '工程化',
    value: 'engineering'
  },
  {
    label: '性能优化',
    value: 'performance'
  }
]

const questionCountOptions: PracticeOption[] = [
  {
    label: '5 题',
    value: '5'
  },
  {
    label: '10 题',
    value: '10'
  },
  {
    label: '15 题',
    value: '15'
  }
]

const difficultyOptions: PracticeOption[] = [
  {
    label: '基础',
    value: 'easy'
  },
  {
    label: '进阶',
    value: 'medium'
  },
  {
    label: '高阶',
    value: 'hard'
  }
]

const selectedWeakness = ref('')
const selectedZone = ref('vue')
const selectedQuestionType = ref('concept')
const selectedQuestionCount = ref('10')
const selectedDifficulty = ref('medium')

const displayedWeaknessTags = computed(() => {
  return props.weaknessTags.length ? props.weaknessTags.slice(0, 5) : fallbackWeaknessTags
})

const mainWeakness = computed(() => props.primaryWeakness || displayedWeaknessTags.value[0])

const practiceDrills = computed<PracticeDrill[]>(() => [
  {
    id: 'type-concept',
    title: '概念理解题',
    desc: '适合查漏补缺，要求把概念、边界和常见误区讲清楚。',
    value: 'concept'
  },
  {
    id: 'type-code',
    title: '代码分析题',
    desc: '适合训练读代码、找问题、解释执行结果和优化思路。',
    value: 'code'
  },
  {
    id: 'type-scenario',
    title: '场景追问题',
    desc: '适合把知识点放回项目语境，训练面试官连续追问时的表达。',
    value: 'scenario'
  }
])

const activeWeakness = computed(() => selectedWeakness.value || mainWeakness.value)
const selectedZoneLabel = computed(() => zoneOptions.find(item => item.value === selectedZone.value)?.label || 'Vue')
const selectedQuestionTypeLabel = computed(() => {
  return practiceDrills.value.find(item => item.value === selectedQuestionType.value)?.title || '概念理解题'
})
const selectedDifficultyLabel = computed(() => {
  return difficultyOptions.find(item => item.value === selectedDifficulty.value)?.label || '进阶'
})

const practicePlan = computed(() => props.reportSummary?.practicePlan || null)
const practiceReason = computed(() => {
  return practicePlan.value?.reason || '当前先按最近一轮复盘里的主要弱项生成默认专项训练配置。'
})
const practiceFocusAreaText = computed(() => {
  const focusArea = practicePlan.value?.focusArea
  return focusArea ? practiceFocusAreaLabelMap[focusArea] : ''
})

const currentPracticePlan = computed<PersistedPracticePlan>(() => ({
  weaknessTag: activeWeakness.value,
  focusArea: practicePlan.value?.focusArea,
  zone: selectedZone.value as PersistedPracticePlan['zone'],
  questionType: selectedQuestionType.value as PersistedPracticePlan['questionType'],
  questionCount: Number(selectedQuestionCount.value),
  difficulty: selectedDifficulty.value as PersistedPracticePlan['difficulty'],
  reason: practiceReason.value
}))

const practiceCountMin = 1
/** 题池尚未生成时，允许选择的补练出题上限（与第三步题数选项对齐） */
const PRACTICE_GENERATE_COUNT_CAP = 15

const selectedGenerateCount = computed(() => (
  Math.max(
    practiceCountMin,
    Number(selectedQuestionCount.value) || practiceCountMin
  )
))

const practiceConfigSignature = computed(() => (
  resolvePracticePlanSignature(currentPracticePlan.value)
))

const appliedPlanSignature = computed(() => (
  resolvePracticePlanSignature(props.practicePoolPlanSnapshot)
))

const practiceCompileDraftApplied = computed(() => (
  appliedPlanSignature.value !== ''
  && appliedPlanSignature.value === practiceConfigSignature.value
  && selectedGenerateCount.value === props.practiceCompileCount
))

const hasPracticePreview = computed(() => props.practicePreviewItems.length > 0)

const canStartPracticeNow = computed(() => (
  props.canStartPractice && practiceCompileDraftApplied.value
))

const practicePreviewPendingHint = computed(() => {
  if (props.practicePoolStaleText) return props.practicePoolStaleText
  if (practiceCompileDraftApplied.value || !hasPracticePreview.value) return ''
  return '左侧配置已变更，点击「生成补练题」更新预览。'
})

const practiceGroupPreviewItems = computed(() => props.practicePreviewItems)

const practiceGroupShortfallText = computed(() => props.practiceGroupShortfallText)

/** 预览区动效：渐隐 → 占位加载 → 渐显 */
const PRACTICE_PREVIEW_FADE_MS = 280
type PracticePreviewUiPhase = 'idle' | 'fade-out' | 'loading' | 'fade-in' | 'ready'

const previewUiPhase = ref<PracticePreviewUiPhase>('idle')
const previewFadeSnapshot = ref<PracticePreviewItem[]>([])

/** 有报告即预留预览区高度，避免空态 ↔ 加载态撑高卡片 */
const showPreviewBody = computed(() => Boolean(props.reportSummary?.sessionId))

const isPreviewListInteractive = computed(() => previewUiPhase.value === 'ready')

const previewFadeOutItems = computed(() => (
  previewFadeSnapshot.value.slice(0, previewPageSize)
))

/** 预览动效与持久化题池状态对齐（切轨卸载组件后靠 props 恢复） */
const syncPreviewUiPhaseFromProps = () => {
  if (props.practiceIsPreparing) {
    previewUiPhase.value = 'loading'
    return
  }

  if (hasPracticePreview.value) {
    if (previewUiPhase.value === 'loading') {
      previewUiPhase.value = 'fade-in'
      return
    }
    if (previewUiPhase.value === 'fade-out') return
    previewUiPhase.value = 'ready'
    return
  }

  if (previewUiPhase.value !== 'fade-out') {
    previewUiPhase.value = 'idle'
  }
}

/** 生成题池：题数直接沿用左侧第三步选择 */
const resolveGenerateQuestionCount = () => (
  Math.min(
    PRACTICE_GENERATE_COUNT_CAP,
    selectedGenerateCount.value
  )
)

const emitPreparePractice = () => {
  const count = resolveGenerateQuestionCount()
  emit('update:practiceCompileCount', count)
  previewPageIndex.value = 0
  emit('preparePractice', {
    ...currentPracticePlan.value,
    questionCount: count
  })
}

const beginPracticePreviewLoading = () => {
  previewUiPhase.value = 'loading'
  emitPreparePractice()
}

const handlePreparePracticeClick = () => {
  if (!props.reportSummary) {
    window.$ModalMessage?.warning?.('请先完成一轮模拟面试并生成报告', { duration: 3200 })
    return
  }

  if (props.practiceIsPreparing) return

  if (hasPracticePreview.value) {
    previewFadeSnapshot.value = [...props.practicePreviewItems]
    previewUiPhase.value = 'fade-out'
    window.setTimeout(() => {
      if (previewUiPhase.value === 'fade-out') {
        beginPracticePreviewLoading()
      }
    }, PRACTICE_PREVIEW_FADE_MS)
    return
  }

  beginPracticePreviewLoading()
}

const onPreviewListEntered = () => {
  if (previewUiPhase.value === 'fade-in') {
    previewUiPhase.value = 'ready'
  }
}

/** 预览列表每页条数（约填满固定高度区域；超过 2 题时出现翻页） */
const previewPageSize = 2
const previewPageIndex = ref(0)

const previewPageCount = computed(() => {
  const total = practiceGroupPreviewItems.value.length
  if (!total) return 0
  return Math.ceil(total / previewPageSize)
})

const previewPagedItems = computed(() => {
  const start = previewPageIndex.value * previewPageSize
  return practiceGroupPreviewItems.value.slice(start, start + previewPageSize)
})

/** 每页固定 2 行槽位，题量不足时留空行，避免预览区高度塌陷 */
const previewPagedSlots = computed(() => (
  Array.from({ length: previewPageSize }, (_, index) => previewPagedItems.value[index] || null)
))

const previewFadeOutSlots = computed(() => (
  Array.from({ length: previewPageSize }, (_, index) => previewFadeOutItems.value[index] || null)
))

const previewShowEmptyHint = computed(() => (
  previewUiPhase.value === 'idle' && !hasPracticePreview.value
))

const previewShowLoadingLayer = computed(() => previewUiPhase.value === 'loading')

const previewShowListLayer = computed(() => (
  previewUiPhase.value === 'fade-out'
  || previewUiPhase.value === 'fade-in'
  || previewUiPhase.value === 'ready'
))

const previewHasNextPage = computed(() => previewPageIndex.value < previewPageCount.value - 1)
const previewHasPrevPage = computed(() => previewPageIndex.value > 0)

const resolvePreviewItemOrder = (indexOnPage: number) => (
  previewPageIndex.value * previewPageSize + indexOnPage + 1
)

const resolvePracticePreviewTitle = (title: string) => (
  cleanReportQuestionTitle(title).replace(/^\d+\.\s*/, '').trim() || title
)

const goToNextPreviewPage = () => {
  if (!previewHasNextPage.value) return
  previewPageIndex.value += 1
}

const goToPrevPreviewPage = () => {
  if (!previewHasPrevPage.value) return
  previewPageIndex.value -= 1
}

const resolvePracticePlanSignature = (plan: PersistedPracticePlan | null) => {
  if (!plan) return ''
  return [
    plan.weaknessTag,
    plan.focusArea || '',
    plan.zone,
    plan.questionType,
    String(plan.questionCount),
    plan.difficulty,
    plan.reason
  ].join('|')
}

const lastHydratedPracticePlanSignature = ref('')

watch(practicePlan, (plan) => {
  if (!plan) return
  const nextSignature = resolvePracticePlanSignature(plan)
  if (nextSignature === lastHydratedPracticePlanSignature.value) {
    return
  }

  selectedWeakness.value = plan.weaknessTag
  selectedZone.value = plan.zone
  selectedQuestionType.value = plan.questionType
  selectedQuestionCount.value = String(plan.questionCount)
  selectedDifficulty.value = plan.difficulty
  lastHydratedPracticePlanSignature.value = nextSignature
}, {
  immediate: true
})

watch(
  () => resolvePracticePlanSignature(currentPracticePlan.value),
  () => {
    previewPageIndex.value = 0
  }
)

watch(() => props.practicePreviewSignature, () => {
  previewPageIndex.value = 0
})

onMounted(() => {
  syncPreviewUiPhaseFromProps()
})

watch(
  () => [
    props.practiceIsPreparing,
    props.practicePreviewSignature,
    props.practicePreviewItems.length
  ] as const,
  () => {
    syncPreviewUiPhaseFromProps()
  },
  { immediate: true }
)
</script>

<template>
  <div class="practice-scene">
    <SpaceSceneHeader
      :title="sectionTitle"
      :body="sectionBody"
    />

    <section class="practice-layout">
      <div class="practice-main">
        <div class="config-panel">
          <div class="config-block config-block--weakness">
            <div class="panel-label">第一步 · 查看当前弱点</div>
            <h3 class="config-heading">{{ activeWeakness }}</h3>
            <p class="config-desc">先确认这轮要收敛的问题，再选择专项训练范围。</p>
            <div class="weakness-tags">
              <button
                v-for="tag in displayedWeaknessTags"
                :key="tag"
                type="button"
                :class="{ 'is-active': activeWeakness === tag }"
                @click="selectedWeakness = tag"
              >
                {{ tag }}
              </button>
            </div>
          </div>

          <div class="config-block config-block--zone">
            <div class="panel-label">第二步 · 选择专项专区</div>
            <p class="config-desc practice-inline-note">{{ practiceReason }}</p>
            <div
              v-if="practiceFocusAreaText"
              class="practice-focus-pill"
            >
              本轮补练重点：{{ practiceFocusAreaText }}
            </div>
            <div class="option-grid">
              <button
                v-for="zone in zoneOptions"
                :key="zone.value"
                type="button"
                class="option-chip"
                :class="{ 'is-active': selectedZone === zone.value }"
                @click="selectedZone = zone.value"
              >
                {{ zone.label }}
              </button>
            </div>
          </div>

          <div class="config-block config-block--count">
            <div class="panel-label">第三步 · 设置题量和难度</div>
            <div class="count-difficulty-grid">
              <div class="side-option-group">
                <span>题数</span>
                <div class="side-options">
                  <button
                    v-for="option in questionCountOptions"
                    :key="option.value"
                    type="button"
                    :class="{ 'is-active': selectedQuestionCount === option.value }"
                    @click="selectedQuestionCount = option.value"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>
              <div class="side-option-group">
                <span>难度</span>
                <div class="side-options">
                  <button
                    v-for="option in difficultyOptions"
                    :key="option.value"
                    type="button"
                    :class="{ 'is-active': selectedDifficulty === option.value }"
                    @click="selectedDifficulty = option.value"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="drill-grid">
          <button
            v-for="drill in practiceDrills"
            :key="drill.id"
            type="button"
            class="drill-card"
            :class="{ 'is-active': selectedQuestionType === drill.value }"
            @click="selectedQuestionType = drill.value"
          >
            <div class="drill-meta">题型</div>
            <h3>{{ drill.title }}</h3>
            <p>{{ drill.desc }}</p>
          </button>
        </div>
      </div>

      <aside class="practice-side">
        <article class="practice-material-card">
          <div class="material-card-head">
            <div class="stat-label">第四步 · 预览本轮题组</div>
            <div class="material-pool-badge">{{ practicePoolStatusLabel }}</div>
          </div>
          <div class="material-action-row">
            <button
              type="button"
              class="overview-action primary"
              :disabled="!reportSummary || practiceIsPreparing"
              @click="handlePreparePracticeClick"
            >
              {{ practiceIsPreparing ? '生成中…' : '生成补练题' }}
            </button>
            <button
              type="button"
              class="overview-action"
              :disabled="!canStartPracticeNow"
              @click="emit('startPractice', currentPracticePlan)"
            >
              预览并开始模拟面试
            </button>
          </div>
          <div class="practice-config-status">
            <div class="practice-config-status__label">当前配置</div>
            <Transition
              name="practice-status-fade"
              mode="out-in"
            >
              <dl
                :key="practiceConfigSignature"
                class="practice-config-status__grid"
              >
                <div class="practice-config-status__row">
                  <dt>弱点</dt>
                  <dd>{{ activeWeakness }}</dd>
                </div>
                <div class="practice-config-status__row">
                  <dt>专项专区</dt>
                  <dd>{{ selectedZoneLabel }}</dd>
                </div>
                <div class="practice-config-status__row">
                  <dt>题数</dt>
                  <dd>{{ selectedQuestionCount }} 题</dd>
                </div>
                <div class="practice-config-status__row">
                  <dt>难度</dt>
                  <dd>{{ selectedDifficultyLabel }}</dd>
                </div>
              </dl>
            </Transition>
          </div>
          <p
            v-if="showPreviewBody"
            class="material-draft-hint"
            :class="{ 'is-idle': !practicePreviewPendingHint || previewUiPhase === 'loading' }"
            aria-live="polite"
          >
            {{ practicePreviewPendingHint || '左侧配置已变更，点击「生成补练题」更新预览。' }}
          </p>
          <p
            v-if="showPreviewBody"
            class="material-shortfall-note"
            :class="{ 'is-idle': !(practiceGroupShortfallText && isPreviewListInteractive) }"
            aria-live="polite"
          >
            {{ practiceGroupShortfallText }}
          </p>
          <div
            v-if="showPreviewBody"
            class="material-preview-body material-preview-body--stable"
          >
            <div class="material-preview-body__content practice-preview-viewport">
              <div
                class="practice-preview-stage"
                :class="{ 'is-loading': previewShowLoadingLayer }"
              >
                <p
                  v-show="previewShowEmptyHint"
                  class="practice-preview-layer practice-preview-layer--empty"
                >
                  选好左侧配置后，点击「生成补练题」预览本轮题目。
                </p>
                <div
                  v-show="previewShowLoadingLayer"
                  class="practice-preview-layer practice-preview-layer--loading"
                  aria-busy="true"
                  aria-live="polite"
                >
                  <ol class="material-group-preview material-group-preview--slot">
                    <li
                      v-for="slot in previewPageSize"
                      :key="`ghost-${ slot }`"
                      class="practice-preview-slot-row is-ghost"
                    >
                      <span class="practice-preview-slot-index">{{ slot }}.</span>
                      <strong class="practice-preview-slot-title">
                        <span class="practice-preview-ghost-bar practice-preview-ghost-bar--title" />
                      </strong>
                      <em class="practice-preview-slot-meta">
                        <span class="practice-preview-ghost-bar practice-preview-ghost-bar--meta" />
                      </em>
                    </li>
                  </ol>
                  <div
                    class="material-preview-spinner"
                    aria-label="正在生成补练题"
                  />
                </div>
                <Transition
                  name="practice-preview-fade"
                  @after-enter="onPreviewListEntered"
                >
                  <ol
                    v-if="previewUiPhase === 'fade-out'"
                    key="practice-preview-fade-out"
                    class="material-group-preview material-group-preview--slot practice-preview-layer practice-preview-layer--list"
                  >
                    <li
                      v-for="(item, index) in previewFadeOutSlots"
                      :key="item ? `fade-out-${ item.questionId }` : `fade-out-empty-${ index }`"
                      class="practice-preview-slot-row"
                      :class="{ 'is-slot-empty': !item }"
                    >
                      <template v-if="item">
                        <span class="practice-preview-slot-index">{{ index + 1 }}.</span>
                        <strong class="practice-preview-slot-title">
                          <span
                            v-if="item.focusArea"
                            class="preview-focus"
                          >[{{ practiceFocusAreaLabelMap[item.focusArea] }}]</span>
                          {{ resolvePracticePreviewTitle(item.title) }}
                        </strong>
                        <em class="practice-preview-slot-meta">{{ practiceQuestionMatchReasonLabelMap[item.matchReason] }}</em>
                      </template>
                    </li>
                  </ol>
                  <ol
                    v-else-if="previewShowListLayer"
                    :key="`practice-preview-list-${ previewPageIndex }-${ practicePreviewSignature }`"
                    class="material-group-preview material-group-preview--slot practice-preview-layer practice-preview-layer--list"
                  >
                    <li
                      v-for="(item, index) in previewPagedSlots"
                      :key="item ? item.questionId : `preview-empty-${ index }`"
                      class="practice-preview-slot-row"
                      :class="{ 'is-slot-empty': !item }"
                    >
                      <template v-if="item">
                        <span class="practice-preview-slot-index">{{ resolvePreviewItemOrder(index) }}.</span>
                        <strong class="practice-preview-slot-title">
                          <span
                            v-if="item.focusArea"
                            class="preview-focus"
                          >[{{ practiceFocusAreaLabelMap[item.focusArea] }}]</span>
                          {{ resolvePracticePreviewTitle(item.title) }}
                        </strong>
                        <em class="practice-preview-slot-meta">{{ practiceQuestionMatchReasonLabelMap[item.matchReason] }}</em>
                      </template>
                    </li>
                  </ol>
                </Transition>
              </div>
            </div>
            <div
              v-if="isPreviewListInteractive && previewPageCount > 1"
              class="material-preview-page-nav-stack"
            >
              <button
                type="button"
                class="material-preview-page-nav"
                aria-label="预览下一页"
                :disabled="!previewHasNextPage"
                @click="goToNextPreviewPage"
              >
                <svg
                  class="material-preview-page-nav__icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M10 7l5 5-5 5"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="material-preview-page-nav"
                aria-label="预览上一页"
                :disabled="!previewHasPrevPage"
                @click="goToPrevPreviewPage"
              >
                <svg
                  class="material-preview-page-nav__icon is-back"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M10 7l5 5-5 5"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
              </button>
            </div>
          </div>
          <p
            v-else
            class="material-empty-note"
          >
            请先完成一轮模拟面试并生成报告，再进入专项补练。
          </p>
        </article>

        <div class="side-card action-card">
          <div class="panel-label">第五步 · 开始训练</div>
          <h3>{{ selectedZoneLabel }} · {{ selectedQuestionTypeLabel }}</h3>
          <p>
            将按上方预览题组练 {{ practiceGroupPreviewItems.length || selectedQuestionCount }} 道{{ selectedDifficultyLabel }}题，
            模拟面试中一题一线程按序推进。
          </p>
          <div
            v-if="practicePlan"
            class="plan-source"
          >
            当前方案来自最近一轮复盘摘要。
          </div>
          <div class="action-row">
            <button
              type="button"
              class="scene-action primary"
              :disabled="!canStartPracticeNow"
              @click="emit('startPractice', currentPracticePlan)"
            >
              开始模拟面试
            </button>
            <button
              type="button"
              class="scene-action"
              @click="emit('openReport')"
            >
              查看报告
            </button>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>

<style scoped lang="scss">
.practice-scene {
  display: grid;
  gap: 24px;
}

.panel-label,
.drill-meta {
  color: var(--scene-primary);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.config-desc,
.practice-inline-note,
.drill-card p,
.action-card p {
  margin: 10px 0 0;
  color: rgb(232 244 255 / 78%);
  font-size: 15px;
  line-height: 1.65;
}

.practice-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.75fr);
  gap: 24px;
  align-items: start;
}

.practice-main {
  display: grid;
  gap: 16px;
}

.practice-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.config-panel,
.drill-card,
.side-card {
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 24px;
  background: rgb(255 255 255 / 6%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 6%);
  backdrop-filter: blur(16px);
}

.config-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-rows: auto auto;
  gap: 20px 28px;
  padding: 22px 24px;
}

.config-block {
  min-width: 0;
}

.config-block--weakness {
  grid-column: 1 / -1;
  grid-row: 1;
  padding-bottom: 4px;
  border-bottom: 1px solid rgb(255 255 255 / 10%);
}

.config-block--weakness .config-heading {
  max-width: none;
}

.config-block--weakness .weakness-tags {
  margin-top: 14px;
}

.config-block--zone {
  grid-column: 1;
  grid-row: 2;
  align-self: start;
}

.config-block--count {
  grid-column: 2;
  grid-row: 2;
  align-self: start;
}

.config-heading,
.side-card h3,
.drill-card h3 {
  margin: 8px 0 0;
  color: #fff;
  font-size: 22px;
  line-height: 1.35;
}

.count-difficulty-grid {
  display: grid;
  gap: 14px;
  margin-top: 12px;
}

.config-block--count .side-option-group {
  margin-top: 0;
}

.config-block--count .side-option-group + .side-option-group {
  margin-top: 12px;
}

.weakness-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.weakness-tags button,
.option-chip,
.side-options button {
  padding: 10px 14px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 999px;
  background: rgb(255 255 255 / 8%);
  color: rgb(244 250 255 / 88%);
  font: inherit;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
}

.weakness-tags button:hover,
.weakness-tags button.is-active,
.option-chip:hover,
.option-chip.is-active,
.side-options button:hover,
.side-options button.is-active,
.drill-card:hover,
.drill-card.is-active {
  border-color: rgb(186 245 255 / 48%);
  background: rgb(186 245 255 / 14%);
  transform: translateY(-1px);
}

.option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.practice-inline-note {
  margin-top: 10px;
}

.practice-focus-pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  margin-top: 14px;
  padding: 0 14px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 999px;
  background: rgb(255 255 255 / 8%);
  color: rgb(244 250 255 / 88%);
  font-size: 14px;
}

.drill-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.drill-card,
.side-card {
  padding: 20px;
}

.drill-card {
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
}

.practice-material-card {
  --practice-preview-slot-row-height: calc(13px * 1.4 + 2px + 13px * 1.4 * 2 + 2px + 12px);
  --practice-preview-stage-height: calc(var(--practice-preview-slot-row-height) * 2 + 8px);
  --practice-preview-stack-lift: 20px;
  --practice-preview-content-lift: 16px;
  --practice-preview-page-nav-lift: 10px;

  display: grid;
  gap: 12px;
  padding: 8px 20px 10px;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 24px;
  background: rgb(255 255 255 / 3.5%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 4%);
}

.stat-label {
  color: rgb(228 238 255 / 72%);
  font-size: 15px;
}

.overview-action {
  height: 46px;
  padding: 0 18px;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 999px;
  background: rgb(255 255 255 / 5%);
  color: #fff;
  font: inherit;
  font-size: 16px;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.24s ease, border-color 0.24s ease, transform 0.24s ease;
}

.overview-action.primary {
  border-color: rgb(255 255 255 / 6%);
  background: var(--scene-primary);
  color: #081421;
}

.overview-action:hover:not(:disabled) {
  border-color: rgb(255 255 255 / 24%);
  background: rgb(255 255 255 / 10%);
  transform: translateY(-1px);
}

.overview-action.primary:hover:not(:disabled) {
  background: #fff;
}

.overview-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.material-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.material-pool-badge {
  display: inline-flex;
  flex: 0 0 auto;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgb(186 245 255 / 12%);
  color: #baf5ff;
  font-size: 13px;
}

.material-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.practice-config-status {
  display: grid;
  gap: 8px;
}

.practice-config-status__label {
  color: rgb(220 232 255 / 72%);
  font-size: 14px;
}

.practice-config-status__grid {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 14px 16px;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 16px;
  background: rgb(255 255 255 / 4%);
}

.practice-config-status__row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.practice-config-status__row dt {
  margin: 0;
  color: rgb(186 245 255 / 72%);
  font-size: 13px;
  line-height: 1.45;
}

.practice-config-status__row dd {
  margin: 0;
  color: rgb(244 250 255 / 94%);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
}

.practice-status-fade-enter-active,
.practice-status-fade-leave-active {
  transition: opacity 0.24s ease;
}

.practice-status-fade-enter-from,
.practice-status-fade-leave-to {
  opacity: 0;
}

.material-draft-hint,
.material-shortfall-note,
.material-empty-note {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

.material-draft-hint {
  min-height: calc(13px * 1.5);
  color: rgb(186 245 255 / 82%);
  transition: opacity 0.2s ease;
}

.material-draft-hint.is-idle {
  opacity: 0;
  pointer-events: none;
  user-select: none;
}

.material-shortfall-note,
.material-empty-note {
  color: rgb(255 214 153 / 92%);
}

.material-shortfall-note {
  min-height: calc(13px * 1.5);
  transition: opacity 0.2s ease;
}

.material-shortfall-note.is-idle {
  opacity: 0;
  pointer-events: none;
  user-select: none;
}

.material-preview-body {
  position: relative;
}

.material-preview-body--stable {
  height: var(--practice-preview-stage-height);
  margin-top: calc(-1 * var(--practice-preview-stack-lift));
}

.practice-preview-viewport {
  height: var(--practice-preview-stage-height);
  padding-right: 52px;
}

.practice-preview-stage {
  position: relative;
  height: var(--practice-preview-stage-height);
}

.practice-preview-layer {
  position: absolute;
  inset: 0;
  margin: 0;
}

.practice-preview-layer--empty {
  display: flex;
  align-items: center;
  padding-left: 18px;
  color: rgb(255 214 153 / 92%);
  font-size: 13px;
  line-height: 1.5;
}

.practice-preview-layer--loading {
  pointer-events: none;
}

.practice-preview-layer--list {
  position: absolute;
  inset: 0;
}

.material-group-preview--slot {
  display: grid;
  grid-template-rows: repeat(2, var(--practice-preview-slot-row-height));
  gap: 8px;
  align-content: start;
  height: 100%;
  margin: 0;
  padding-left: 18px;
  box-sizing: border-box;
  transform: translateY(calc(-1 * var(--practice-preview-content-lift)));
}

.practice-preview-slot-row {
  display: grid;
  gap: 2px;
  min-height: 0;
}

.practice-preview-slot-row.is-slot-empty {
  visibility: hidden;
}

.practice-preview-slot-row.is-ghost {
  opacity: 0.42;
}

.practice-preview-slot-index {
  color: rgb(244 250 255 / 72%);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
}

.practice-preview-slot-title {
  display: -webkit-box;
  overflow: hidden;
  min-height: calc(13px * 1.4 * 2);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.practice-preview-slot-meta {
  display: block;
  overflow: hidden;
  min-height: 12px;
  color: rgb(186 245 255 / 72%);
  font-size: 12px;
  font-style: normal;
  line-height: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.practice-preview-ghost-bar {
  display: block;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    rgb(255 255 255 / 8%) 0%,
    rgb(255 255 255 / 16%) 50%,
    rgb(255 255 255 / 8%) 100%
  );
  background-size: 200% 100%;
  animation: practice-preview-shimmer 1.2s ease-in-out infinite;
}

.practice-preview-ghost-bar--title {
  width: 88%;
  height: calc(13px * 1.4 * 2);
}

.practice-preview-ghost-bar--meta {
  width: 42%;
  height: 12px;
}

.material-preview-spinner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.material-preview-spinner::after {
  width: 34px;
  height: 34px;
  border: 2px solid rgb(186 245 255 / 18%);
  border-top-color: var(--scene-primary);
  border-radius: 50%;
  animation: practice-preview-spin 0.75s linear infinite;
  content: '';
}

.practice-preview-fade-enter-active,
.practice-preview-fade-leave-active {
  transition: opacity 0.28s ease;
}

.practice-preview-fade-enter-from,
.practice-preview-fade-leave-to {
  opacity: 0;
}

@keyframes practice-preview-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes practice-preview-shimmer {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -100% 0;
  }
}

.material-preview-page-nav-stack {
  position: absolute;
  top: 50%;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transform: translateY(calc(-50% - var(--practice-preview-page-nav-lift)));
}

.material-preview-page-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 50%;
  background: rgb(255 255 255 / 10%);
  color: rgb(244 250 255 / 92%);
  cursor: pointer;
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease, opacity 0.22s ease;
}

.material-preview-page-nav:hover:not(:disabled) {
  border-color: rgb(186 245 255 / 48%);
  background: rgb(186 245 255 / 16%);
  transform: scale(1.04);
}

.material-preview-page-nav:disabled {
  cursor: not-allowed;
  opacity: 0.34;
}

.material-preview-page-nav__icon {
  width: 20px;
  height: 20px;
}

.material-preview-page-nav__icon.is-back {
  transform: rotate(180deg);
}

.material-preview-page-fade-enter-active,
.material-preview-page-fade-leave-active {
  transition: opacity 0.28s ease;
}

.material-preview-page-fade-enter-from,
.material-preview-page-fade-leave-to {
  opacity: 0;
}

.action-card {
  flex: 0 0 auto;
}

.side-option-group {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.side-option-group > span {
  color: rgb(232 244 255 / 72%);
  font-size: 16px;
  font-weight: 700;
}

.side-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-row {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.plan-source {
  margin-top: 14px;
  color: rgb(232 244 255 / 72%);
  font-size: 14px;
  line-height: 1.7;
}

.preview-focus {
  margin-right: 6px;
  color: var(--scene-primary);
  font-weight: 700;
}

.scene-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.scene-action {
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid rgb(255 255 255 / 16%);
  border-radius: 999px;
  background: rgb(255 255 255 / 8%);
  color: #fff;
  font: inherit;
  cursor: pointer;
  transition: background 0.22s ease, transform 0.22s ease;
}

.scene-action.primary {
  border-color: transparent;
  background: var(--scene-primary);
  color: #071521;
  font-weight: 800;
}

.scene-action:hover {
  background: rgb(255 255 255 / 14%);
  transform: translateY(-1px);
}

.scene-action.primary:hover {
  background: #fff;
}

@media (max-width: 1100px) {
  .practice-layout,
  .drill-grid {
    grid-template-columns: 1fr;
  }

  .config-panel {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .config-block--weakness {
    grid-column: 1;
    grid-row: auto;
    padding-bottom: 16px;
  }

  .config-block--zone,
  .config-block--count {
    grid-column: 1;
    grid-row: auto;
  }

  .preview-card {
    min-height: 320px;
  }

  .preview-card-body {
    min-height: 200px;
  }
}
</style>

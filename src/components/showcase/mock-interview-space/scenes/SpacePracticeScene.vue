<script setup lang="ts">
import SpaceSceneHeader from '@/components/showcase/mock-interview-space/SpaceSceneHeader.vue'
import {
  buildPracticeQuestionGroup,
  practiceFocusAreaLabelMap,
  practiceQuestionMatchReasonLabelMap
} from '@/services/practice/practice-question-group-builder'
import type {
  PersistedPracticePlan,
  PersistedReportSummary
} from '@/types/workbench'

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
}>()

const emit = defineEmits<{
  startPractice: [plan: PersistedPracticePlan]
  openReport: []
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

const practiceGroupPreview = computed(() => buildPracticeQuestionGroup(currentPracticePlan.value, {
  reportSummary: props.reportSummary
}))

const practiceGroupPreviewItems = computed(() => practiceGroupPreview.value.group.items)

const practiceGroupShortfallText = computed(() => {
  if (!practiceGroupPreview.value.isShortfall) return ''
  return `题库不足，仅找到 ${ practiceGroupPreview.value.actualCount } / ${ practiceGroupPreview.value.requestedCount } 题。`
})

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

const previewHasNextPage = computed(() => previewPageIndex.value < previewPageCount.value - 1)

const previewArrowPointsRight = computed(() => previewHasNextPage.value)

const resolvePreviewItemOrder = (indexOnPage: number) => (
  previewPageIndex.value * previewPageSize + indexOnPage + 1
)

const advancePreviewPage = () => {
  if (previewPageCount.value <= 1) return
  previewPageIndex.value = previewHasNextPage.value
    ? previewPageIndex.value + 1
    : previewPageIndex.value - 1
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
        <div class="side-card preview-card">
          <div class="preview-card-header">
            <div class="panel-label">第四步 · 预览本轮题组</div>
            <h3>本轮专项题组 · 共 {{ practiceGroupPreviewItems.length }} 题</h3>
            <p
              v-if="practiceGroupShortfallText"
              class="practice-shortfall-note"
            >
              {{ practiceGroupShortfallText }}
            </p>
          </div>
          <div class="preview-card-body">
            <div class="preview-card-body__content">
              <Transition
                v-if="practiceGroupPreviewItems.length"
                name="preview-page-fade"
                mode="out-in"
              >
                <ol
                  :key="previewPageIndex"
                  class="practice-group-preview"
                >
                  <li
                    v-for="(item, index) in previewPagedItems"
                    :key="item.questionId"
                  >
                    <span class="preview-item-order">{{ resolvePreviewItemOrder(index) }}.</span>
                    <span
                      v-if="item.focusArea"
                      class="preview-focus"
                    >[{{ practiceFocusAreaLabelMap[item.focusArea] }}]</span>
                    {{ item.title }}
                    <span class="preview-reason">{{ practiceQuestionMatchReasonLabelMap[item.matchReason] }}</span>
                  </li>
                </ol>
              </Transition>
              <p
                v-else
                class="practice-inline-note preview-empty"
              >
                当前配置下未匹配到题目，请调整专区、题型或难度。
              </p>
            </div>
            <button
              v-if="previewPageCount > 1"
              type="button"
              class="preview-page-nav"
              :aria-label="previewArrowPointsRight ? '预览下一页' : '预览上一页'"
              @click="advancePreviewPage"
            >
              <svg
                class="preview-page-nav__icon"
                :class="{ 'is-back': !previewArrowPointsRight }"
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

        <div class="side-card action-card">
          <div class="panel-label">第五步 · 开始训练</div>
          <h3>{{ selectedZoneLabel }} · {{ selectedQuestionTypeLabel }}</h3>
          <p>
            将按上方预览顺序练 {{ practiceGroupPreviewItems.length || selectedQuestionCount }} 道{{ selectedDifficultyLabel }}题，
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
              :disabled="!practiceGroupPreviewItems.length"
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
  align-items: stretch;
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

.preview-card {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 360px;
  padding: 20px;
}

.preview-card-header {
  flex: 0 0 auto;
}

.preview-card-body {
  position: relative;
  flex: 1 1 auto;
  min-height: 240px;
  margin-top: 12px;
  padding-top: 4px;
}

.preview-card-body__content {
  min-height: inherit;
  padding-right: 52px;
}

.preview-page-nav {
  position: absolute;
  top: 50%;
  right: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 50%;
  background: rgb(255 255 255 / 10%);
  color: rgb(244 250 255 / 92%);
  cursor: pointer;
  transform: translateY(-50%);
  transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
}

.preview-page-nav:hover {
  border-color: rgb(186 245 255 / 48%);
  background: rgb(186 245 255 / 16%);
  transform: translateY(-50%) scale(1.04);
}

.preview-page-nav__icon {
  width: 20px;
  height: 20px;
  transition: transform 0.28s ease;
}

.preview-page-nav__icon.is-back {
  transform: rotate(180deg);
}

.preview-page-fade-enter-active,
.preview-page-fade-leave-active {
  transition: opacity 0.28s ease;
}

.preview-page-fade-enter-from,
.preview-page-fade-leave-to {
  opacity: 0;
}

.preview-item-order {
  margin-right: 4px;
  color: rgb(244 250 255 / 72%);
  font-weight: 700;
}

.preview-empty {
  display: flex;
  align-items: center;
  min-height: inherit;
  margin: 0;
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

.practice-shortfall-note {
  margin-top: 12px;
  color: #ffd9a8;
  font-size: 14px;
  line-height: 1.6;
}

.practice-group-preview {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 20px;
  color: rgb(244 250 255 / 90%);
  font-size: 15px;
  line-height: 1.6;
}

.practice-group-preview li {
  padding-left: 4px;
}

.preview-focus {
  margin-right: 6px;
  color: var(--scene-primary);
  font-weight: 700;
}

.preview-reason {
  display: block;
  margin-top: 4px;
  color: rgb(232 244 255 / 62%);
  font-size: 13px;
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

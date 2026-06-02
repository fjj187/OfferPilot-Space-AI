<script setup lang="tsx">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DocumentListItem from '@/components/library/DocumentListItem.vue'
import DocumentPreviewPanel from '@/components/library/DocumentPreviewPanel.vue'
import ImportActionCard from '@/components/library/ImportActionCard.vue'
import LibraryFilterTabs from '@/components/library/LibraryFilterTabs.vue'
import LibraryStatCard from '@/components/library/LibraryStatCard.vue'
import Pagination from '@/components/Pagination/index.vue'
import SpaceSceneHeader from '@/components/showcase/mock-interview-space/SpaceSceneHeader.vue'
import SpaceCosmosConfirm from '@/components/showcase/mock-interview-space/SpaceCosmosConfirm.vue'
import type { PersistedTopicKey } from '@/types/workbench'
import { resolveLibraryDocumentSourceLabel } from '@/services/library/library-document-categories'

interface LibraryStatItem {
  label: string
  value: string
  note: string
  tone?: string
}

interface LibraryFilterTab {
  key: string
  label: string
}

interface LibraryDocumentItem {
  id: string
  name: string
  importedName?: string
  type: 'md' | 'docx'
  size: number
  importedAt: string
  tags: string[]
  status: 'pending' | 'parsed' | 'error'
  sourceKey?: string
  topicKeys: string[]
  recommendedReason?: string
}

interface SelectedLibraryDocument {
  id: string
  name: string
  importedName?: string
  type: 'md' | 'docx'
  importedAt: string
  summary: string
  tags: string[]
  status: 'pending' | 'parsed' | 'error'
  sourceKey?: string
  topicKeys: string[]
  recommendedReason?: string
  rawText: string
}

interface MaterialPreviewItem {
  order: number
  questionId: string
  title: string
  difficulty: string
  matchReason: string
}

interface MaterialTopicTab {
  key: PersistedTopicKey
  label: string
  count: number
}

const props = defineProps<{
  sectionTitle: string
  sectionBody: string
  workspaceTitle: string
  workspaceDesc: string
  nextStepTitle: string
  nextStepDesc: string
  derivedStats: LibraryStatItem[]
  filterTabs: LibraryFilterTab[]
  customCategoryLabels: string[]
  activeFilter: string
  currentPage: number
  pageCount: number
  filteredCount: number
  selectedDocument: SelectedLibraryDocument | null
  selectedDocumentId: string
  topicLabelMap: Record<string, string>
  sourceLabelMap: Record<string, string>
  displayedDocuments: LibraryDocumentItem[]
  isListVisible: boolean
  showImportFeedback: boolean
  importFeedbackText: string
  formatBytes: (size: number) => string
  materialCompileCount: number
  materialCompileCountMax: number
  materialOrderMode: 'chapter' | 'random'
  materialTopicFilter: PersistedTopicKey | 'all'
  materialTopicTabs: MaterialTopicTab[]
  materialFilteredQuestionTotal: number
  materialPoolQuestionTotal: number
  materialPreviewCount: number
  materialPreviewSignature: string
  materialGroupShortfallText: string
  materialIsPreparing: boolean
  materialPoolStatusLabel: string
  materialPreviewItems: MaterialPreviewItem[]
  canStartMaterialMock: boolean
}>()

const emit = defineEmits<{
  pickFiles: []
  pickFolder: []
  'update:activeFilter': [value: string]
  'update:page': [value: number]
  'update:materialCompileCount': [value: number]
  'update:materialOrderMode': [value: 'chapter' | 'random']
  'update:materialTopicFilter': [value: PersistedTopicKey | 'all']
  'select-document': [value: string]
  'delete-document': [value: string]
  'update-document-categories': [payload: { documentId: string, name: string, tags: string[] }]
  prepareMaterial: []
  startMaterialMock: []
}>()

const materialCountMin = 1
/** 组卷题数草稿：仅在本组件内维护，失焦/生成前才规范化，不随父层 props 自动回写 */
const localMaterialCompileCount = ref(props.materialCompileCount)
const materialCompileCountInput = ref(String(props.materialCompileCount))
const localMaterialOrderMode = ref(props.materialOrderMode)
const localMaterialTopicFilter = ref<PersistedTopicKey | 'all'>(props.materialTopicFilter)

const materialCountMaxLimit = computed(() => (
  Math.max(materialCountMin, props.materialCompileCountMax || materialCountMin)
))

const effectiveQuestionTotal = computed(() => (
  props.materialFilteredQuestionTotal > 0
    ? props.materialFilteredQuestionTotal
    : props.materialPoolQuestionTotal
))

const canShuffleMaterialGroup = computed(() => (
  effectiveQuestionTotal.value > 0 && !props.materialIsPreparing
))

const activeRoundCount = computed(() => clampMaterialCompileCount(materialCompileCountInput.value))

/** 草稿与上次「生成练习题」已应用的组卷设置一致时，才允许开始模拟面试 */
const materialCompileDraftApplied = computed(() => (
  activeRoundCount.value === props.materialCompileCount
  && localMaterialOrderMode.value === props.materialOrderMode
  && localMaterialTopicFilter.value === props.materialTopicFilter
))

const hasMaterialPreview = computed(() => props.materialPreviewItems.length > 0)

const canStartMaterialMockNow = computed(() => (
  props.canStartMaterialMock && materialCompileDraftApplied.value
))

const materialCountFieldLabel = computed(() => (
  effectiveQuestionTotal.value > 0
    ? `本轮题数（最多 ${ materialCountMaxLimit.value } 题）`
    : '本轮题数（点击生成练习题后生效）'
))

const materialPreviewPendingHint = computed(() => {
  if (materialCompileDraftApplied.value || !hasMaterialPreview.value) return ''
  return '有变更，请重新生成'
})

/** 右上角徽章：反映当前预览/已组卷的本轮题数，与左侧总题数区分 */
const materialRoundBadgeLabel = computed(() => {
  if (props.materialIsPreparing) return '生成中…'
  if (props.materialPoolQuestionTotal === 0) return props.materialPoolStatusLabel
  if (!hasMaterialPreview.value) return '待组卷'
  return `本轮 ${ props.materialPreviewCount } 题`
})

const materialPoolTotalLabel = computed(() => {
  if (props.materialPoolQuestionTotal <= 0) return ''
  if (
    props.materialTopicFilter !== 'all'
    && props.materialFilteredQuestionTotal > 0
  ) {
    const topicLabel = props.topicLabelMap[props.materialTopicFilter] || props.materialTopicFilter
    return `总 ${ props.materialPoolQuestionTotal } 题 · ${ topicLabel } ${ props.materialFilteredQuestionTotal } 题`
  }
  return `总 ${ props.materialPoolQuestionTotal } 题`
})

const showMaterialTopicFilter = computed(() => (
  props.materialPoolQuestionTotal > 0 && props.materialTopicTabs.length > 0
))

watch(() => props.selectedDocumentId, () => {
  localMaterialOrderMode.value = props.materialOrderMode
  localMaterialTopicFilter.value = 'all'
})

const clampMaterialCompileCount = (raw: string | number) => {
  const parsed = typeof raw === 'number'
    ? raw
    : Number.parseInt(String(raw).trim(), 10)
  let next = Number.isFinite(parsed) ? parsed : materialCountMin
  next = Math.max(materialCountMin, next)
  if (effectiveQuestionTotal.value > 0) {
    next = Math.min(materialCountMaxLimit.value, next)
  }
  return next
}

const commitMaterialCompileCountDraft = () => {
  const next = clampMaterialCompileCount(materialCompileCountInput.value)
  localMaterialCompileCount.value = next
  materialCompileCountInput.value = String(next)
  return next
}

const handleMaterialCountBlur = (event: FocusEvent) => {
  // 失焦时以 DOM 当前值为准，避免最后一次按键尚未写入 ref 就被规范化
  materialCompileCountInput.value = (event.target as HTMLInputElement).value
  commitMaterialCompileCountDraft()
}

const resolveDraftCompileCount = () => commitMaterialCompileCountDraft()

const handlePrepareMaterialClick = () => {
  const count = resolveDraftCompileCount()
  emit('update:materialCompileCount', count)
  emit('update:materialOrderMode', localMaterialOrderMode.value)
  emit('update:materialTopicFilter', localMaterialTopicFilter.value)
  materialPreviewPageIndex.value = 0
  emit('prepareMaterial')
}

const notifyMaterialAction = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
  if (type === 'warning') {
    window.$ModalMessage?.warning?.(message, { duration: 2000, closable: false })
    return
  }
  if (type === 'info') {
    window.$ModalMessage?.info?.(message, { duration: 2000, closable: false })
    return
  }
  window.$ModalMessage?.success?.(message, { duration: 2000, closable: false })
}

const handleMaterialOrderModeSelect = (orderMode: 'chapter' | 'random') => {
  if (localMaterialOrderMode.value === orderMode) return
  localMaterialOrderMode.value = orderMode
}

const handleMaterialTopicFilterSelect = (topicKey: PersistedTopicKey | 'all') => {
  if (localMaterialTopicFilter.value === topicKey) return
  localMaterialTopicFilter.value = topicKey
}

const selectAllMaterialCount = () => {
  if (!canShuffleMaterialGroup.value) {
    notifyMaterialAction('请先生成练习题以获取题库容量', 'warning')
    return
  }
  localMaterialCompileCount.value = materialCountMaxLimit.value
  materialCompileCountInput.value = String(materialCountMaxLimit.value)
  materialPreviewPageIndex.value = 0
  notifyMaterialAction(`已选全部 ${ materialCountMaxLimit.value } 题，点击生成练习题后生效`, 'info')
}

const sourceLabelText = (document: Pick<LibraryDocumentItem, 'importedName' | 'name' | 'sourceKey'>) => (
  resolveLibraryDocumentSourceLabel(document, props.sourceLabelMap)
)

const pendingDeleteDocument = ref<{ id: string; name: string } | null>(null)

const showDeleteConfirm = computed({
  get: () => Boolean(pendingDeleteDocument.value),
  set: (value: boolean) => {
    if (!value) {
      pendingDeleteDocument.value = null
    }
  }
})

const deleteConfirmMessage = computed(() => {
  if (!pendingDeleteDocument.value) return ''
  return `确定删除「${ pendingDeleteDocument.value.name }」吗？删除后不可恢复，关联练习题组也会一并清除。`
})

const handleDeleteDocumentRequest = (doc: LibraryDocumentItem) => {
  pendingDeleteDocument.value = {
    id: doc.id,
    name: doc.name
  }
}

const handleDeleteDocumentConfirm = () => {
  if (!pendingDeleteDocument.value) return
  emit('delete-document', pendingDeleteDocument.value.id)
  pendingDeleteDocument.value = null
}

const placeholderItems = computed(() => {
  const placeholderCount = Math.max(0, 5 - props.displayedDocuments.length)
  return Array.from({ length: placeholderCount }, (_, index) => `placeholder-${index}`)
})

/** 资料题组预览每页 2 题，为下方文档预览卡片留出可视高度 */
const materialPreviewPageSize = 2
const materialPreviewPageIndex = ref(0)

const materialPreviewPageCount = computed(() => {
  const total = props.materialPreviewItems.length
  if (!total) return 0
  return Math.ceil(total / materialPreviewPageSize)
})

const materialPreviewPagedItems = computed(() => {
  const start = materialPreviewPageIndex.value * materialPreviewPageSize
  return props.materialPreviewItems.slice(start, start + materialPreviewPageSize)
})

const materialPreviewHasNextPage = computed(() => (
  materialPreviewPageIndex.value < materialPreviewPageCount.value - 1
))

const materialPreviewHasPrevPage = computed(() => materialPreviewPageIndex.value > 0)

const resolveMaterialPreviewItemOrder = (indexOnPage: number) => (
  materialPreviewPageIndex.value * materialPreviewPageSize + indexOnPage + 1
)

const goToNextMaterialPreviewPage = () => {
  if (!materialPreviewHasNextPage.value) return
  materialPreviewPageIndex.value += 1
}

const goToPrevMaterialPreviewPage = () => {
  if (!materialPreviewHasPrevPage.value) return
  materialPreviewPageIndex.value -= 1
}

watch(
  () => [
    props.selectedDocumentId,
    props.materialCompileCount,
    props.materialOrderMode,
    props.materialTopicFilter,
    props.materialPreviewSignature
  ].join('::'),
  () => {
    materialPreviewPageIndex.value = 0
  }
)

const sceneShellRef = ref<HTMLElement | null>(null)
const stickyMotion = ref('translate3d(0, 0, 0)')

let scrollTarget: HTMLElement | Window | null = null
let lastScrollTop = 0
let targetOffset = 0
let currentOffset = 0
let motionFrame = 0
let settleTimer: ReturnType<typeof window.setTimeout> | null = null

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value))
}

const getScrollTop = () => {
  if (!scrollTarget) return 0
  return scrollTarget instanceof Window ? scrollTarget.scrollY : scrollTarget.scrollTop
}

const stopMotionFrame = () => {
  if (!motionFrame) return
  window.cancelAnimationFrame(motionFrame)
  motionFrame = 0
}

const tickStickyMotion = () => {
  const nextOffset = currentOffset + (targetOffset - currentOffset) * 0.16
  currentOffset = Math.abs(nextOffset) < 0.08 && Math.abs(targetOffset) < 0.08 ? 0 : nextOffset
  stickyMotion.value = `translate3d(0, ${ currentOffset.toFixed(2) }px, 0)`

  if (Math.abs(currentOffset - targetOffset) > 0.08 || Math.abs(currentOffset) > 0.08) {
    motionFrame = window.requestAnimationFrame(tickStickyMotion)
    return
  }

  motionFrame = 0
}

const scheduleStickyMotion = () => {
  if (!motionFrame) {
    motionFrame = window.requestAnimationFrame(tickStickyMotion)
  }
}

const handleStickyScroll = () => {
  const nextScrollTop = getScrollTop()
  const delta = nextScrollTop - lastScrollTop
  lastScrollTop = nextScrollTop

  targetOffset = clamp(delta * 0.32, -18, 18)
  scheduleStickyMotion()

  if (settleTimer) {
    window.clearTimeout(settleTimer)
  }

  settleTimer = window.setTimeout(() => {
    targetOffset = 0
    scheduleStickyMotion()
  }, 80)
}

onMounted(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return

  scrollTarget = sceneShellRef.value?.closest('.interview-space-showcase') as HTMLElement | null
  scrollTarget = scrollTarget || window
  lastScrollTop = getScrollTop()
  scrollTarget.addEventListener('scroll', handleStickyScroll, {
    passive: true
  })
})

onBeforeUnmount(() => {
  if (scrollTarget) {
    scrollTarget.removeEventListener('scroll', handleStickyScroll)
  }
  if (settleTimer) {
    window.clearTimeout(settleTimer)
  }
  stopMotionFrame()
})
</script>

<template>
  <div
    ref="sceneShellRef"
    class="library-scene-shell"
  >
    <SpaceSceneHeader
      :title="sectionTitle"
      :body="sectionBody"
    />

    <section class="library-scene-intro">
      <h3>{{ workspaceTitle }}</h3>
      <p>{{ workspaceDesc }}</p>
    </section>

    <div class="library-body-grid">
      <main class="library-main-column">
        <ImportActionCard
          dark
          :emphasize-import="true"
          :helper-text="nextStepTitle"
          :feedback-text="showImportFeedback ? importFeedbackText : ''"
          @pick-files="emit('pickFiles')"
          @pick-folder="emit('pickFolder')"
        />

        <div class="library-stat-grid">
          <LibraryStatCard
            v-for="item in derivedStats"
            :key="item.label"
            :label="item.label"
            :value="item.value"
            :note="item.note"
            :tone="item.tone"
          />
        </div>

        <section class="library-filter-shell">
          <div class="library-filter-head">
            <div>
              <div class="overview-progress-label">筛选与分类</div>
              <strong>按主题、格式和上下文整理你的资料</strong>
            </div>
            <span>{{ nextStepDesc }}</span>
          </div>

          <div class="library-filter-row">
            <LibraryFilterTabs
              :tabs="filterTabs"
              :active-key="activeFilter"
              @change="emit('update:activeFilter', $event)"
            />
            <div class="library-filter-count">
              共 {{ filteredCount }} 份资料
            </div>
          </div>
        </section>

        <div class="library-document-panel">
        <div class="library-document-list-shell">
        <div
          class="library-document-list"
          :class="{ 'is-hidden': !isListVisible }"
        >
          <DocumentListItem
            v-for="doc in displayedDocuments"
            :id="doc.id"
            :key="doc.id"
            :name="doc.name"
            :type="doc.type"
            :size-text="formatBytes(doc.size)"
            :imported-at="doc.importedAt"
            :tags="doc.tags"
            :status="doc.status"
            :source-label="sourceLabelText(doc)"
            :active="doc.id === selectedDocumentId"
            active-label="当前训练资料"
            deletable
            editable
            category-editor-dark
            :existing-custom-tags="customCategoryLabels"
            @select="emit('select-document', doc.id)"
            @delete="handleDeleteDocumentRequest(doc)"
            @update-profile="emit('update-document-categories', { documentId: doc.id, ...$event })"
          />
          <div
            v-for="placeholder in placeholderItems"
            :key="placeholder"
            class="library-document-placeholder"
            aria-hidden="true"
          ></div>
        </div>

        </div>

        <div
          v-if="pageCount > 1"
          class="library-pagination-row"
        >
          <Pagination
            :page="currentPage"
            :page-count="pageCount"
            @update:page="emit('update:page', $event)"
            @change="emit('update:page', $event)"
          />
        </div>
        </div>

      </main>

      <aside class="library-sticky-column">
        <div
          class="library-sticky-card-stack"
          :style="{ transform: stickyMotion }"
        >
          <Transition
            name="library-preview"
            mode="out-in"
          >
            <article
              v-if="selectedDocument"
              :key="`material-${selectedDocument.id}`"
              class="library-material-card"
            >
              <div class="material-card-head">
                <div class="material-card-title-row">
                  <div class="stat-label">资料练习题</div>
                  <span
                    v-if="materialPoolTotalLabel"
                    class="material-pool-total"
                  >
                    {{ materialPoolTotalLabel }}
                  </span>
                </div>
                <div class="material-pool-badge">{{ materialRoundBadgeLabel }}</div>
              </div>
              <div class="material-action-row">
                <button
                  type="button"
                  class="overview-action primary"
                  :disabled="materialIsPreparing"
                  @click="handlePrepareMaterialClick"
                >
                  {{ materialIsPreparing ? '生成中…' : '生成练习题' }}
                </button>
                <button
                  type="button"
                  class="overview-action"
                  :disabled="!canStartMaterialMockNow"
                  @click="emit('startMaterialMock')"
                >
                  预览并开始模拟面试
                </button>
              </div>
              <div class="material-count-field">
                <span class="material-count-field-head">
                  <span class="material-count-field-label-row">
                    <span>{{ materialCountFieldLabel }}</span>
                    <span
                      v-if="materialPreviewPendingHint"
                      class="material-draft-hint-inline"
                      aria-live="polite"
                    >
                      {{ materialPreviewPendingHint }}
                    </span>
                  </span>
                  <button
                    type="button"
                    class="material-count-all-button"
                    :disabled="!canShuffleMaterialGroup"
                    @click="selectAllMaterialCount"
                  >
                    练全部
                  </button>
                </span>
                <input
                  v-model="materialCompileCountInput"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  @blur="handleMaterialCountBlur"
                >
              </div>
              <div class="material-order-mode-row">
                <button
                  type="button"
                  class="material-order-mode-button"
                  :class="{ 'is-active': localMaterialOrderMode === 'chapter' }"
                  @click="handleMaterialOrderModeSelect('chapter')"
                >
                  <span class="material-order-mode-button__label">顺序组卷</span>
                  <span class="material-order-mode-button__desc">按资料章节</span>
                </button>
                <button
                  type="button"
                  class="material-order-mode-button"
                  :class="{ 'is-active': localMaterialOrderMode === 'random' }"
                  @click="handleMaterialOrderModeSelect('random')"
                >
                  <span class="material-order-mode-button__label">随机组卷</span>
                  <span class="material-order-mode-button__desc">打乱顺序</span>
                </button>
              </div>
              <div
                v-if="showMaterialTopicFilter"
                class="material-topic-filter-row"
              >
                <span class="material-topic-filter-label">题目主题</span>
                <div class="material-topic-filter-chips">
                  <button
                    type="button"
                    class="material-topic-chip"
                    :class="{ 'is-active': localMaterialTopicFilter === 'all' }"
                    @click="handleMaterialTopicFilterSelect('all')"
                  >
                    全部
                    <em>{{ materialPoolQuestionTotal }}</em>
                  </button>
                  <button
                    v-for="tab in materialTopicTabs"
                    :key="tab.key"
                    type="button"
                    class="material-topic-chip"
                    :class="{ 'is-active': localMaterialTopicFilter === tab.key }"
                    @click="handleMaterialTopicFilterSelect(tab.key)"
                  >
                    {{ tab.label }}
                    <em>{{ tab.count }}</em>
                  </button>
                </div>
              </div>
              <p
                v-if="hasMaterialPreview && materialGroupShortfallText"
                class="material-shortfall-note"
              >
                {{ materialGroupShortfallText }}
              </p>
              <div
                v-if="hasMaterialPreview"
                class="material-preview-body"
              >
                <div class="material-preview-body__content">
                  <Transition
                    name="material-preview-page-fade"
                    mode="out-in"
                  >
                    <ol
                      :key="`${materialPreviewPageIndex}-${materialPreviewSignature}`"
                      class="material-group-preview"
                    >
                      <li
                        v-for="(item, index) in materialPreviewPagedItems"
                        :key="item.questionId"
                      >
                        <span>{{ resolveMaterialPreviewItemOrder(index) }}.</span>
                        <strong>{{ item.title }}</strong>
                        <em>{{ item.difficulty }} · {{ item.matchReason }}</em>
                      </li>
                    </ol>
                  </Transition>
                </div>
                <div
                  v-if="materialPreviewPageCount > 1"
                  class="material-preview-page-nav-stack"
                >
                  <button
                    type="button"
                    class="material-preview-page-nav"
                    aria-label="预览下一页"
                    :disabled="!materialPreviewHasNextPage"
                    @click="goToNextMaterialPreviewPage"
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
                    :disabled="!materialPreviewHasPrevPage"
                    @click="goToPrevMaterialPreviewPage"
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
                选好题数和组卷方式后，点击「生成练习题」预览本轮题目。
              </p>
            </article>
          </Transition>

          <Transition
            name="library-preview"
            mode="out-in"
          >
            <div
              v-if="selectedDocument"
              :key="`preview-${selectedDocument.id}`"
              class="library-preview-panel"
            >
              <DocumentPreviewPanel
                dark
                hide-summary
                compact-meta
                :preview-line-count="2"
                :name="selectedDocument.name"
                :type="selectedDocument.type"
                :imported-at="selectedDocument.importedAt"
                :summary="selectedDocument.summary"
                :tags="selectedDocument.tags"
                :status="selectedDocument.status"
                :topic-labels="selectedDocument.topicKeys.map((key: string) => topicLabelMap[key])"
                :source-label="sourceLabelText(selectedDocument)"
                :raw-text="selectedDocument.rawText"
              />
            </div>
          </Transition>
        </div>
      </aside>

      <div
        class="library-right-height-keeper"
        aria-hidden="true"
      ></div>
    </div>
  </div>

  <SpaceCosmosConfirm
    v-model:show="showDeleteConfirm"
    title="删除资料"
    :message="deleteConfirmMessage"
    confirm-text="删除"
    cancel-text="取消"
    confirm-tone="danger"
    @confirm="handleDeleteDocumentConfirm"
  />
</template>

<style lang="scss" scoped>
.overview-progress-label {
  display: block;
  color: rgb(220 232 255 / 0.62);
  font-size: 15px;
}

.overview-action {
  height: 46px;
  padding: 0 18px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.05);
  color: #fff;
  font: inherit;
  font-size: 16px;
  font-weight: 400;
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

.library-scene-shell,
.library-main-column,
.library-sticky-card-stack {
  display: grid;
  gap: 18px;
}

.library-scene-shell {
  margin-top: 0;
}

.library-body-grid {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(360px, 2fr);
  gap: 24px;
  align-items: start;
}

.library-main-column {
  grid-column: 1;
  grid-row: 1;
}

.library-sticky-column {
  grid-column: 2;
  grid-row: 1;
  position: sticky;
  top: 32px;
  align-self: start;
  height: 0;
  min-width: 0;
  overflow: visible;
}

.library-sticky-card-stack {
  position: relative;
  min-height: max-content;
  transform-origin: 50% 0;
  will-change: transform;
}

.library-right-height-keeper {
  grid-column: 2;
  grid-row: 1;
  min-height: 100%;
  visibility: hidden;
  pointer-events: none;
}

.library-right-height-keeper::before {
  display: block;
  min-height: 760px;
  content: '';
}

.library-preview-enter-active,
.library-preview-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease,
    filter 0.22s ease;
}

.library-preview-leave-active {
  pointer-events: none;
}

.library-preview-enter-from,
.library-preview-leave-to {
  opacity: 0;
  filter: blur(6px);
  transform: translateY(8px);
}

.library-preview-enter-to,
.library-preview-leave-from {
  opacity: 1;
  filter: blur(0);
  transform: translateY(0);
}

.library-scene-intro h3,
.library-filter-head strong {
  display: block;
  margin-top: 0;
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.25;
}

.library-scene-intro p,
.library-filter-head span {
  max-width: none;
  margin-top: 10px;
  color: rgb(228 238 255 / 0.74);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.7;
}

.library-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.library-filter-shell {
  display: grid;
  gap: 14px;
}

.library-filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.library-filter-count {
  flex: 0 0 auto;
  color: rgb(228 238 255 / 0.72);
  font-size: 15px;
  line-height: 1;
  white-space: nowrap;
}

.library-filter-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.library-document-panel {
  display: grid;
  gap: 18px;
}

.library-document-list-shell {
  --library-doc-card-height: 204px;
  box-sizing: border-box;
  height: calc(var(--library-doc-card-height) * 5 + 12px * 4 + 36px);
  padding: 18px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 28px;
  background: rgb(255 255 255 / 0.028);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
  overflow: hidden;
}

.library-document-list {
  display: grid;
  gap: 12px;
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 0.22s ease,
    transform 0.22s ease,
    filter 0.22s ease;
}

.library-pagination-row {
  display: flex;
  justify-content: center;
  min-height: 42px;
}

.library-document-list.is-hidden {
  opacity: 0;
  filter: blur(6px);
  transform: translateY(10px);
}

.library-scene-shell :deep(.import-card),
.library-scene-shell :deep(.stat-card),
.library-document-list :deep(.doc-item),
.library-material-card,
.library-preview-panel {
  border-color: rgb(255 255 255 / 0.18);
  background: rgb(255 255 255 / 0.035);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
}

.library-document-list :deep(.doc-item) {
  height: var(--library-doc-card-height);
}

.library-document-placeholder {
  height: var(--library-doc-card-height);
  border-radius: 20px;
  opacity: 0;
  pointer-events: none;
}

.library-scene-shell :deep(.stat-card) {
  min-height: 156px;
}

.library-material-card,
.library-preview-panel {
  border: 1px solid rgb(255 255 255 / 0.18);
  border-radius: 24px;
}

.library-material-card {
  padding: 8px 20px;
}

.library-preview-panel {
  padding: 18px 18px 20px;
}

.library-preview-panel :deep(.eyebrow),
.library-preview-panel :deep(.section-label) {
  font-size: 13px;
}

.library-preview-panel :deep(.preview-head--compact .preview-chip-row .preview-chip) {
  min-height: 34px;
  min-width: 56px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 600;
}

.library-preview-panel :deep(.preview-expand) {
  min-height: 34px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 600;
}

.library-preview-panel :deep(.preview-imported-at) {
  font-size: 12px;
  line-height: 34px;
}

.library-preview-panel :deep(.preview-text) {
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 0.12);
  background: rgb(255 255 255 / 0.045);
}

.library-preview-panel :deep(.preview-card),
.library-preview-panel :deep(.preview-card.is-dark),
.library-preview-panel :deep(.preview-card.is-compact) {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.library-scene-shell :deep(.eyebrow),
.library-scene-shell :deep(.section-label) {
  color: var(--scene-primary);
  font-size: 15px;
}

.library-scene-shell :deep(h2),
.library-scene-shell :deep(.stat-value),
.library-document-list :deep(.doc-title) {
  color: #fff;
}

.library-scene-shell :deep(p),
.library-scene-shell :deep(.stat-note),
.library-scene-shell :deep(.stat-label),
.library-scene-shell :deep(.import-helper),
.library-scene-shell :deep(.import-meta),
.library-scene-shell :deep(.import-meta span),
.library-document-list :deep(.doc-meta),
.library-document-list :deep(.doc-source),
.library-document-list :deep(.doc-reason) {
  max-width: none;
  color: rgb(228 238 255 / 0.72);
  font-size: 15px;
}

.library-scene-shell :deep(.import-actions.is-emphasis) {
  background: rgb(255 255 255 / 0.06);
}

.library-scene-shell :deep(.import-feedback) {
  border-color: rgb(120 255 204 / 0.18);
  background: rgb(62 198 138 / 0.12);
  color: rgb(211 255 236 / 0.96);
}

.library-scene-shell :deep(.n-button:not(.n-button--primary-type)) {
  color: #d6ddff;
}

.library-document-list :deep(.doc-tag),
.library-document-list :deep(.category-editor-tag) {
  background: rgb(255 255 255 / 0.08);
  color: rgb(241 246 255 / 0.84);
  font-size: 15px;
}

.library-document-list :deep(.doc-type) {
  background: transparent;
  color: #dfe5ff;
  font-size: 15px;
}

.library-document-list :deep(.doc-status.is-parsed) {
  background: rgb(121 255 204 / 0.16);
  color: rgb(216 255 238 / 0.98);
  font-size: 15px;
}

.library-document-list :deep(.doc-status.is-pending) {
  background: rgb(255 218 132 / 0.14);
  color: rgb(255 234 191 / 0.98);
  font-size: 15px;
}

.library-document-list :deep(.doc-item:hover),
.library-document-list :deep(.doc-item.is-active) {
  border-color: rgb(255 255 255 / 0.22);
  background: rgb(255 255 255 / 0.055);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.05);
}

.library-document-list :deep(.doc-item-action) {
  height: auto;
  padding: 6px 10px;
  font-size: 14px;
  font-weight: 600;
}

.library-document-list :deep(.doc-item-action--edit) {
  border-color: rgb(255 255 255 / 0.14);
  background: rgb(255 255 255 / 0.06);
  color: rgb(220 232 255 / 0.92);
}

.library-document-list :deep(.doc-item-action--edit:hover) {
  border-color: rgb(198 206 255 / 0.36);
  background: rgb(198 206 255 / 0.16);
  color: #fff;
}

.library-document-list :deep(.doc-item-action--delete) {
  border-color: rgb(255 120 120 / 24%);
  background: rgb(255 255 255 / 4%);
  color: rgb(255 186 186 / 96%);
}

.library-document-list :deep(.doc-item-action--delete:hover) {
  border-color: rgb(255 140 140 / 0.42);
  background: rgb(255 90 90 / 0.12);
  color: rgb(255 214 214 / 0.98);
}

.library-pagination-row :deep(.pagination-container) {
  padding: 4px 0 0;
}

.library-pagination-row :deep(.pagination-container > *) {
  margin-left: 8px;
}

.library-pagination-row :deep(.pagination-container > *:first-child) {
  margin-left: 0;
}

.library-pagination-row :deep(.pagination-container .c-primary) {
  min-width: 38px;
  height: 38px;
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  color: rgb(228 238 255 / 0.9);
  font-size: 15px;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.library-pagination-row :deep(.pagination-container .c-primary:hover) {
  border-color: rgb(255 255 255 / 0.24);
  background: rgb(255 255 255 / 0.08);
  transform: translateY(-1px);
}

.library-pagination-row :deep(.pagination-container .b-primary) {
  border-color: rgb(203 230 255 / 0.34);
  background: rgb(191 224 255 / 0.16);
  color: #fff;
}

.library-pagination-row :deep(.pagination-container) {
  padding: 4px 0 0;
}

.library-pagination-row :deep(.pagination-container > *) {
  margin-left: 8px;
}

.library-pagination-row :deep(.pagination-container > *:first-child) {
  margin-left: 0;
}

.library-pagination-row :deep(.pagination-container .c-primary) {
  min-width: 38px;
  height: 38px;
  border: 1px solid rgb(255 255 255 / 0.16);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  color: rgb(228 238 255 / 0.9);
  font-size: 15px;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.library-pagination-row :deep(.pagination-container .c-primary:hover) {
  border-color: rgb(255 255 255 / 0.24);
  background: rgb(255 255 255 / 0.08);
  transform: translateY(-1px);
}

.library-pagination-row :deep(.pagination-container .b-primary) {
  border-color: rgb(203 230 255 / 0.34);
  background: rgb(191 224 255 / 0.16);
  color: #fff;
}

.library-material-card {
  display: grid;
  gap: 12px;
}

.material-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.material-card-title-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.material-pool-total {
  color: rgb(186 245 255 / 0.72);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
}

.material-pool-badge {
  display: inline-flex;
  flex: 0 0 auto;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgb(186 245 255 / 0.12);
  color: #baf5ff;
  font-size: 13px;
}

.material-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.material-count-field {
  display: grid;
  gap: 6px;
  color: rgb(220 232 255 / 0.72);
  font-size: 14px;
}

.material-count-field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.material-count-field-label-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.material-draft-hint-inline {
  color: rgb(186 245 255 / 0.88);
  font: inherit;
  line-height: inherit;
  white-space: nowrap;
}

.material-count-all-button {
  padding: 2px 10px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
  color: rgb(228 236 255 / 0.9);
  font-size: 12px;
  cursor: pointer;
}

.material-count-all-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.material-order-mode-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.material-order-mode-button {
  display: grid;
  gap: 2px;
  flex: 1 1 0;
  min-width: 108px;
  min-height: 48px;
  padding: 8px 12px;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 12px;
  background: rgb(255 255 255 / 0.04);
  color: rgb(229 236 255 / 0.86);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 120ms ease,
    box-shadow 160ms ease;
}

.material-order-mode-button__label {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.material-order-mode-button__desc {
  color: rgb(223 231 252 / 0.68);
  font-size: 12px;
  line-height: 1.35;
}

.material-order-mode-button:hover:not(:disabled) {
  border-color: rgb(168 154 255 / 0.34);
  background: rgb(112 94 219 / 0.14);
  transform: translateY(-1px);
}

.material-order-mode-button:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.material-order-mode-button.is-active {
  border-color: rgb(186 168 255 / 0.72);
  background: linear-gradient(180deg, rgb(132 108 255 / 0.38) 0%, rgb(96 74 228 / 0.32) 100%);
  box-shadow:
    0 0 0 1px rgb(186 168 255 / 0.28),
    0 8px 20px rgb(72 52 168 / 0.28);
  color: rgb(247 249 255 / 0.98);
}

.material-order-mode-button.is-active .material-order-mode-button__desc {
  color: rgb(236 242 255 / 0.88);
}

.material-order-mode-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.material-topic-filter-row {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.material-topic-filter-label {
  color: rgb(223 231 252 / 0.72);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.material-topic-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.material-topic-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  color: rgb(236 242 255 / 0.88);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease;
}

.material-topic-chip em {
  color: rgb(223 231 252 / 0.62);
  font-style: normal;
  font-weight: 500;
}

.material-topic-chip:hover {
  border-color: rgb(168 154 255 / 0.34);
  background: rgb(112 94 219 / 0.14);
}

.material-topic-chip.is-active {
  border-color: rgb(186 168 255 / 0.72);
  background: linear-gradient(180deg, rgb(132 108 255 / 0.38) 0%, rgb(96 74 228 / 0.32) 100%);
}

.material-count-all-button:hover:not(:disabled) {
  border-color: rgb(168 154 255 / 0.34);
  background: rgb(112 94 219 / 0.18);
}

.material-count-all-button:active:not(:disabled) {
  transform: scale(0.97);
}

.material-count-field input {
  width: 88px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 10px;
  background: rgb(255 255 255 / 0.04);
  color: #fff;
  font: inherit;
  appearance: textfield;
  -moz-appearance: textfield;
}

.material-count-field input::-webkit-outer-spin-button,
.material-count-field input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.material-shortfall-note,
.material-empty-note {
  margin: 0;
  color: rgb(255 214 153 / 0.92);
  font-size: 13px;
  line-height: 1.5;
}

.material-preview-body {
  position: relative;
  min-height: 132px;
}

.material-preview-body__content {
  min-height: inherit;
  padding-right: 52px;
}

.material-preview-page-nav-stack {
  position: absolute;
  top: 50%;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transform: translateY(-50%);
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
  transition: transform 0.28s ease;
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

.material-group-preview {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: rgb(235 244 255 / 0.88);
  font-size: 13px;
  line-height: 1.4;
}

.material-group-preview li {
  display: grid;
  gap: 2px;
}

.material-group-preview strong {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-weight: 600;
}

.material-group-preview em {
  overflow: hidden;
  color: rgb(186 245 255 / 0.72);
  font-style: normal;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .library-sticky-card-stack {
    transform: none !important;
    will-change: auto;
  }
}

@media (max-width: 1180px) {
  .library-body-grid {
    grid-template-columns: 1fr;
  }

  .library-sticky-column {
    grid-column: auto;
    grid-row: auto;
    position: static;
    height: auto;
    overflow: visible;
  }

  .library-right-height-keeper {
    display: none;
  }
}

@media (max-width: 1100px) {
  .library-stat-grid {
    grid-template-columns: 1fr;
  }

  .library-filter-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

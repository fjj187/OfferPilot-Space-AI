<script setup lang="tsx">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import DocumentListItem from '@/components/library/DocumentListItem.vue'
import DocumentPreviewPanel from '@/components/library/DocumentPreviewPanel.vue'
import ImportActionCard from '@/components/library/ImportActionCard.vue'
import LibraryFilterTabs from '@/components/library/LibraryFilterTabs.vue'
import LibraryStatCard from '@/components/library/LibraryStatCard.vue'
import SpaceSceneHeader from '@/components/showcase/mock-interview-space/SpaceSceneHeader.vue'

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

const props = defineProps<{
  sectionTitle: string
  sectionBody: string
  workspaceTitle: string
  workspaceDesc: string
  nextStepTitle: string
  nextStepDesc: string
  derivedStats: LibraryStatItem[]
  filterTabs: LibraryFilterTab[]
  activeFilter: string
  selectedDocument: SelectedLibraryDocument | null
  selectedDocumentId: string
  topicLabelMap: Record<string, string>
  sourceLabelMap: Record<string, string>
  displayedDocuments: LibraryDocumentItem[]
  isListVisible: boolean
  showImportFeedback: boolean
  importFeedbackText: string
  formatBytes: (size: number) => string
}>()

const emit = defineEmits<{
  pickFiles: []
  pickFolder: []
  'update:activeFilter': [value: string]
  'select-document': [value: string]
  primaryAction: []
  backOverview: []
  openReport: []
}>()

const sourceLabelText = (sourceKey?: string) => {
  return sourceKey ? (props.sourceLabelMap[sourceKey] || sourceKey) : ''
}

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

          <LibraryFilterTabs
            :tabs="filterTabs"
            :active-key="activeFilter"
            @change="emit('update:activeFilter', $event)"
          />
        </section>

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
            :source-label="sourceLabelText(doc.sourceKey)"
            :recommended-reason="doc.recommendedReason"
            :active="doc.id === selectedDocumentId"
            active-label="当前训练资料"
            @select="emit('select-document', doc.id)"
          />
        </div>

        <div class="overview-action-row">
          <button
            type="button"
            class="overview-action primary"
            @click="emit('primaryAction')"
          >
            去模拟面试
          </button>
          <button
            type="button"
            class="overview-action"
            @click="emit('backOverview')"
          >
            返回总览
          </button>
          <button
            type="button"
            class="overview-action"
            @click="emit('openReport')"
          >
            查看报告
          </button>
        </div>
      </main>

      <aside class="library-sticky-column">
        <div
          class="library-sticky-card-stack"
          :style="{ transform: stickyMotion }"
        >
          <Transition name="library-preview">
            <article
              v-if="selectedDocument"
              :key="`current-${selectedDocument.id}`"
              class="library-current-stat-card"
            >
              <div class="stat-label">当前训练资料</div>
              <strong>{{ selectedDocument.name }}</strong>
              <p>去模拟面试时，会直接承接这份资料作为当前训练上下文。</p>
            </article>
          </Transition>

          <Transition name="library-preview">
            <div
              v-if="selectedDocument"
              :key="`preview-${selectedDocument.id}`"
              class="library-preview-panel"
            >
              <DocumentPreviewPanel
                dark
                :preview-line-count="5"
                :name="selectedDocument.name"
                :type="selectedDocument.type"
                :imported-at="selectedDocument.importedAt"
                :summary="selectedDocument.summary"
                :tags="selectedDocument.tags"
                :status="selectedDocument.status"
                :topic-labels="selectedDocument.topicKeys.map((key: string) => topicLabelMap[key])"
                :source-label="selectedDocument.sourceKey ? (sourceLabelMap[selectedDocument.sourceKey] || selectedDocument.sourceKey) : ''"
                :recommended-reason="selectedDocument.recommendedReason"
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
</template>

<style lang="scss" scoped>
.overview-progress-label {
  display: block;
  color: rgb(220 232 255 / 0.62);
  font-size: 15px;
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
  min-height: 920px;
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
  position: absolute;
  right: 0;
  left: 0;
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

.library-current-stat-card {
  width: 100%;
  min-height: 0;
  padding: 20px 24px 18px;
  border: 1px solid rgb(255 255 255 / 0.18);
  border-radius: 24px;
  background: rgb(255 255 255 / 0.035);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
}

.library-current-stat-card strong {
  display: block;
  margin-top: 10px;
  color: #fff;
  font-size: clamp(24px, 2.6vw, 34px);
  font-weight: 800;
  line-height: 1.08;
}

.library-current-stat-card p {
  margin: 12px 0 0;
  color: rgb(228 238 255 / 0.72);
  font-size: 17px;
  line-height: 1.5;
}

.library-filter-shell {
  display: grid;
  gap: 14px;
}

.library-filter-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
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

.library-document-list.is-hidden {
  opacity: 0;
  filter: blur(6px);
  transform: translateY(10px);
}

.library-scene-shell :deep(.import-card),
.library-scene-shell :deep(.stat-card),
.library-document-list :deep(.doc-item) {
  border-color: rgb(255 255 255 / 0.18);
  background: rgb(255 255 255 / 0.035);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
}

.library-scene-shell :deep(.stat-card) {
  min-height: 156px;
}

.library-preview-panel {
  padding: 20px;
  border: 1px solid rgb(255 255 255 / 0.18);
  border-radius: 24px;
  background: rgb(255 255 255 / 0.035);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
}

.library-preview-panel :deep(.preview-card) {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.library-preview-panel :deep(.preview-text) {
  max-height: 280px;
  overflow: auto;
  border: 1px solid rgb(255 255 255 / 0.12);
  background: rgb(255 255 255 / 0.045);
}

.library-preview-panel :deep(.preview-expand) {
  font-size: 15px;
  font-weight: 700;
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

.library-document-list :deep(.doc-tag) {
  background: rgb(255 255 255 / 0.08);
  color: rgb(241 246 255 / 0.84);
  font-size: 15px;
}

.library-document-list :deep(.doc-type) {
  background: rgb(198 206 255 / 0.14);
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

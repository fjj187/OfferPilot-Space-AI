<script setup lang="ts">
import type { SceneItem } from '@/constants/showcase/mockInterviewSpaceScenes'
import type { PersistedInterviewFeedbackStyle, PersistedPracticePlan } from '@/types/workbench'
import SpaceGeneralScenePanel from '@/components/showcase/mock-interview-space/SpaceGeneralScenePanel.vue'
import SpaceMockScene from '@/components/showcase/mock-interview-space/scenes/SpaceMockScene.vue'
import SpacePracticeScene from '@/components/showcase/mock-interview-space/scenes/SpacePracticeScene.vue'
import SpaceReportScene from '@/components/showcase/mock-interview-space/scenes/SpaceReportScene.vue'

defineProps<{
  activeDocument: any
  activeInterviewDocumentMeta: string[]
  currentTopicLabel: string
  displayScene: SceneItem
  displayedLibraryDocuments: any[]
  formatLibraryBytes: (size: number) => string
  importFeedbackText: string
  isLibraryListVisible: boolean
  libraryCurrentPage: number
  libraryFilteredCount: number
  isMockCurrentSubmitted: boolean
  isMockStreaming: boolean
  libraryActiveFilter: string
  libraryDerivedStats: any[]
  libraryFilterTabs: any[]
  libraryNextStepDesc: string
  libraryNextStepTitle: string
  libraryPageCount: number
  librarySourceLabelMap: Record<string, string>
  libraryTopicLabelMap: Record<string, string>
  libraryWorkspaceDesc: string
  libraryWorkspaceTitle: string
  mockAnswerDraft: string
  mockAllMessages: any[]
  mockHintText: string
  mockMessages: any[]
  mockAnsweredCount: number
  mockCurrentQuestionPosition: number
  mockHasNextQuestion: boolean
  mockIsAwaitingSetup: boolean
  mockIsViewingHistoryPreview: boolean
  mockHasRecentHistory: boolean
  mockPanelMeta: string[]
  mockFeedbackStyle: PersistedInterviewFeedbackStyle
  mockQuestionThreads: any[]
  mockActiveQuestionThreadId: string
  mockPracticePlan: PersistedPracticePlan | null
  mockQuestionPrompt: string
  mockSessionStatusText: string
  mockStreamMode: string
  mockStreamModeLabel: string
  mockScrollVersion?: string
  mockStreamError?: string
  mockTotalCount: number
  mockSceneResetVersion: number
  overviewPrimaryActionLabel: string
  overviewProgressPercent: number
  overviewStatusLabel: string
  overviewSummaryItems: any[]
  reportHeaderMeta: string[]
  reportAnswerSnapshot: string[]
  reportFocusAreas: string[]
  reportLatestHistory: any
  reportOverviewStats: any[]
  reportPrimaryWeakness: string
  reportSceneSummary: any
  reportSnapshotItems: any[]
  reportSummaryBody: string
  reportSummaryHeadline: string
  reportSuggestionList: string[]
  reportWeaknessTags: string[]
  selectedDocument: any
  selectedDocumentId: string
  showImportFeedback: boolean
  topicLabelMap: Record<string, string>
}>()

const emit = defineEmits<{
  backLibrary: []
  backOverview: []
  clearMockAnswer: []
  clearMockHistory: []
  continueMock: []
  continuePractice: []
  openMockLibrary: []
  openMockPractice: []
  openMock: []
  openPractice: []
  startPractice: [plan: any]
  openHistory: []
  openLibrary: []
  openReport: []
  openWorkbenchReport: []
  pickFiles: []
  pickFolder: []
  primaryAction: []
  resolveContentLead: [element: HTMLElement | null]
  resolveContentPanel: [element: HTMLElement | null]
  resolveContentSection: [element: HTMLElement | null]
  selectDocument: [value: string]
  selectMockQuestionThread: [value: string]
  finishMockSession: []
  nextMockQuestion: []
  stopMockStream: []
  submitMockAnswer: []
  updateMockFeedbackStyle: [value: PersistedInterviewFeedbackStyle]
  updateActiveFilter: [value: string]
  updateLibraryPage: [value: number]
  updateMockAnswerDraft: [value: string]
}>()

const contentSectionEl = ref<HTMLElement | null>(null)
const contentPanelEl = ref<HTMLElement | null>(null)
const contentLeadEl = ref<HTMLElement | null>(null)

const syncResolvedRefs = () => {
  emit('resolveContentSection', contentSectionEl.value)
  emit('resolveContentPanel', contentPanelEl.value)
  emit('resolveContentLead', contentLeadEl.value)
}

onMounted(() => {
  syncResolvedRefs()
})

onUpdated(() => {
  syncResolvedRefs()
})

onBeforeUnmount(() => {
  emit('resolveContentSection', null)
  emit('resolveContentPanel', null)
  emit('resolveContentLead', null)
})
</script>

<template>
  <section
    ref="contentSectionEl"
    class="content-stack"
  >
    <article
      ref="contentPanelEl"
      class="content-panel"
      :class="{ 'is-library': displayScene.id === 'library' }"
    >
      <div
        class="panel-inner"
        :class="{ 'is-library': displayScene.id === 'library' }"
      >
        <Transition
          mode="out-in"
          name="panel-swap"
        >
          <div
            :key="displayScene.id"
            ref="contentLeadEl"
            class="panel-swap-shell"
          >
            <template v-if="displayScene.id === 'report'">
              <SpaceReportScene
                :nav-label="displayScene.navLabel"
                :section-title="displayScene.sectionTitle"
                :section-body="displayScene.sectionBody"
                :header-meta="reportHeaderMeta"
                :answer-snapshot="reportAnswerSnapshot"
                :focus-areas="reportFocusAreas"
                :overview-stats="reportOverviewStats"
                :primary-weakness="reportPrimaryWeakness"
                :weakness-tags="reportWeaknessTags"
                :snapshot-items="reportSnapshotItems"
                :summary-body="reportSummaryBody"
                :summary-headline="reportSummaryHeadline"
                :suggestion-list="reportSuggestionList"
                :latest-history="reportLatestHistory"
                :current-topic-label="currentTopicLabel"
                :topic-label-map="topicLabelMap"
                :has-summary="Boolean(reportSceneSummary)"
                @continue-mock="$emit('continueMock')"
                @continue-practice="$emit('continuePractice')"
                @back-library="$emit('backLibrary')"
                @open-history="$emit('openHistory')"
                @open-workbench-report="$emit('openWorkbenchReport')"
              />
            </template>

            <template v-else>
              <SpaceMockScene
                v-if="displayScene.id === 'mock'"
                :key="`mock-${mockSceneResetVersion}`"
                :nav-label="displayScene.navLabel"
                :section-title="displayScene.sectionTitle"
                :section-body="displayScene.sectionBody"
                :panel-meta="mockPanelMeta"
                :feedback-style="mockFeedbackStyle"
                :all-messages="mockAllMessages"
                :source-meta="activeInterviewDocumentMeta"
                :knowledge-tags="activeDocument?.tags?.slice(0, 4) || reportWeaknessTags.slice(0, 4)"
                :question-threads="mockQuestionThreads"
                :active-question-thread-id="mockActiveQuestionThreadId"
                :question-prompt="mockQuestionPrompt"
                :hint-text="mockHintText"
                :messages="mockMessages"
                :answered-count="mockAnsweredCount"
                :current-question-position="mockCurrentQuestionPosition"
                :has-next-question="mockHasNextQuestion"
                :has-recent-history="mockHasRecentHistory"
                :is-awaiting-setup="mockIsAwaitingSetup"
                :is-viewing-history-preview="mockIsViewingHistoryPreview"
                :practice-plan="mockPracticePlan"
                :stream-mode="mockStreamMode"
                :stream-mode-label="mockStreamModeLabel"
                :scroll-version="mockScrollVersion"
                :answer-draft="mockAnswerDraft"
                :submitted="isMockCurrentSubmitted"
                :streaming="isMockStreaming"
                :stream-error="mockStreamError"
                :session-status-text="mockSessionStatusText"
                :total-count="mockTotalCount"
                @update:answer-draft="$emit('updateMockAnswerDraft', $event)"
                @submit="$emit('submitMockAnswer')"
                @finish="$emit('finishMockSession')"
                @next-question="$emit('nextMockQuestion')"
                @clear="$emit('clearMockAnswer')"
                @clear-history="$emit('clearMockHistory')"
                @open-library="$emit('openMockLibrary')"
                @open-history="$emit('openHistory')"
                @open-practice="$emit('openMockPractice')"
                @stop="$emit('stopMockStream')"
                @update:feedback-style="$emit('updateMockFeedbackStyle', $event)"
                @select-question-thread="$emit('selectMockQuestionThread', $event)"
              />
              <SpacePracticeScene
                v-else-if="displayScene.id === 'feedback'"
                :nav-label="displayScene.navLabel"
                :section-title="displayScene.sectionTitle"
                :section-body="displayScene.sectionBody"
                :primary-weakness="reportPrimaryWeakness"
                :report-summary="reportSceneSummary"
                :weakness-tags="reportWeaknessTags"
                @start-practice="$emit('startPractice', $event)"
                @open-report="$emit('openReport')"
              />
              <SpaceGeneralScenePanel
                v-else
                :display-scene="displayScene"
                :displayed-library-documents="displayedLibraryDocuments"
                :format-library-bytes="formatLibraryBytes"
                :import-feedback-text="importFeedbackText"
                :is-library-list-visible="isLibraryListVisible"
                :library-active-filter="libraryActiveFilter"
                :library-current-page="libraryCurrentPage"
                :library-filtered-count="libraryFilteredCount"
                :library-derived-stats="libraryDerivedStats"
                :library-filter-tabs="libraryFilterTabs"
                :library-next-step-desc="libraryNextStepDesc"
                :library-next-step-title="libraryNextStepTitle"
                :library-page-count="libraryPageCount"
                :library-source-label-map="librarySourceLabelMap"
                :library-topic-label-map="libraryTopicLabelMap"
                :library-workspace-desc="libraryWorkspaceDesc"
                :library-workspace-title="libraryWorkspaceTitle"
                :overview-primary-action-label="overviewPrimaryActionLabel"
                :overview-progress-percent="overviewProgressPercent"
                :overview-status-label="overviewStatusLabel"
                :overview-summary-items="overviewSummaryItems"
                :selected-document="selectedDocument"
                :selected-document-id="selectedDocumentId"
                :show-import-feedback="showImportFeedback"
                @pick-files="$emit('pickFiles')"
                @pick-folder="$emit('pickFolder')"
                @update-active-filter="$emit('updateActiveFilter', $event)"
                @update-library-page="$emit('updateLibraryPage', $event)"
                @select-document="$emit('selectDocument', $event)"
                @open-mock="$emit('openMock')"
                @open-practice="$emit('openPractice')"
                @back-overview="$emit('backOverview')"
                @open-library="$emit('openLibrary')"
                @open-report="$emit('openReport')"
                @primary-action="$emit('primaryAction')"
              />
            </template>
          </div>
        </Transition>
      </div>
    </article>
  </section>
</template>

<style lang="scss" scoped>
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

.content-panel.is-library {
  align-items: stretch;
}

.panel-inner {
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 66vh;
  padding: 42px 0;
}

.panel-inner.is-library {
  overflow: visible;
}

.panel-swap-shell {
  position: relative;
  z-index: 2;
  min-height: 560px;
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

@media (max-width: 780px) {
  .content-stack {
    padding-left: 18px;
    padding-right: 18px;
  }
}
</style>

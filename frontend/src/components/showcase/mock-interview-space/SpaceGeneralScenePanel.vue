<script lang="tsx" setup>
import type { PersistedTopicKey } from '@/types/workbench'
import type { SceneItem } from '@/constants/showcase/mockInterviewSpaceScenes'
import SpaceLibraryScene from '@/components/showcase/mock-interview-space/scenes/SpaceLibraryScene.vue'
import SpaceOverviewScene from '@/components/showcase/mock-interview-space/scenes/SpaceOverviewScene.vue'

defineProps<{
  displayScene: SceneItem
  displayedLibraryDocuments: any[]
  formatLibraryBytes: (size: number) => string
  importFeedbackText: string
  isLibraryListVisible: boolean
  libraryActiveFilter: string
  libraryCurrentPage: number
  libraryFilteredCount: number
  libraryDerivedStats: any[]
  libraryFilterTabs: any[]
  libraryCustomCategoryLabels: string[]
  libraryNextStepDesc: string
  libraryNextStepTitle: string
  libraryPageCount: number
  librarySourceLabelMap: Record<string, string>
  libraryTopicLabelMap: Record<string, string>
  libraryWorkspaceDesc: string
  libraryWorkspaceTitle: string
  overviewPrimaryActionLabel: string
  overviewProgressPercent: number
  overviewStatusLabel: string
  overviewSummaryItems: any[]
  overviewPracticeRouteNote: string
  selectedDocument: any
  selectedDocumentId: string
  showImportFeedback: boolean
  materialCompileCount: number
  materialCompileCountMax: number
  materialOrderMode: 'chapter' | 'random'
  materialTopicFilter: PersistedTopicKey | 'all'
  materialTopicTabs: Array<{
    key: PersistedTopicKey
    label: string
    count: number
  }>
  materialFilteredQuestionTotal: number
  materialPoolQuestionTotal: number
  materialPreviewCount: number
  materialPreviewSignature: string
  materialGroupShortfallText: string
  materialIsPreparing: boolean
  materialPoolStatusLabel: string
  materialPreviewItems: Array<{
    order: number
    title: string
    difficulty: string
    matchReason: string
  }>
  canStartMaterialMock: boolean
}>()

defineEmits<{
  backOverview: []
  openLibrary: []
  openMock: []
  openPractice: []
  primaryAction: []
  openReport: []
  pickFiles: []
  pickFolder: []
  selectDocument: [value: string]
  deleteDocument: [value: string]
  updateDocumentCategories: [payload: {
    documentId: string
    name: string
    tags: string[]
  }]
  updateActiveFilter: [value: string]
  updateLibraryPage: [value: number]
  updateMaterialCompileCount: [value: number]
  updateMaterialOrderMode: [value: 'chapter' | 'random']
  updateMaterialTopicFilter: [value: PersistedTopicKey | 'all']
  prepareMaterial: []
  startMaterialMock: []
}>()
</script>

<template>
  <div
    class="panel-grid"
    :class="{
      'is-library': displayScene.id === 'library',
      'is-overview': displayScene.id === 'overview'
    }"
  >
    <div>
      <SpaceOverviewScene
        v-if="displayScene.id === 'overview'"
        :section-title="displayScene.sectionTitle"
        :section-body="displayScene.sectionBody"
        :progress-percent="overviewProgressPercent"
        :status-label="overviewStatusLabel"
        :summary-items="overviewSummaryItems"
        :primary-action-label="overviewPrimaryActionLabel"
        :practice-route-note="overviewPracticeRouteNote"
        @primary-action="$emit('primaryAction')"
        @open-library="$emit('openLibrary')"
        @open-practice="$emit('openPractice')"
        @open-report="$emit('openReport')"
      />

      <SpaceLibraryScene
        v-else-if="displayScene.id === 'library'"
        :section-title="displayScene.sectionTitle"
        :section-body="displayScene.sectionBody"
        :workspace-title="libraryWorkspaceTitle"
        :workspace-desc="libraryWorkspaceDesc"
        :next-step-title="libraryNextStepTitle"
        :next-step-desc="libraryNextStepDesc"
        :derived-stats="libraryDerivedStats"
        :filter-tabs="libraryFilterTabs"
        :custom-category-labels="libraryCustomCategoryLabels"
        :active-filter="libraryActiveFilter"
        :current-page="libraryCurrentPage"
        :filtered-count="libraryFilteredCount"
        :page-count="libraryPageCount"
        :selected-document="selectedDocument"
        :selected-document-id="selectedDocumentId"
        :topic-label-map="libraryTopicLabelMap"
        :source-label-map="librarySourceLabelMap"
        :displayed-documents="displayedLibraryDocuments"
        :is-list-visible="isLibraryListVisible"
        :show-import-feedback="showImportFeedback"
        :import-feedback-text="importFeedbackText"
        :format-bytes="formatLibraryBytes"
        :material-compile-count="materialCompileCount"
        :material-compile-count-max="materialCompileCountMax"
        :material-order-mode="materialOrderMode"
        :material-topic-filter="materialTopicFilter"
        :material-topic-tabs="materialTopicTabs"
        :material-filtered-question-total="materialFilteredQuestionTotal"
        :material-pool-question-total="materialPoolQuestionTotal"
        :material-preview-count="materialPreviewCount"
        :material-preview-signature="materialPreviewSignature"
        :material-group-shortfall-text="materialGroupShortfallText"
        :material-is-preparing="materialIsPreparing"
        :material-pool-status-label="materialPoolStatusLabel"
        :material-preview-items="materialPreviewItems"
        :can-start-material-mock="canStartMaterialMock"
        @pick-files="$emit('pickFiles')"
        @pick-folder="$emit('pickFolder')"
        @update:active-filter="$emit('updateActiveFilter', $event)"
        @update:page="$emit('updateLibraryPage', $event)"
        @select-document="$emit('selectDocument', $event)"
        @delete-document="$emit('deleteDocument', $event)"
        @update-document-categories="$emit('updateDocumentCategories', $event)"
        @prepare-material="$emit('prepareMaterial')"
        @start-material-mock="$emit('startMaterialMock')"
        @update:material-compile-count="$emit('updateMaterialCompileCount', $event)"
        @update:material-order-mode="$emit('updateMaterialOrderMode', $event)"
        @update:material-topic-filter="$emit('updateMaterialTopicFilter', $event)"
      />
    </div>

    <div
      v-if="displayScene.id !== 'library'"
      class="panel-card"
    >
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
</template>

<style lang="scss" scoped>
.panel-grid {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) 480px;
  gap: 34px;
  margin-top: 0;
}

.panel-grid.is-library {
  grid-template-columns: 1fr;
}

.panel-grid.is-overview {
  grid-template-columns: 1fr;
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
  font-size: 16px;
  line-height: 1.5;
}

@media (max-width: 1100px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }

}
</style>

<script lang="tsx" setup>
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
  libraryDerivedStats: any[]
  libraryFilterTabs: any[]
  libraryNextStepDesc: string
  libraryNextStepTitle: string
  librarySourceLabelMap: Record<string, string>
  libraryTopicLabelMap: Record<string, string>
  libraryWorkspaceDesc: string
  libraryWorkspaceTitle: string
  overviewPrimaryActionLabel: string
  overviewProgressPercent: number
  overviewStatusLabel: string
  overviewSummaryItems: any[]
  selectedDocument: any
  selectedDocumentId: string
  showImportFeedback: boolean
}>()

defineEmits<{
  backOverview: []
  openLibrary: []
  openReport: []
  pickFiles: []
  pickFolder: []
  primaryAction: []
  selectDocument: [value: string]
  updateActiveFilter: [value: string]
}>()
</script>

<template>
  <div
    class="panel-grid"
    :class="{ 'is-library': displayScene.id === 'library' }"
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
        @primary-action="$emit('primaryAction')"
        @open-library="$emit('openLibrary')"
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
        :active-filter="libraryActiveFilter"
        :selected-document="selectedDocument"
        :selected-document-id="selectedDocumentId"
        :topic-label-map="libraryTopicLabelMap"
        :source-label-map="librarySourceLabelMap"
        :displayed-documents="displayedLibraryDocuments"
        :is-list-visible="isLibraryListVisible"
        :show-import-feedback="showImportFeedback"
        :import-feedback-text="importFeedbackText"
        :format-bytes="formatLibraryBytes"
        @pick-files="$emit('pickFiles')"
        @pick-folder="$emit('pickFolder')"
        @update:active-filter="$emit('updateActiveFilter', $event)"
        @select-document="$emit('selectDocument', $event)"
        @primary-action="$emit('primaryAction')"
        @back-overview="$emit('backOverview')"
        @open-report="$emit('openReport')"
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

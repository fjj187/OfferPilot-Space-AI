<script lang="ts" setup>
import { computed, ref } from 'vue'
import DocumentCategoryEditor from '@/components/library/DocumentCategoryEditor.vue'
import {
  resolveLibraryDocumentDisplayTags,
  resolveLibraryDocumentStatusLabel
} from '@/services/library/library-document-categories'
import { getLibraryDocumentTypeLabel } from '@/views/workbench/library.data'

interface Props {
  name: string
  type: 'md' | 'docx'
  importedAt: string
  summary: string
  tags: string[]
  status: 'pending' | 'parsed' | 'error'
  topicLabels?: string[]
  sourceLabel?: string
  recommendedReason?: string
  rawText?: string
  previewLineCount?: number
  dark?: boolean
  /** 隐藏摘要区块（宇宙资料库右侧预览用） */
  hideSummary?: boolean
  /** 导入时间/状态放到类型徽章左侧（宇宙资料库右侧预览用） */
  compactMeta?: boolean
  /** 允许在预览区编辑分类 */
  editableCategories?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  topicLabels: () => [],
  sourceLabel: '',
  recommendedReason: '',
  rawText: '',
  previewLineCount: 14,
  dark: false,
  hideSummary: false,
  compactMeta: false,
  editableCategories: false
})

const emit = defineEmits<{
  'update-tags': [payload: { name: string, tags: string[] }]
}>()

const showFullPreview = ref(false)

const displayTags = computed(() => resolveLibraryDocumentDisplayTags(props.tags))

const statusLabel = computed(() => resolveLibraryDocumentStatusLabel({
  status: props.status,
  tags: props.tags
}))

const topicAndTags = computed(() => {
  return Array.from(new Set([
    ...props.topicLabels,
    ...displayTags.value
  ].filter(Boolean)))
})

const previewSourceText = computed(() => {
  return props.rawText || '当前文档尚未生成可展示的文本预览。'
})

const previewLines = computed(() => previewSourceText.value.split(/\r?\n/))

const previewExcerpt = computed(() => {
  return previewLines.value.slice(0, props.previewLineCount).join('\n')
})

const hasMorePreview = computed(() => previewLines.value.length > props.previewLineCount)

const typeLabel = computed(() => getLibraryDocumentTypeLabel(props.type))
</script>

<template>
  <section
    class="preview-card"
    :class="{
      'is-dark': dark,
      'is-compact': compactMeta || hideSummary
    }"
  >
    <div
      v-if="compactMeta"
      class="preview-head preview-head--compact"
    >
      <div class="preview-toolbar">
        <div class="preview-chip-row">
          <span class="preview-chip preview-chip--type">{{ typeLabel }}</span>
          <span
            v-if="statusLabel"
            class="preview-chip"
            :class="{
              'preview-chip--parsed': statusLabel === '已解析',
              'preview-chip--error': statusLabel === '异常'
            }"
          >
            {{ statusLabel }}
          </span>
          <span
            v-for="item in topicAndTags"
            :key="item"
            class="preview-chip"
          >
            {{ item }}
          </span>
        </div>
        <span class="preview-imported-at">{{ importedAt }}</span>
      </div>

      <div class="preview-headline">
        <div class="eyebrow">文档预览</div>
        <h3>{{ name }}</h3>
      </div>
    </div>

    <div
      v-else
      class="preview-head"
    >
      <div class="preview-head-top">
        <div class="eyebrow">文档预览</div>
        <div class="preview-head-end">
          <span class="preview-chip preview-chip--type">{{ typeLabel }}</span>
        </div>
      </div>

      <div class="preview-title-row">
        <h3>{{ name }}</h3>
        <DocumentCategoryEditor
          v-if="editableCategories"
          :name="name"
          :tags="tags"
          :dark="dark"
          @save="emit('update-tags', $event)"
        />
        <div
          v-else-if="topicAndTags.length"
          class="preview-tags preview-tags--title"
        >
          <span
            v-for="item in topicAndTags"
            :key="item"
            class="preview-chip"
          >
            {{ item }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="!compactMeta"
      class="preview-meta"
    >
      <div>导入时间：{{ importedAt }}</div>
      <div v-if="statusLabel">状态：{{ statusLabel }}</div>
    </div>

    <div
      v-if="!hideSummary"
      class="preview-section"
    >
      <div class="section-label">摘要</div>
      <p class="preview-summary">{{ summary }}</p>
    </div>

    <div class="preview-section preview-section--text">
      <div class="preview-section-head">
        <div class="section-label">文本预览</div>
        <button
          type="button"
          class="preview-expand"
          @click="showFullPreview = true"
        >
          全屏查看
        </button>
      </div>
      <div class="preview-text">
        {{ previewExcerpt }}
      </div>
      <div
        v-if="hasMorePreview"
        class="preview-more"
      >
        当前只展示前 {{ previewLineCount }} 行，点击右上角可查看全文。
      </div>
    </div>
  </section>

  <n-modal
    v-model:show="showFullPreview"
    preset="card"
    class="preview-modal"
    title="全文预览"
    :bordered="false"
    size="huge"
  >
    <div class="preview-modal-head">
      <strong>{{ name }}</strong>
      <span>{{ typeLabel }}</span>
    </div>
    <div class="preview-modal-text">
      {{ previewSourceText }}
    </div>
  </n-modal>
</template>

<style lang="scss" scoped>
.preview-card {
  --preview-card-bg: rgb(255 255 255 / 90%);
  --preview-card-border: #e8edf6;
  --preview-card-shadow: 0 16px 40px rgb(36 53 87 / 7%);
  --preview-title: #1f2746;
  --preview-body: #6d7a92;
  --preview-muted: #7f8aa1;
  --preview-chip-bg: #f5f7fc;
  --preview-chip-text: #68758d;
  --preview-text-bg: #f8faff;
  --preview-text-color: #647188;
  --preview-type-bg: #eef2ff;
  --preview-type-text: #5f79ff;
  --preview-accent: #7182f8;
  padding: 20px;
  border: 1px solid var(--preview-card-border);
  border-radius: 24px;
  background: var(--preview-card-bg);
  box-shadow: var(--preview-card-shadow);
}

.preview-card.is-dark {
  --preview-card-bg: linear-gradient(180deg, rgb(15 20 44 / 0.92) 0%, rgb(17 13 37 / 0.86) 100%);
  --preview-card-border: rgb(255 255 255 / 0.12);
  --preview-card-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.05),
    0 18px 34px rgb(2 4 10 / 0.22);
  --preview-title: #fff;
  --preview-body: rgb(228 238 255 / 0.74);
  --preview-muted: rgb(193 205 234 / 0.74);
  --preview-chip-bg: rgb(255 255 255 / 0.08);
  --preview-chip-text: rgb(241 246 255 / 0.84);
  --preview-text-bg: rgb(8 12 30 / 0.92);
  --preview-text-color: rgb(240 245 255 / 0.92);
  --preview-type-bg: rgb(198 206 255 / 0.14);
  --preview-type-text: #dfe5ff;
  --preview-accent: #c6ceff;
}

.preview-head {
  display: grid;
  gap: 12px;
}

.preview-head--compact {
  gap: 12px;
}

.preview-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.preview-chip-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 0;
}

.preview-imported-at {
  flex: 0 0 auto;
  max-width: 46%;
  font-size: 12px;
  line-height: 34px;
  color: var(--preview-muted);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-headline {
  display: grid;
  gap: 8px;
}

.preview-headline .eyebrow {
  margin: 0;
}

.preview-headline h3 {
  margin: 0;
}

.preview-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--preview-chip-bg);
  color: var(--preview-chip-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.preview-head--compact .preview-chip-row .preview-chip {
  min-height: 34px;
  min-width: 56px;
  padding: 0 14px;
  font-size: 13px;
}

.preview-chip--type {
  background: var(--preview-type-bg);
  color: var(--preview-type-text);
}

.preview-chip--status {
  background: rgb(255 218 132 / 0.16);
  color: #e8c06a;
}

.preview-chip--parsed {
  background: rgb(121 255 204 / 0.14);
  color: #7fd9b3;
}

.preview-chip--error {
  background: rgb(255 120 120 / 0.14);
  color: #f0a0a0;
}

.preview-card.is-dark .preview-chip--status {
  background: rgb(255 218 132 / 0.14);
  color: rgb(255 234 191 / 0.98);
}

.preview-card.is-dark .preview-chip--parsed {
  background: rgb(121 255 204 / 0.16);
  color: rgb(216 255 238 / 0.98);
}

.preview-card.is-dark .preview-chip--error {
  background: rgb(255 120 120 / 0.14);
  color: rgb(255 196 196 / 0.96);
}

.preview-head-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preview-head-end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-width: 0;
}

.preview-meta--inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 6px 12px;
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--preview-muted);
  text-align: right;
}

.preview-title-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 16px;
}

.preview-title-row :deep(.category-editor) {
  margin-top: 0;
  justify-self: end;
}

.eyebrow,
.section-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--preview-accent);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h3 {
  margin: 0;
  font-size: 20px;
  line-height: 1.4;
  color: var(--preview-title);
}

.preview-type {
  padding: 0 10px;
  min-height: 28px;
  border-radius: 999px;
  background: var(--preview-type-bg);
  color: var(--preview-type-text);
  font-size: 12px;
  font-weight: 600;
}

.preview-card.is-compact .preview-imported-at {
  line-height: 34px;
}

.preview-card.is-compact {
  padding: 16px 16px 18px;
}

.preview-card.is-compact .preview-head {
  gap: 12px;
}

.preview-card.is-compact h3 {
  font-size: 16px;
  line-height: 1.4;
}

.preview-card.is-compact .preview-section {
  margin-top: 12px;
}

.preview-card.is-compact .preview-section--text {
  margin-top: 10px;
}

.preview-card.is-compact .preview-section-head {
  margin-bottom: 2px;
}

.preview-card.is-compact .preview-text {
  margin-top: 10px;
  padding: 12px 14px;
  max-height: calc(1.65em * 2 + 24px);
  font-size: 12px;
  line-height: 1.65;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.preview-card.is-compact .preview-more {
  margin-top: 8px;
  font-size: 11px;
}

.preview-meta {
  margin-top: 16px;
  display: grid;
  gap: 8px;
  font-size: 13px;
  color: var(--preview-muted);
}

.preview-section {
  margin-top: 18px;
}

.preview-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preview-expand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid var(--preview-card-border);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  color: var(--preview-accent);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.preview-expand:hover {
  transform: translateY(-1px);
}

.preview-card.is-compact .preview-expand {
  min-height: 34px;
  padding: 0 14px;
  font-size: 13px;
}

.preview-card.is-dark .preview-expand {
  border-color: rgb(255 255 255 / 0.14);
  background: rgb(255 255 255 / 0.05);
}

p {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--preview-body);
}

.preview-summary {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.preview-tags {
  display: grid;
  gap: 8px;
}

.preview-tags--title {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  max-width: 320px;
}

.preview-tag,
.preview-tags--title .preview-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--preview-chip-bg);
  color: var(--preview-chip-text);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.preview-context {
  margin-top: 10px;
  display: grid;
  gap: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--preview-body);
}

.preview-text {
  margin-top: 10px;
  padding: 14px;
  border-radius: 16px;
  background: var(--preview-text-bg);
  font-size: 13px;
  line-height: 1.8;
  color: var(--preview-text-color);
  white-space: pre-wrap;
  overflow: hidden;
}

.preview-more {
  margin-top: 10px;
  color: var(--preview-muted);
  font-size: 12px;
  line-height: 1.6;
}

.preview-modal :deep(.n-card) {
  max-width: min(1100px, 92vw);
  margin: 32px auto;
}

.preview-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  color: #1f2746;
}

.preview-modal-head strong {
  font-size: 18px;
}

.preview-modal-head span {
  padding: 6px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #5f79ff;
  font-size: 12px;
  font-weight: 700;
}

.preview-modal-text {
  max-height: 72vh;
  overflow: auto;
  padding: 18px;
  border-radius: 18px;
  background: #f6f8fc;
  color: #3f4b63;
  font-size: 14px;
  line-height: 1.85;
  white-space: pre-wrap;
}

@media (max-width: 780px) {
  .preview-title-row {
    grid-template-columns: 1fr;
  }

  .preview-tags--title {
    justify-content: start;
    max-width: none;
  }

  .preview-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .preview-imported-at {
    max-width: none;
    line-height: 1.4;
    text-align: left;
  }
}
</style>

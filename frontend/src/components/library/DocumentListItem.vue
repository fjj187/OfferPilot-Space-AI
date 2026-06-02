<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue'
import DocumentCategoryEditor from '@/components/library/DocumentCategoryEditor.vue'
import {
  resolveLibraryDocumentDisplayTags,
  resolveLibraryDocumentStatusClass,
  resolveLibraryDocumentStatusLabel
} from '@/services/library/library-document-categories'
import { getLibraryDocumentTypeLabel } from '@/views/workbench/library.data'

interface Props {
  id: string
  name: string
  type: 'md' | 'docx'
  sizeText: string
  importedAt: string
  tags: string[]
  status: 'pending' | 'parsed' | 'error'
  recommendedReason?: string
  sourceLabel?: string
  active?: boolean
  activeLabel?: string
  /** 卡片底部展示删除操作（宇宙资料库列表用） */
  deletable?: boolean
  /** 允许编辑分类标签（宇宙资料库列表用） */
  editable?: boolean
  /** 资料库中其他资料已用过的自定义分类，供一键选用 */
  existingCustomTags?: string[]
  /** 分类编辑器使用深色样式 */
  categoryEditorDark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  recommendedReason: '',
  sourceLabel: '',
  activeLabel: '',
  deletable: false,
  editable: false,
  categoryEditorDark: false,
  existingCustomTags: () => []
})

const emit = defineEmits<{
  select: []
  delete: []
  'update-profile': [payload: { name: string, tags: string[] }]
}>()

const typeLabel = computed(() => getLibraryDocumentTypeLabel(props.type))

const categoryEditorRef = useTemplateRef('categoryEditorRef')
const editActionRef = useTemplateRef('editActionRef')

const displayTags = computed(() => resolveLibraryDocumentDisplayTags(props.tags))

const statusLabel = computed(() => resolveLibraryDocumentStatusLabel({
  status: props.status,
  tags: props.tags,
  active: props.active,
  activeLabel: props.activeLabel
}))

const statusClass = computed(() => resolveLibraryDocumentStatusClass({
  status: props.status,
  tags: props.tags
}))

const openCategoryEditor = () => {
  categoryEditorRef.value?.open(editActionRef.value)
}
</script>

<template>
  <article
    :id="`doc-item-${id}`"
    class="doc-item"
    :class="{ 'is-active': active, 'has-delete': deletable }"
  >
    <button
      type="button"
      class="doc-item-main"
      @click="emit('select')"
    >
      <div class="doc-head">
        <div class="doc-title-wrap">
          <div class="doc-type">{{ typeLabel }}</div>
          <div class="doc-title">{{ name }}</div>
        </div>
        <div
          v-if="statusLabel"
          class="doc-status"
          :class="statusClass"
        >
          {{ statusLabel }}
        </div>
      </div>

      <div class="doc-meta">
        <span>{{ sizeText }}</span>
        <span>{{ importedAt }}</span>
      </div>

      <div
        v-if="sourceLabel"
        class="doc-source"
      >
        来源：{{ sourceLabel }}
      </div>

      <div
        v-if="displayTags.length"
        class="doc-tags"
      >
        <span
          v-for="tag in displayTags"
          :key="tag"
          class="doc-tag"
        >
          {{ tag }}
        </span>
      </div>

      <div
        v-if="recommendedReason"
        class="doc-reason"
      >
        {{ recommendedReason }}
      </div>
    </button>

    <DocumentCategoryEditor
      v-if="editable"
      ref="categoryEditorRef"
      footer-trigger
      :name="name"
      :tags="tags"
      :existing-custom-tags="existingCustomTags"
      :dark="categoryEditorDark"
      @save="emit('update-profile', $event)"
    />

    <div
      v-if="deletable || editable"
      class="doc-item-footer"
    >
      <button
        v-if="editable"
        ref="editActionRef"
        type="button"
        class="doc-item-action doc-item-action--edit"
        @click.stop="openCategoryEditor"
      >
        编辑
      </button>
      <button
        v-if="deletable"
        type="button"
        class="doc-item-action doc-item-action--delete"
        @click.stop="emit('delete')"
      >
        删除
      </button>
    </div>
  </article>
</template>

<style lang="scss" scoped>
.doc-item {
  width: 100%;
  height: 100%;
  border: 1px solid #e8edf6;
  border-radius: 20px;
  background: rgb(255 255 255 / 90%);
  display: flex;
  flex-direction: column;
  text-align: left;
  transition: 0.2s ease;
  overflow: hidden;
}

.doc-item-main {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  padding: 16px;
  border: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  text-align: left;
  cursor: pointer;
}

.doc-item.has-delete .doc-item-main,
.doc-item:has(.doc-item-footer) .doc-item-main {
  padding-bottom: 8px;
}

.doc-item-footer {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 0 16px 12px;
}

.doc-item-action {
  width: auto;
  height: 28px;
  padding: 0 12px;
  margin: 0;
  border-radius: 999px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.doc-item-action--edit {
  border: 1px solid #d9e2ff;
  background: rgb(255 255 255 / 72%);
  color: #5c72ef;
}

.doc-item-action--edit:hover {
  border-color: #c5d0ff;
  background: #eef2ff;
  color: #4a5fd9;
}

.doc-item-action--delete {
  border: 1px solid #f3d6d6;
  background: rgb(255 255 255 / 72%);
  color: #c54d4d;
}

.doc-item-action--delete:hover {
  border-color: #efb4b4;
  background: #fff5f5;
  color: #b03f3f;
}

.doc-item:hover,
.doc-item.is-active {
  border-color: #d9e2ff;
  box-shadow: 0 12px 28px rgb(36 53 87 / 8%);
}

.doc-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.doc-title-wrap {
  min-width: 0;
  flex: 1 1 auto;
}

.doc-type {
  font-size: 11px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.doc-title {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  color: #1f2746;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.doc-status {
  flex-shrink: 0;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.doc-status.is-pending {
  background: #fff6e9;
  color: #b7781b;
}

.doc-status.is-parsed {
  background: #eef8f4;
  color: #2f8f67;
}

.doc-status.is-error {
  background: #fff0f0;
  color: #c54d4d;
}

.doc-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  margin-top: 10px;
  font-size: 12px;
  color: #8793aa;
}

.doc-source {
  margin-top: 12px;
  font-size: 12px;
  color: #7f8aa1;
  min-height: 18px;
}

.doc-tags {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  margin-top: 14px;
  min-height: 36px;
  overflow: hidden;
}

.doc-tag {
  flex: 0 0 auto;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f5f7fc;
  color: #68758d;
  font-size: 12px;
  white-space: nowrap;
}

.doc-reason {
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.7;
  color: #66758f;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

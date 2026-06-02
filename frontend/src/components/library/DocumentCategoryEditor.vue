<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  isPredefinedLibraryTag,
  mergePendingCustomTag,
  normalizeDocumentTags,
  resolveLibraryDocumentDisplayTags,
  resolveQuickPickCustomTags
} from '@/services/library/library-document-categories'

interface Props {
  name: string
  tags: string[]
  /** 资料库中其他资料已用过的自定义分类，供一键选用 */
  existingCustomTags?: string[]
  /** 深色资料卡（宇宙资料库列表） */
  dark?: boolean
  /** 仅弹层逻辑，触发按钮由父级 footer 提供 */
  footerTrigger?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  dark: false,
  footerTrigger: false,
  existingCustomTags: () => []
})

const emit = defineEmits<{
  save: [payload: { name: string, tags: string[] }]
}>()

const isOpen = ref(false)
const draftName = ref('')
const draftTags = ref<string[]>([])
const customTagInput = ref('')
const triggerRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const popoverStyle = ref<Record<string, string>>({})
const anchorElement = ref<HTMLElement | null>(null)

const displayTags = computed(() => resolveLibraryDocumentDisplayTags(props.tags))

const quickPickTags = computed(() => (
  resolveQuickPickCustomTags(props.existingCustomTags, draftTags.value)
))

const syncDraftFromProps = () => {
  draftName.value = props.name
  // 编辑器只维护自定义分类，忽略历史预设标签
  draftTags.value = normalizeDocumentTags(props.tags).filter(tag => !isPredefinedLibraryTag(tag))
}

const resolveAnchorElement = () => anchorElement.value || triggerRef.value

const syncPopoverPosition = async () => {
  const anchor = resolveAnchorElement()
  if (!isOpen.value || !anchor) return
  await nextTick()

  const triggerRect = anchor.getBoundingClientRect()
  const popoverEl = popoverRef.value
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const width = Math.min(360, Math.max(280, viewportWidth - 24))
  const popoverHeight = popoverEl?.offsetHeight || 220
  const left = Math.min(
    Math.max(12, triggerRect.left),
    viewportWidth - width - 12
  )
  const preferredTop = triggerRect.bottom + 10
  const top = preferredTop + popoverHeight <= viewportHeight - 12
    ? preferredTop
    : Math.max(12, triggerRect.top - popoverHeight - 10)

  popoverStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`
  }
}

const openEditor = async (anchor?: HTMLElement | null) => {
  anchorElement.value = anchor || triggerRef.value
  syncDraftFromProps()
  customTagInput.value = ''
  isOpen.value = true
  await syncPopoverPosition()
}

const closeEditor = () => {
  isOpen.value = false
}

const toggleEditor = () => {
  if (isOpen.value) {
    closeEditor()
    return
  }
  void openEditor()
}

const removeDraftTag = (tag: string) => {
  draftTags.value = normalizeDocumentTags(draftTags.value.filter(item => item !== tag))
}

const addCustomTag = () => {
  const trimmed = customTagInput.value.trim()
  if (!trimmed) return
  draftTags.value = normalizeDocumentTags([...draftTags.value, trimmed])
  customTagInput.value = ''
}

const selectQuickPickTag = (tag: string) => {
  draftTags.value = normalizeDocumentTags([...draftTags.value, tag])
}

const handleCustomInputKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter') return
  event.preventDefault()
  addCustomTag()
}

const saveDraft = () => {
  const nextName = draftName.value.trim()
  if (!nextName) return
  emit('save', {
    name: nextName,
    tags: mergePendingCustomTag(draftTags.value, customTagInput.value)
  })
  closeEditor()
}

const handleDocumentClick = (event: MouseEvent) => {
  if (!isOpen.value) return
  const target = event.target as Node | null
  const anchor = resolveAnchorElement()
  if (anchor?.contains(target) || popoverRef.value?.contains(target)) return
  closeEditor()
}

defineExpose({
  open: openEditor,
  close: closeEditor
})

const handleViewportChange = () => {
  if (!isOpen.value) return
  void syncPopoverPosition()
}

watch([quickPickTags, draftTags], () => {
  if (!isOpen.value) return
  void syncPopoverPosition()
})

watch(isOpen, (open) => {
  if (!open) return
  void syncPopoverPosition()
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  window.addEventListener('resize', handleViewportChange)
  window.addEventListener('scroll', handleViewportChange, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('resize', handleViewportChange)
  window.removeEventListener('scroll', handleViewportChange, true)
})
</script>

<template>
  <div
    class="category-editor"
    :class="{ 'is-dark': dark, 'is-footer-trigger': footerTrigger }"
  >
    <template v-if="!footerTrigger">
      <div
        v-if="displayTags.length"
        class="category-editor-tags"
      >
        <span
          v-for="tag in displayTags"
          :key="tag"
          class="category-editor-tag"
        >
          {{ tag }}
        </span>
      </div>

      <button
        ref="triggerRef"
        type="button"
        class="category-editor-trigger"
        @click.stop="toggleEditor"
      >
        编辑
      </button>
    </template>

    <Teleport to="body">
      <Transition name="category-editor-fade">
        <div
          v-if="isOpen"
          ref="popoverRef"
          class="category-editor-popover"
          :class="{ 'is-dark': dark }"
          :style="popoverStyle"
          @click.stop
        >
          <div class="category-editor-popover-head">
            <strong>编辑资料</strong>
            <span>修改显示名称或自定义分类，原始导入文件名仍会保留</span>
          </div>

          <div class="category-editor-section-label">资料名称</div>
          <input
            v-model="draftName"
            type="text"
            class="category-editor-name-input"
            placeholder="输入资料显示名称"
            maxlength="120"
          >

          <div class="category-editor-section-label">自定义分类</div>
          <div
            v-if="quickPickTags.length"
            class="category-editor-quick-pick"
          >
            <span class="category-editor-quick-pick-label">已有分类，点击选用</span>
            <div class="category-editor-quick-pick-chips">
              <button
                v-for="tag in quickPickTags"
                :key="tag"
                type="button"
                class="category-editor-quick-pick-chip"
                @click="selectQuickPickTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>
          <div
            v-if="draftTags.length"
            class="category-editor-draft-tags"
          >
            <span
              v-for="tag in draftTags"
              :key="tag"
              class="category-editor-draft-tag"
            >
              {{ tag }}
              <button
                type="button"
                class="category-editor-draft-remove"
                aria-label="移除分类"
                @click="removeDraftTag(tag)"
              >
                ×
              </button>
            </span>
          </div>
          <div class="category-editor-custom-row">
            <input
              v-model="customTagInput"
              type="text"
              class="category-editor-custom-input"
              placeholder="例如：面经、算法"
              maxlength="24"
              @keydown="handleCustomInputKeydown"
            >
            <button
              type="button"
              class="category-editor-custom-add"
              @click="addCustomTag"
            >
              添加
            </button>
          </div>

          <div class="category-editor-actions">
            <button
              type="button"
              class="category-editor-action category-editor-action--ghost"
              @click="closeEditor"
            >
              取消
            </button>
            <button
              type="button"
              class="category-editor-action category-editor-action--primary"
              @click="saveDraft"
            >
              保存
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.category-editor {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-top: 14px;
  min-height: 36px;
}

.category-editor.is-footer-trigger {
  display: none;
}

.category-editor-tags {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}

.category-editor-tag {
  flex: 0 0 auto;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f5f7fc;
  color: #68758d;
  font-size: 12px;
  white-space: nowrap;
}

.category-editor.is-dark .category-editor-tag {
  background: rgb(255 255 255 / 0.08);
  color: rgb(239 244 255 / 0.88);
}

.category-editor-trigger {
  flex: 0 0 auto;
  height: 28px;
  padding: 0 10px;
  border: 1px solid #d9e2ff;
  border-radius: 999px;
  background: #fff;
  color: #5c72ef;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.category-editor.is-dark .category-editor-trigger {
  border-color: rgb(255 255 255 / 0.14);
  background: rgb(255 255 255 / 0.06);
  color: rgb(220 232 255 / 0.92);
}

.category-editor-popover {
  position: fixed;
  z-index: 2100;
  padding: 16px;
  border: 1px solid #e8edf6;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 18px 40px rgb(36 53 87 / 14%);
}

.category-editor-popover.is-dark {
  border-color: rgb(255 255 255 / 0.12);
  background: rgb(24 20 60 / 0.96);
  box-shadow: 0 18px 40px rgb(0 0 0 / 0.26);
  backdrop-filter: blur(16px);
}

.category-editor-popover-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-editor-popover-head strong {
  font-size: 15px;
  color: #1f2746;
}

.category-editor-popover.is-dark .category-editor-popover-head strong {
  color: rgb(246 249 255 / 0.94);
}

.category-editor-popover-head span {
  font-size: 12px;
  color: #8793aa;
}

.category-editor-popover.is-dark .category-editor-popover-head span {
  color: rgb(220 232 255 / 0.62);
}

.category-editor-section-label {
  margin-top: 14px;
  font-size: 12px;
  font-weight: 600;
  color: #68758d;
}

.category-editor-name-input {
  width: 100%;
  height: 36px;
  margin-top: 8px;
  padding: 0 12px;
  border: 1px solid #e8edf6;
  border-radius: 12px;
  font: inherit;
  font-size: 13px;
}

.category-editor-popover.is-dark .category-editor-name-input {
  border-color: rgb(255 255 255 / 0.12);
  background: rgb(255 255 255 / 0.05);
  color: #fff;
}

.category-editor-popover.is-dark .category-editor-section-label {
  color: rgb(220 232 255 / 0.62);
}

.category-editor-draft-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 8px;
}

.category-editor-quick-pick {
  margin-top: 8px;
}

.category-editor-quick-pick-label {
  display: block;
  font-size: 11px;
  color: #8793aa;
}

.category-editor-popover.is-dark .category-editor-quick-pick-label {
  color: rgb(220 232 255 / 62%);
}

.category-editor-quick-pick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.category-editor-quick-pick-chip {
  min-height: 28px;
  padding: 0 10px;
  border: 1px dashed #d9e2ff;
  border-radius: 999px;
  background: #f8faff;
  color: #5c72ef;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.category-editor-quick-pick-chip:hover {
  border-color: #c5d0ff;
  background: #eef2ff;
}

.category-editor-popover.is-dark .category-editor-quick-pick-chip {
  border-color: rgb(255 255 255 / 0.18);
  background: rgb(255 255 255 / 0.04);
  color: rgb(220 232 255 / 0.92);
}

.category-editor-popover.is-dark .category-editor-quick-pick-chip:hover {
  border-color: rgb(198 206 255 / 0.36);
  background: rgb(198 206 255 / 0.12);
}

.category-editor-draft-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 30px;
  padding: 0 8px 0 10px;
  border-radius: 999px;
  background: #f5f7fc;
  color: #4f5d78;
  font-size: 12px;
}

.category-editor-popover.is-dark .category-editor-draft-tag {
  background: rgb(255 255 255 / 0.08);
  color: rgb(239 244 255 / 0.9);
}

.category-editor-draft-remove {
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

.category-editor-custom-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.category-editor-custom-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #e8edf6;
  border-radius: 12px;
  font: inherit;
  font-size: 13px;
}

.category-editor-popover.is-dark .category-editor-custom-input {
  border-color: rgb(255 255 255 / 0.12);
  background: rgb(255 255 255 / 0.05);
  color: #fff;
}

.category-editor-custom-add,
.category-editor-action {
  height: 36px;
  padding: 0 14px;
  border-radius: 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.category-editor-custom-add {
  border: 1px solid #d9e2ff;
  background: #eef2ff;
  color: #5c72ef;
}

.category-editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.category-editor-action--ghost {
  border: 1px solid #e8edf6;
  background: #fff;
  color: #66758f;
}

.category-editor-action--primary {
  border: 1px solid #d9e2ff;
  background: #5c72ef;
  color: #fff;
}

.category-editor-popover.is-dark .category-editor-action--ghost {
  border-color: rgb(255 255 255 / 0.12);
  background: rgb(255 255 255 / 0.05);
  color: rgb(239 244 255 / 0.92);
}

.category-editor-fade-enter-active,
.category-editor-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.category-editor-fade-enter-from,
.category-editor-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>

<script lang="ts" setup>
import { LIBRARY_IMPORT_EXAMPLE_PAGES } from '@/services/library/library-import-example-document'

interface Props {
  emphasizeImport?: boolean
  helperText?: string
  feedbackText?: string
  dark?: boolean
}

withDefaults(defineProps<Props>(), {
  emphasizeImport: false,
  helperText: '',
  feedbackText: '',
  dark: false
})

const emit = defineEmits<{
  pickFiles: []
  pickFolder: []
}>()

const examplePageCount = LIBRARY_IMPORT_EXAMPLE_PAGES.length

const showExampleModal = ref(false)
const activeExamplePage = ref(0)
const copyFeedback = ref('')

const activePage = computed(() => (
  LIBRARY_IMPORT_EXAMPLE_PAGES[activeExamplePage.value]
  ?? LIBRARY_IMPORT_EXAMPLE_PAGES[0]
))

let copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null

const openExampleModal = () => {
  showExampleModal.value = true
  activeExamplePage.value = 0
  copyFeedback.value = ''
}

const goExamplePage = (index: number) => {
  if (index < 0 || index >= examplePageCount) return
  activeExamplePage.value = index
  copyFeedback.value = ''
}

const handleCopyExample = async () => {
  const example = activePage.value.example
  if (!example || !navigator.clipboard?.writeText) return

  try {
    await navigator.clipboard.writeText(example)
    copyFeedback.value = '已复制'
  } catch {
    copyFeedback.value = '复制失败'
  }

  if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer)
  copyFeedbackTimer = setTimeout(() => {
    copyFeedback.value = ''
  }, 2200)
}

onBeforeUnmount(() => {
  if (copyFeedbackTimer) clearTimeout(copyFeedbackTimer)
})
</script>

<template>
  <section
    class="import-card"
    :class="{ 'is-dark': dark }"
  >
    <div class="import-head">
      <div class="import-copy">
        <div class="eyebrow">导入入口</div>
        <h2>先把你的面试资料放进来</h2>
        <p>支持 Markdown（.md）与 Docs（.docx）：Docs 会在浏览器内解析为正文，再按章节分块出题。</p>
      </div>
      <button
        type="button"
        class="import-example-button"
        @click="openExampleModal"
      >
        查看示例文档
      </button>
    </div>

    <div
      class="import-actions"
      :class="{ 'is-emphasis': emphasizeImport }"
    >
      <n-button
        type="primary"
        round
        size="large"
        @click="emit('pickFiles')"
      >
        导入文件
      </n-button>
      <n-button
        ghost
        round
        size="large"
        color="#6c7df7"
        @click="emit('pickFolder')"
      >
        导入文件夹
      </n-button>
    </div>

    <div
      v-if="helperText"
      class="import-helper"
    >
      {{ helperText }}
    </div>

    <div
      v-if="feedbackText"
      class="import-feedback"
    >
      {{ feedbackText }}
    </div>

    <div class="import-meta">
      <span>支持格式：Markdown / Docs（.docx）</span>
      <span>建议优先导入结构清晰的面试沉淀文档。</span>
    </div>
  </section>

  <Teleport to="body">
    <div
      v-if="showExampleModal"
      class="import-example-overlay"
      @click.self="showExampleModal = false"
    >
      <div
        class="import-example-doc"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-example-title"
        @click.stop
      >
      <div class="import-example-doc-head">
        <div class="import-example-doc-title">
          <strong id="import-example-title">资料结构示例</strong>
          <span>{{ activePage.label }}</span>
        </div>
        <div class="import-example-doc-actions">
          <span
            v-if="copyFeedback"
            class="import-example-copy-feedback"
            aria-live="polite"
          >
            {{ copyFeedback }}
          </span>
          <button
            type="button"
            class="import-example-copy-button"
            @click="handleCopyExample"
          >
            复制示例
          </button>
          <button
            type="button"
            class="import-example-close-button"
            aria-label="关闭"
            @click="showExampleModal = false"
          >
            ×
          </button>
        </div>
      </div>

      <p class="import-example-summary">
        {{ activePage.summary }}
      </p>

      <pre class="import-example-code"><code>{{ activePage.example }}</code></pre>

      <div class="import-example-pagination">
        <button
          type="button"
          class="import-example-page-nav"
          :disabled="activeExamplePage === 0"
          @click="goExamplePage(activeExamplePage - 1)"
        >
          上一页
        </button>

        <div class="import-example-page-tabs">
          <button
            v-for="(page, index) in LIBRARY_IMPORT_EXAMPLE_PAGES"
            :key="page.id"
            type="button"
            class="import-example-page-tab"
            :class="{ 'is-active': activeExamplePage === index }"
            @click="goExamplePage(index)"
          >
            {{ page.label }}
          </button>
        </div>

        <button
          type="button"
          class="import-example-page-nav"
          :disabled="activeExamplePage === examplePageCount - 1"
          @click="goExamplePage(activeExamplePage + 1)"
        >
          下一页
        </button>
      </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.import-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: linear-gradient(135deg, #f8faff 0%, #fff 100%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 7%);
}

.import-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.import-copy {
  flex: 1;
  min-width: 0;
}

.import-example-button {
  flex-shrink: 0;
  padding: 8px 14px;
  border: 1px solid #d8e0f6;
  border-radius: 999px;
  background: rgb(255 255 255 / 88%);
  color: #5f79ff;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.import-example-button:hover {
  border-color: #b8c4ff;
  background: #eef2ff;
}

.eyebrow {
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h2 {
  margin: 10px 0;
  font-size: 24px;
  color: #1f2746;
}

p {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: #6d7a92;
}

.import-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.import-actions.is-emphasis {
  padding: 12px;
  border-radius: 18px;
  background: #eef2ff;
}

.import-helper {
  margin-top: -4px;
  font-size: 13px;
  line-height: 1.7;
  color: #66758f;
}

.import-feedback {
  padding: 12px 14px;
  border: 1px solid #dff0e8;
  border-radius: 14px;
  background: #f4fbf7;
  font-size: 13px;
  line-height: 1.7;
  color: #2f8f67;
}

.import-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  font-size: 13px;
  color: #7c88a0;
}

.import-card.is-dark .import-example-button {
  border-color: rgb(255 255 255 / 18%);
  background: rgb(255 255 255 / 6%);
  color: #dfe5ff;
}

.import-card.is-dark .import-example-button:hover {
  border-color: rgb(198 206 255 / 42%);
  background: rgb(255 255 255 / 10%);
}

.import-example-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgb(3 5 16 / 94%);
}

.import-example-doc {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  width: min(480px, 50vw);
  max-width: 480px;
  min-width: 320px;
  max-height: min(88vh, 680px);
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 20px;
  background: linear-gradient(180deg, rgb(14 18 42) 0%, rgb(8 12 30) 100%);
  box-shadow: 0 28px 56px rgb(0 0 0 / 55%);
  isolation: isolate;
}

.import-example-doc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid rgb(255 255 255 / 8%);
  background: rgb(10 14 34);
}

.import-example-doc-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  min-width: 0;
}

.import-example-doc-title strong {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
}

.import-example-doc-title span {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgb(198 206 255 / 12%);
  color: rgb(223 229 255 / 88%);
  font-size: 12px;
  font-weight: 600;
}

.import-example-summary {
  margin: 0;
  padding: 12px 18px 0;
  background: rgb(8 12 30);
  color: rgb(228 238 255 / 78%);
  font-size: 13px;
  line-height: 1.7;
}

.import-example-doc-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.import-example-copy-feedback {
  color: #8ce6b8;
  font-size: 12px;
}

.import-example-copy-button {
  padding: 6px 12px;
  border: 1px solid rgb(255 255 255 / 16%);
  border-radius: 999px;
  background: rgb(255 255 255 / 6%);
  color: #dfe5ff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.import-example-copy-button:hover {
  border-color: rgb(198 206 255 / 42%);
  background: rgb(255 255 255 / 10%);
}

.import-example-close-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 999px;
  background: rgb(255 255 255 / 5%);
  color: rgb(228 238 255 / 78%);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.import-example-close-button:hover {
  border-color: rgb(198 206 255 / 42%);
  background: rgb(255 255 255 / 10%);
  color: #fff;
}

.import-example-code {
  flex: 1;
  min-height: 240px;
  max-height: min(46vh, 420px);
  margin: 0;
  padding: 16px 18px;
  overflow: auto;
  background: rgb(8 12 30);
  color: rgb(240 245 255 / 94%);
  font-size: 13px;
  line-height: 1.75;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  scrollbar-width: thin;
  scrollbar-color: rgb(98 108 168 / 55%) rgb(8 12 30);
}

.import-example-code::-webkit-scrollbar {
  width: 8px;
}

.import-example-code::-webkit-scrollbar-thumb {
  border: 2px solid rgb(8 12 30);
  border-radius: 999px;
  background: linear-gradient(180deg, rgb(118 128 188 / 62%), rgb(78 88 148 / 52%));
}

.import-example-code::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgb(148 158 218 / 72%), rgb(98 108 178 / 62%));
}

.import-example-code::-webkit-scrollbar-track {
  border-radius: 999px;
  background: rgb(8 12 30);
}

.import-example-code::-webkit-scrollbar-corner {
  background: rgb(8 12 30);
}

.import-example-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px 16px;
  border-top: 1px solid rgb(255 255 255 / 8%);
  background: rgb(10 14 34);
}

.import-example-page-tabs {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.import-example-page-tab,
.import-example-page-nav {
  padding: 8px 14px;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 999px;
  background: rgb(255 255 255 / 5%);
  color: rgb(228 238 255 / 78%);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.import-example-page-tab.is-active {
  border-color: rgb(198 206 255 / 42%);
  background: rgb(198 206 255 / 14%);
  color: #eef1ff;
}

.import-example-page-nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

@media (width <= 760px) {
  .import-head {
    flex-direction: column;
  }

  .import-example-button {
    align-self: flex-start;
  }

  .import-example-pagination {
    flex-direction: column;
  }

  .import-example-page-tabs {
    width: 100%;
  }
}
</style>

<style lang="scss">
body .import-example-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgb(3 5 16 / 94%);
}

body .import-example-doc {
  flex: 0 0 auto;
  width: min(480px, 50vw);
  max-width: 480px;
  min-width: 320px;
  background: linear-gradient(180deg, rgb(14 18 42) 0%, rgb(8 12 30) 100%);
  box-shadow: 0 28px 56px rgb(0 0 0 / 55%);
}
</style>

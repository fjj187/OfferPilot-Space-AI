<script lang="ts" setup>
import DocumentListItem from '@/components/library/DocumentListItem.vue'
import DocumentPreviewPanel from '@/components/library/DocumentPreviewPanel.vue'
import ImportActionCard from '@/components/library/ImportActionCard.vue'
import LibraryFilterTabs from '@/components/library/LibraryFilterTabs.vue'
import LibraryHeader from '@/components/library/LibraryHeader.vue'
import LibraryStatCard from '@/components/library/LibraryStatCard.vue'
import WorkbenchContentShell from '@/components/workbench/WorkbenchContentShell.vue'
import { useWorkbenchPersistence } from '@/composables/useWorkbenchPersistence'
import {
  documentList as initialDocumentList,
  filterTabs,
  libraryStats,
  type LibraryDocument,
  type LibraryTopicKey
} from './library.data'

const route = useRoute()
const {
  loadLibraryDocuments,
  loadWorkbenchContext,
  saveImportedLibraryDocuments,
  saveWorkbenchContext
} = useWorkbenchPersistence()

const topicLabelMap: Record<LibraryTopicKey, string> = {
  vue3: 'Vue 3',
  typescript: 'TypeScript',
  engineering: '工程化',
  browser: '浏览器',
  performance: '性能优化',
  scenario: '场景题'
}

const sourceLabelMap: Record<string, string> = {
  'hero-import': '总览页 Hero 导入入口',
  'library-frontend-notes': '总览页核心资料卡',
  'library-project-review': '总览页项目复盘资料卡',
  'library-follow-up-questions': '总览页追问清单资料卡'
}

const refFileInput = ref<HTMLInputElement | null>(null)
const refFolderInput = ref<HTMLInputElement | null>(null)
const seedDocumentIds = new Set(initialDocumentList.map(item => item.id))
const persistedContext = ref(loadWorkbenchContext())

const routeTopic = computed(() => String(route.query.topic || '') as LibraryTopicKey | '')
const routeDocType = computed(() => String(route.query.docType || '') as LibraryDocument['type'] | '')
const routeSource = computed(() => String(route.query.source || ''))

const resolveFilterFromQuery = () => {
  if (routeDocType.value === 'md' || routeDocType.value === 'docx') return routeDocType.value
  if (routeTopic.value && filterTabs.some(tab => tab.key === routeTopic.value)) return routeTopic.value
  return 'all'
}

const activeFilter = ref(resolveFilterFromQuery())
const documentList = ref<LibraryDocument[]>(loadLibraryDocuments(initialDocumentList))
const selectedDocumentId = ref(persistedContext.value?.activeDocumentId || documentList.value[0]?.id || '')
const lastImportedIds = ref<string[]>([])
const showImportFeedback = ref(false)
const importFeedbackText = ref('')
const shouldScrollToImported = ref(false)

let importFeedbackTimer: ReturnType<typeof setTimeout> | null = null

const selectedDocument = computed(() => {
  return documentList.value.find(item => item.id === selectedDocumentId.value) || documentList.value[0]
})

const contextTitle = computed(() => {
  if (routeSource.value === 'hero-import') {
    return '你是从总览页的“导入资料并开始”进入当前资料页'
  }

  if (routeTopic.value && topicLabelMap[routeTopic.value]) {
    return `当前正在查看与 ${topicLabelMap[routeTopic.value]} 相关的资料`
  }

  if (routeDocType.value) {
    return `当前优先聚焦 ${routeDocType.value.toUpperCase()} 文档`
  }

  return ''
})

const contextDesc = computed(() => {
  if (routeSource.value && sourceLabelMap[routeSource.value]) {
    return `来源入口：${sourceLabelMap[routeSource.value]}`
  }

  if (routeTopic.value && routeDocType.value) {
    return '已根据主题与文档类型自动切换到更接近当前意图的资料。'
  }

  return routeTopic.value ? '已根据总览页主题自动筛选资料，并优先定位相关文档。' : ''
})

const nextStepTitle = computed(() => {
  if (lastImportedIds.value.length) {
    return '新资料已进入资料库，建议先检查右侧预览，再继续开始训练。'
  }

  if (routeSource.value === 'hero-import') {
    return '先导入 1 到 3 份核心资料，导入完成后就可以回到总览页继续模拟面试或专项刷题。'
  }

  return ''
})

const nextStepDesc = computed(() => {
  if (lastImportedIds.value.length) {
    return '你可以继续导入更多资料，也可以返回总览页进入模拟面试、专项刷题或复盘报告流程。'
  }

  if (routeSource.value === 'hero-import') {
    return '建议优先导入前端八股总纲、项目复盘和高频追问清单这类核心文档。'
  }

  return ''
})

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const filteredDocuments = computed(() => {
  if (activeFilter.value === 'all') return documentList.value

  if (activeFilter.value === 'md' || activeFilter.value === 'docx') {
    return documentList.value.filter(item => item.type === activeFilter.value)
  }

  return documentList.value.filter(item => item.topicKeys.includes(activeFilter.value as LibraryTopicKey))
})

const resolvePreferredDocumentId = (list: LibraryDocument[]) => {
  if (!list.length) return ''

  if (lastImportedIds.value.length) {
    const importedDoc = list.find(item => item.id === lastImportedIds.value[0])
    if (importedDoc) return importedDoc.id
  }

  if (routeSource.value) {
    const matchedBySource = list.find(item => item.sourceKey === routeSource.value)
    if (matchedBySource) return matchedBySource.id
  }

  if (routeTopic.value && routeDocType.value) {
    const matchedByTopicAndType = list.find(item => item.type === routeDocType.value && item.topicKeys.includes(routeTopic.value))
    if (matchedByTopicAndType) return matchedByTopicAndType.id
  }

  if (routeTopic.value) {
    const matchedByTopic = list.find(item => item.topicKeys.includes(routeTopic.value))
    if (matchedByTopic) return matchedByTopic.id
  }

  if (routeDocType.value) {
    const matchedByType = list.find(item => item.type === routeDocType.value)
    if (matchedByType) return matchedByType.id
  }

  if (persistedContext.value?.activeDocumentId) {
    const persistedDoc = list.find(item => item.id === persistedContext.value?.activeDocumentId)
    if (persistedDoc) return persistedDoc.id
  }

  return list[0].id
}

const scrollToDocument = async (id: string) => {
  await nextTick()
  const target = document.getElementById(`doc-item-${id}`)
  target?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest'
  })
}

watch([filteredDocuments, () => route.query], ([list]) => {
  if (!list.length) return
  const exists = list.some(item => item.id === selectedDocumentId.value)
  const preferredId = resolvePreferredDocumentId(list)
  if (!exists || routeSource.value || routeTopic.value || routeDocType.value || lastImportedIds.value.length) {
    selectedDocumentId.value = preferredId
  }
}, { immediate: true, deep: true })

watch(selectedDocumentId, async id => {
  if (!id || !shouldScrollToImported.value) return
  await scrollToDocument(id)
  shouldScrollToImported.value = false
})

watch(() => route.query, () => {
  activeFilter.value = resolveFilterFromQuery()
}, { deep: true })

watch(documentList, list => {
  const importedDocuments = list.filter(item => !seedDocumentIds.has(item.id))
  saveImportedLibraryDocuments(importedDocuments)
}, { deep: true })

watch(
  [selectedDocumentId, routeTopic, routeSource],
  ([documentId, topic]) => {
    if (!documentId) return

    const selected = documentList.value.find(item => item.id === documentId)
    const fallbackTopic = selected?.topicKeys[0] || 'scenario'

    persistedContext.value = saveWorkbenchContext({
      activeTopic: (topic || fallbackTopic) as LibraryTopicKey,
      activeDocumentId: documentId,
      sourcePage: 'library'
    })
  },
  { immediate: true }
)

const showFeedback = (text: string) => {
  importFeedbackText.value = text
  showImportFeedback.value = true

  if (importFeedbackTimer) {
    clearTimeout(importFeedbackTimer)
  }

  importFeedbackTimer = setTimeout(() => {
    showImportFeedback.value = false
    importFeedbackTimer = null
  }, 5000)
}

const handlePickFiles = () => {
  refFileInput.value?.click()
}

const handlePickFolder = () => {
  refFolderInput.value?.click()
}

const inferTags = (name: string) => {
  const lower = name.toLowerCase()
  const tags: string[] = []
  if (lower.includes('vue')) tags.push('Vue 3')
  if (lower.includes('ts') || lower.includes('type')) tags.push('TypeScript')
  if (lower.includes('build') || lower.includes('工程')) tags.push('工程化')
  if (lower.includes('browser')) tags.push('浏览器')
  if (lower.includes('性能')) tags.push('性能优化')
  if (lower.includes('项目') || lower.includes('场景')) tags.push('场景题')
  return tags.length ? tags : ['待分类']
}

const inferTopicKeys = (name: string): LibraryTopicKey[] => {
  const lower = name.toLowerCase()
  const topicKeys: LibraryTopicKey[] = []
  if (lower.includes('vue')) topicKeys.push('vue3')
  if (lower.includes('ts') || lower.includes('type')) topicKeys.push('typescript')
  if (lower.includes('build') || lower.includes('工程')) topicKeys.push('engineering')
  if (lower.includes('browser')) topicKeys.push('browser')
  if (lower.includes('性能')) topicKeys.push('performance')
  if (lower.includes('项目') || lower.includes('场景')) topicKeys.push('scenario')
  return topicKeys.length ? topicKeys : routeTopic.value ? [routeTopic.value] : ['scenario']
}

const createLibraryDocument = async (file: File): Promise<LibraryDocument> => {
  const ext = file.name.toLowerCase().endsWith('.docx') ? 'docx' : 'md'
  let rawText = ''
  let summary = '文档已导入，等待进一步解析。'

  if (ext === 'md') {
    rawText = await file.text()
    summary = rawText.slice(0, 120).replace(/\s+/g, ' ').trim() || 'Markdown 文档已导入。'
  } else {
    summary = 'Word 文档已导入，第一版先展示基础信息，后续再补充完整解析。'
  }

  return {
    id: `${file.name}-${file.lastModified}`,
    name: file.name,
    type: ext,
    size: file.size,
    importedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    rawText,
    summary,
    tags: inferTags(file.name),
    status: ext === 'md' ? 'parsed' : 'pending',
    topicKeys: inferTopicKeys(file.name),
    sourceKey: routeSource.value || 'hero-import',
    recommendedReason: routeSource.value === 'hero-import'
      ? '从总览页导入入口进入，建议优先检查新导入资料。'
      : '根据文件名与当前主题自动归类。'
  }
}

const appendFiles = async (files: FileList | null) => {
  if (!files?.length) return
  const nextDocs = await Promise.all(
    Array.from(files)
      .filter(file => file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.docx'))
      .map(createLibraryDocument)
  )

  if (!nextDocs.length) return

  documentList.value = [...nextDocs, ...documentList.value]
  lastImportedIds.value = nextDocs.map(item => item.id)
  selectedDocumentId.value = nextDocs[0].id
  shouldScrollToImported.value = true

  const importedCountText = nextDocs.length === 1 ? '1 份资料' : `${nextDocs.length} 份资料`
  showFeedback(`已成功导入 ${importedCountText}，并自动定位到最新文档。`)
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  await appendFiles(target.files)
  target.value = ''
}
</script>

<template>
  <WorkbenchContentShell has-aside>
    <input
      ref="refFileInput"
      type="file"
      accept=".md,.docx"
      multiple
      class="hidden"
      @change="handleFileChange"
    >
    <input
      ref="refFolderInput"
      type="file"
      accept=".md,.docx"
      multiple
      webkitdirectory
      class="hidden"
      @change="handleFileChange"
    >

    <LibraryHeader
      :context-title="contextTitle"
      :context-desc="contextDesc"
      :next-step-title="nextStepTitle"
      :next-step-desc="nextStepDesc"
    />

    <ImportActionCard
      :emphasize-import="routeSource === 'hero-import'"
      :helper-text="routeSource === 'hero-import' ? '当前是从总览页导入入口进入，建议先导入你的核心资料。' : ''"
      :feedback-text="showImportFeedback ? importFeedbackText : ''"
      @pick-files="handlePickFiles"
      @pick-folder="handlePickFolder"
    />

    <div class="stats-grid">
      <LibraryStatCard
        v-for="item in libraryStats"
        :key="item.label"
        :label="item.label"
        :value="item.value"
        :note="item.note"
        :tone="item.tone"
      />
    </div>

    <div class="section-head">
      <div>
        <div class="section-kicker">筛选与列表</div>
        <h2>按主题整理你的资料库</h2>
        <p class="section-note">系统会根据总览页入口参数，自动定位更合适的资料文档。</p>
      </div>
    </div>

    <LibraryFilterTabs
      :tabs="filterTabs"
      :active-key="activeFilter"
      @change="activeFilter = $event"
    />

    <div class="document-list">
      <DocumentListItem
        v-for="doc in filteredDocuments"
        :key="doc.id"
        :id="doc.id"
        :name="doc.name"
        :type="doc.type"
        :size-text="formatBytes(doc.size)"
        :imported-at="doc.importedAt"
        :tags="doc.tags"
        :status="doc.status"
        :source-label="doc.sourceKey ? (sourceLabelMap[doc.sourceKey] || doc.sourceKey) : ''"
        :recommended-reason="doc.recommendedReason"
        :active="doc.id === selectedDocumentId"
        @select="selectedDocumentId = doc.id"
      />
    </div>

    <template #aside>
      <DocumentPreviewPanel
        v-if="selectedDocument"
        :name="selectedDocument.name"
        :type="selectedDocument.type"
        :imported-at="selectedDocument.importedAt"
        :summary="selectedDocument.summary"
        :tags="selectedDocument.tags"
        :status="selectedDocument.status"
        :topic-labels="selectedDocument.topicKeys.map(key => topicLabelMap[key])"
        :source-label="selectedDocument.sourceKey ? (sourceLabelMap[selectedDocument.sourceKey] || selectedDocument.sourceKey) : ''"
        :recommended-reason="selectedDocument.recommendedReason"
        :raw-text="selectedDocument.rawText"
      />

      <section class="tip-card">
        <div class="section-kicker">导入建议</div>
        <h3>第一版推荐导入什么？</h3>
        <ul>
          <li>按主题整理的 Markdown 面试总结</li>
          <li>项目复盘类 Word 文档</li>
          <li>高频追问和场景题清单</li>
        </ul>
      </section>
    </template>
  </WorkbenchContentShell>
</template>

<style lang="scss" scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0 22px;
}

.section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #7182f8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.section-head {
  margin-bottom: 14px;
}

.section-head h2,
.tip-card h3 {
  margin: 8px 0 0;
  font-size: 22px;
  color: #1f2746;
}

.section-note {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: #7b88a0;
}

.document-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.tip-card {
  padding: 20px;
  border: 1px solid #e8edf6;
  border-radius: 24px;
  background: rgb(255 255 255 / 90%);
  box-shadow: 0 16px 40px rgb(36 53 87 / 7%);
}

.tip-card ul {
  margin: 16px 0 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.8;
  color: #6d7a92;
}

.tip-card li + li {
  margin-top: 8px;
}

@media (max-width: 1440px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>

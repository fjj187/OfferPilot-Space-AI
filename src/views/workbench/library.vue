<script lang="ts" setup>
import DocumentListItem from '@/components/library/DocumentListItem.vue'
import DocumentPreviewPanel from '@/components/library/DocumentPreviewPanel.vue'
import ImportActionCard from '@/components/library/ImportActionCard.vue'
import LibraryFilterTabs from '@/components/library/LibraryFilterTabs.vue'
import LibraryHeader from '@/components/library/LibraryHeader.vue'
import LibraryStatCard from '@/components/library/LibraryStatCard.vue'
import WorkbenchContentShell from '@/components/workbench/WorkbenchContentShell.vue'
import {
  documentList as initialDocumentList,
  filterTabs,
  libraryStats,
  type LibraryDocument
} from './library.data'

const route = useRoute()

const resolveFilterFromQuery = () => {
  const topic = String(route.query.topic || '')
  const docType = String(route.query.docType || '')

  if (docType === 'md' || docType === 'docx') return docType
  if (filterTabs.some(tab => tab.key === topic)) return topic
  return 'all'
}

const activeFilter = ref(resolveFilterFromQuery())
const documentList = ref<LibraryDocument[]>([...initialDocumentList])
const selectedDocumentId = ref(documentList.value[0]?.id || '')

const refFileInput = ref<HTMLInputElement | null>(null)
const refFolderInput = ref<HTMLInputElement | null>(null)

const selectedDocument = computed(() => {
  return documentList.value.find(item => item.id === selectedDocumentId.value) || documentList.value[0]
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

  return documentList.value.filter(item => item.tags.some(tag => tag.toLowerCase().includes(activeFilter.value.toLowerCase())))
})

watch(filteredDocuments, (list) => {
  if (!list.length) return
  const exists = list.some(item => item.id === selectedDocumentId.value)
  if (!exists) {
    selectedDocumentId.value = list[0].id
  }
}, { immediate: true })

watch(() => route.query, () => {
  activeFilter.value = resolveFilterFromQuery()
}, { deep: true })

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
  if (lower.includes('工') || lower.includes('build')) tags.push('工程化')
  if (lower.includes('浏览') || lower.includes('browser')) tags.push('浏览器')
  if (lower.includes('性能')) tags.push('性能优化')
  if (lower.includes('项目')) tags.push('项目场景')
  return tags.length ? tags : ['待分类']
}

const createLibraryDocument = async (file: File): Promise<LibraryDocument> => {
  const ext = file.name.toLowerCase().endsWith('.docx') ? 'docx' : 'md'
  let rawText = ''
  let summary = '文档已导入，等待进一步解析。'

  if (ext === 'md') {
    rawText = await file.text()
    summary = rawText.slice(0, 120).replace(/\s+/g, ' ').trim() || 'Markdown 文档已导入。'
  } else {
    summary = 'Word 文档已导入，第一版先展示基础信息，后续再补充更完整解析。'
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
    status: ext === 'md' ? 'parsed' : 'pending'
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
  selectedDocumentId.value = nextDocs[0].id
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

    <LibraryHeader />

    <ImportActionCard
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
        :raw-text="selectedDocument.rawText"
      />

      <section class="tip-card">
        <div class="section-kicker">导入建议</div>
        <h3>第一版推荐导入什么</h3>
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

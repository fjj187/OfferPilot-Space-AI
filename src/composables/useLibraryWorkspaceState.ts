import type { Ref } from 'vue'
import type { PersistedTopicKey } from '@/types/workbench'
import { useWorkbenchPersistence } from '@/composables/useWorkbenchPersistence'
import {
  type LibraryDocument,
  type LibraryTopicKey,
  filterTabs,
  documentList as initialDocumentList,
  libraryStats
} from '@/views/workbench/library.data'

interface LibraryWorkspaceOptions {
  preferredTopic?: Ref<PersistedTopicKey>
  preferredSource?: Ref<string>
}

const topicLabelMap: Record<LibraryTopicKey, string> = {
  vue3: 'Vue 3',
  typescript: 'TypeScript',
  engineering: '工程化',
  browser: '浏览器',
  performance: '性能优化',
  scenario: '场景题'
}

const sourceLabelMap: Record<string, string> = {
  'hero-import': '总览导入入口',
  'library-frontend-notes': '前端八股总纲',
  'library-project-review': '项目复盘沉淀',
  'library-follow-up-questions': '高频追问清单',
  overview: '宇宙总览承接',
  library: '资料库上下文'
}

export const useLibraryWorkspaceState = (options: LibraryWorkspaceOptions = {}) => {
  const {
    loadLibraryDocuments,
    loadWorkbenchContext,
    saveImportedLibraryDocuments,
    saveWorkbenchContext
  } = useWorkbenchPersistence()

  const refFileInput = ref<HTMLInputElement | null>(null)
  const refFolderInput = ref<HTMLInputElement | null>(null)
  const seedDocumentIds = new Set(initialDocumentList.map(item => item.id))
  const persistedContext = ref(loadWorkbenchContext())
  const preferredTopic = options.preferredTopic
  const preferredSource = options.preferredSource

  const resolveFilterFromContext = () => {
    return 'all'
  }

  const activeFilter = ref(resolveFilterFromContext())
  const documentList = ref<LibraryDocument[]>(loadLibraryDocuments(initialDocumentList))
  const selectedDocumentId = ref(persistedContext.value?.activeDocumentId || documentList.value[0]?.id || '')
  const shouldPersistSelectedDocument = ref(Boolean(persistedContext.value?.activeDocumentId))
  const lastImportedIds = ref<string[]>([])
  const showImportFeedback = ref(false)
  const importFeedbackText = ref('')
  const shouldScrollToImported = ref(false)

  let importFeedbackTimer: ReturnType<typeof setTimeout> | null = null

  const selectedDocument = computed(() => {
    if (!selectedDocumentId.value) return null
    return documentList.value.find(item => item.id === selectedDocumentId.value) || null
  })

  const filteredDocuments = computed(() => {
    if (activeFilter.value === 'all') return documentList.value

    if (activeFilter.value === 'md' || activeFilter.value === 'docx') {
      return documentList.value.filter(item => item.type === activeFilter.value)
    }

    return documentList.value.filter(item => item.topicKeys.includes(activeFilter.value as LibraryTopicKey))
  })

  const workspaceTitle = computed(() => {
    const topic = preferredTopic?.value
    if (topic && topicLabelMap[topic as LibraryTopicKey]) {
      return `当前正在整理与 ${ topicLabelMap[topic as LibraryTopicKey] } 相关的资料工作区`
    }
    return '在这里上传、筛选、预览并管理当前训练所依赖的资料'
  })

  const workspaceDesc = computed(() => {
    const source = preferredSource?.value
    if (source && sourceLabelMap[source]) {
      return `当前来源：${ sourceLabelMap[source] }`
    }
    return '资料库场景负责资料导入、列表筛选、标签管理与当前训练资料承接。'
  })

  const nextStepTitle = computed(() => {
    if (lastImportedIds.value.length) {
      return '新资料已经进入当前资料工作区，可以直接预览并继续进入模拟面试'
    }
    return '先整理资料，再决定哪份资料作为当前训练上下文'
  })

  const nextStepDesc = computed(() => {
    if (lastImportedIds.value.length) {
      return '建议先确认右侧预览内容是否正确，再点击“去模拟面试”承接这份资料。'
    }
    return '这一区只负责资料管理，不再重复展示训练进度。'
  })

  const derivedStats = computed(() => {
    const total = documentList.value.length
    const parsed = documentList.value.filter(item => item.status === 'parsed').length
    const pending = documentList.value.filter(item => item.status === 'pending').length

    return libraryStats.map((item) => {
      if (item.tone === 'primary') {
        return {
          ...item,
          value: String(total).padStart(2, '0')
        }
      }

      if (item.label.includes('解析')) {
        return {
          ...item,
          value: String(parsed).padStart(2, '0')
        }
      }

      return {
        ...item,
        value: String(pending).padStart(2, '0')
      }
    })
  })

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${ bytes } B`
    if (bytes < 1024 * 1024) return `${ Math.round(bytes / 1024) } KB`
    return `${ (bytes / (1024 * 1024)).toFixed(1) } MB`
  }

  const resolvePreferredDocumentId = (list: LibraryDocument[]) => {
    if (!list.length) return ''

    if (lastImportedIds.value.length) {
      const importedDoc = list.find(item => item.id === lastImportedIds.value[0])
      if (importedDoc) return importedDoc.id
    }

    const source = preferredSource?.value
    if (source) {
      const matchedBySource = list.find(item => item.sourceKey === source)
      if (matchedBySource) return matchedBySource.id
    }

    const topic = preferredTopic?.value
    if (topic) {
      const matchedByTopic = list.find(item => item.topicKeys.includes(topic as LibraryTopicKey))
      if (matchedByTopic) return matchedByTopic.id
    }

    if (persistedContext.value?.activeDocumentId) {
      const persistedDoc = list.find(item => item.id === persistedContext.value?.activeDocumentId)
      if (persistedDoc) return persistedDoc.id
    }

    return list[0].id
  }

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
    return topicKeys.length ? topicKeys : preferredTopic?.value ? [preferredTopic.value as LibraryTopicKey] : ['scenario']
  }

  const createLibraryDocument = async (file: File): Promise<LibraryDocument> => {
    const ext = file.name.toLowerCase().endsWith('.docx') ? 'docx' : 'md'
    let rawText = ''
    let summary = '文档已导入，等待进一步解析。'

    if (ext === 'md') {
      rawText = await file.text()
      summary = rawText.slice(0, 120).replace(/\s+/g, ' ').trim() || 'Markdown 文档已导入。'
    }
    else {
      summary = 'Word 文档已导入，当前先展示基础信息，后续再补完整解析。'
    }

    return {
      id: `${ file.name }-${ file.lastModified }`,
      name: file.name,
      type: ext,
      size: file.size,
      importedAt: new Date().toLocaleString('zh-CN', {
        hour12: false
      }),
      rawText,
      summary,
      tags: inferTags(file.name),
      status: ext === 'md' ? 'parsed' : 'pending',
      topicKeys: inferTopicKeys(file.name),
      sourceKey: preferredSource?.value || 'hero-import',
      recommendedReason: preferredSource?.value
        ? '这份资料会承接当前宇宙页上下文，可直接作为后续训练参考。'
        : '根据文件名和当前主题自动分类，建议确认标签后再进入训练。'
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

    const importedCountText = nextDocs.length === 1 ? '1 份资料' : `${ nextDocs.length } 份资料`
    showFeedback(`已成功导入 ${ importedCountText }，并自动定位到最新文档。`)
  }

  const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    await appendFiles(target.files)
    target.value = ''
  }

  watch(documentList, (list) => {
    if (!list.length) {
      selectedDocumentId.value = ''
      return
    }

    const exists = list.some(item => item.id === selectedDocumentId.value)
    if (selectedDocumentId.value && !exists) {
      selectedDocumentId.value = resolvePreferredDocumentId(list)
    }
  }, {
    immediate: true,
    deep: true
  })

  watch(documentList, (list) => {
    const importedDocuments = list.filter(item => !seedDocumentIds.has(item.id))
    saveImportedLibraryDocuments(importedDocuments)
  }, {
    deep: true
  })

  watch(selectedDocumentId, (documentId) => {
    if (!documentId || !shouldPersistSelectedDocument.value) return
    const selected = documentList.value.find(item => item.id === documentId)
    const fallbackTopic = selected?.topicKeys[0] || 'scenario'
    const currentSourcePage = persistedContext.value?.sourcePage || loadWorkbenchContext()?.sourcePage || 'library'

    persistedContext.value = saveWorkbenchContext({
      activeTopic: (preferredTopic?.value || fallbackTopic) as PersistedTopicKey,
      activeDocumentId: documentId,
      sourcePage: currentSourcePage
    })
  }, {
    immediate: true
  })

  const setSelectedDocumentId = (documentId: string) => {
    shouldPersistSelectedDocument.value = Boolean(documentId)
    selectedDocumentId.value = documentId
  }

  const pickFiles = () => {
    refFileInput.value?.click()
  }

  const pickFolder = () => {
    refFolderInput.value?.click()
  }

  return {
    refFileInput,
    refFolderInput,
    filterTabs,
    sourceLabelMap,
    topicLabelMap,
    activeFilter,
    documentList,
    filteredDocuments,
    selectedDocumentId,
    setSelectedDocumentId,
    selectedDocument,
    lastImportedIds,
    showImportFeedback,
    importFeedbackText,
    workspaceTitle,
    workspaceDesc,
    nextStepTitle,
    nextStepDesc,
    derivedStats,
    formatBytes,
    pickFiles,
    pickFolder,
    handleFileChange
  }
}

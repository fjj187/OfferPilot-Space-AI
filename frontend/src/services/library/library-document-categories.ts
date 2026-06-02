import type { PersistedTopicKey } from '@/types/workbench'

import {

  type LibraryDocument,

  type LibraryFilterTab,

  filterTabs as baseLibraryFilterTabs,

  isLibraryFormatFilterKey,

  matchesLibraryFormatFilter

} from '@/views/workbench/library.data'



/** 历史占位标签，导入时不再写入；读取旧数据时过滤掉 */

export const LIBRARY_PENDING_CATEGORY_LABEL = '待分类'



export const LIBRARY_CATEGORY_PRESETS: ReadonlyArray<{

  tag: string

  topicKey: PersistedTopicKey

}> = [

  { tag: 'Vue 3', topicKey: 'vue3' },

  { tag: 'TypeScript', topicKey: 'typescript' },

  { tag: '工程化', topicKey: 'engineering' },

  { tag: '浏览器', topicKey: 'browser' },

  { tag: '性能优化', topicKey: 'performance' },

  { tag: '场景题', topicKey: 'scenario' }

]



export const LIBRARY_TAG_TO_TOPIC_KEY = LIBRARY_CATEGORY_PRESETS.reduce<Record<string, PersistedTopicKey>>(

  (map, item) => {

    map[item.tag] = item.topicKey

    return map

  },

  {}

)



export const isPredefinedLibraryTag = (tag: string) => Boolean(LIBRARY_TAG_TO_TOPIC_KEY[tag])



export const buildTagFilterKey = (label: string) => `tag:${label}`



export const parseTagFilterKey = (filterKey: string) => (

  filterKey.startsWith('tag:') ? filterKey.slice(4) : null

)



export const normalizeDocumentTags = (tags: string[]) => {

  const seen = new Set<string>()

  const next: string[] = []



  tags.forEach((raw) => {

    const trimmed = raw.trim()

    if (!trimmed || trimmed === LIBRARY_PENDING_CATEGORY_LABEL) return

    if (seen.has(trimmed)) return

    seen.add(trimmed)

    next.push(trimmed)

  })



  return next

}



export const resolveTopicKeysFromTags = (tags: string[]): PersistedTopicKey[] => {

  const keys: PersistedTopicKey[] = []

  normalizeDocumentTags(tags).forEach((tag) => {

    const topicKey = LIBRARY_TAG_TO_TOPIC_KEY[tag]

    if (topicKey && !keys.includes(topicKey)) {

      keys.push(topicKey)

    }

  })

  return keys

}



export const collectCustomCategoryLabels = (

  documents: Array<Pick<LibraryDocument, 'tags'>>

) => {

  const labels = new Set<string>()



  documents.forEach((document) => {

    document.tags.forEach((tag) => {

      if (tag === LIBRARY_PENDING_CATEGORY_LABEL) return

      if (!isPredefinedLibraryTag(tag)) {

        labels.add(tag)

      }

    })

  })



  return [...labels].sort((prev, next) => prev.localeCompare(next, 'zh-CN'))
}

/** 保存前合并输入框里尚未点「添加」的分类 */
export const mergePendingCustomTag = (tags: string[], pendingInput: string) => {
  const trimmed = pendingInput.trim()
  if (!trimmed) return normalizeDocumentTags(tags)
  return normalizeDocumentTags([...tags, trimmed])
}

/** 资料库中已有、当前资料尚未选用的自定义分类 */
export const resolveQuickPickCustomTags = (
  existingCustomTags: string[],
  selectedTags: string[]
) => {
  const selected = new Set(
    normalizeDocumentTags(selectedTags).filter(tag => !isPredefinedLibraryTag(tag))
  )
  return existingCustomTags.filter(tag => !selected.has(tag))
}

export const buildLibraryFilterTabs = (

  documents: Array<Pick<LibraryDocument, 'tags'>>

): LibraryFilterTab[] => {

  const customTabs = collectCustomCategoryLabels(documents).map(label => ({

    key: buildTagFilterKey(label),

    label

  }))



  return [...baseLibraryFilterTabs, ...customTabs]

}



export const matchesLibraryDocumentFilter = (

  document: Pick<LibraryDocument, 'type' | 'topicKeys' | 'tags'>,

  filterKey: string

) => {

  if (filterKey === 'all') return true



  if (isLibraryFormatFilterKey(filterKey)) {

    return matchesLibraryFormatFilter(document.type, filterKey)

  }



  const tagLabel = parseTagFilterKey(filterKey)

  if (tagLabel) {

    return document.tags.includes(tagLabel)

  }



  return document.topicKeys.includes(filterKey as PersistedTopicKey)

}



export const resolveLibraryDocumentImportedName = (

  document: Pick<LibraryDocument, 'importedName' | 'name'>

) => document.importedName?.trim() || document.name



export const resolveLibraryDocumentSourceLabel = (

  document: Pick<LibraryDocument, 'importedName' | 'name' | 'sourceKey'>,

  sourceLabelMap: Record<string, string> = {}

) => {

  if (document.importedName?.trim()) {

    return document.importedName.trim()

  }

  if (document.sourceKey && sourceLabelMap[document.sourceKey]) {

    return sourceLabelMap[document.sourceKey]

  }

  return document.name

}



export const inferTagsFromFileName = (name: string) => {

  const lower = name.toLowerCase()

  const tags: string[] = []



  if (lower.includes('vue')) tags.push('Vue 3')

  if (lower.includes('ts') || lower.includes('type')) tags.push('TypeScript')

  if (lower.includes('build') || lower.includes('工程')) tags.push('工程化')

  if (lower.includes('browser')) tags.push('浏览器')

  if (lower.includes('性能')) tags.push('性能优化')

  if (lower.includes('项目') || lower.includes('场景')) tags.push('场景题')



  return normalizeDocumentTags(tags)

}



/** @deprecated 混合资料不再要求文档级分类，保留供旧逻辑兼容 */

export const isLibraryDocumentUncategorized = (_tags: string[]) => false



export const resolveLibraryDocumentDisplayTags = (tags: string[]) => normalizeDocumentTags(tags)



export const resolveLibraryDocumentStatusLabel = (options: {

  status: 'pending' | 'parsed' | 'error'

  tags?: string[]

  active?: boolean

  activeLabel?: string

}) => {

  if (options.active && options.activeLabel) return options.activeLabel

  if (options.status === 'parsed') return '已解析'

  if (options.status === 'error') return '异常'

  return ''

}



export const resolveLibraryDocumentStatusClass = (options: {

  status: 'pending' | 'parsed' | 'error'

  tags?: string[]

}) => {

  if (options.status === 'error') return 'is-error'

  if (options.status === 'parsed') return 'is-parsed'

  return 'is-pending'

}



import { describe, expect, it } from 'vitest'

import {

  buildLibraryFilterTabs,

  buildTagFilterKey,

  inferTagsFromFileName,

  matchesLibraryDocumentFilter,

  mergePendingCustomTag,

  normalizeDocumentTags,

  resolveLibraryDocumentDisplayTags,

  resolveLibraryDocumentSourceLabel,

  resolveLibraryDocumentStatusLabel,

  resolveQuickPickCustomTags,

  resolveTopicKeysFromTags

} from '@/services/library/library-document-categories'



describe('library-document-categories', () => {

  it('normalizeDocumentTags removes placeholder and returns empty when no real tags', () => {

    expect(normalizeDocumentTags(['待分类', '面经'])).toEqual(['面经'])

    expect(normalizeDocumentTags([])).toEqual([])

    expect(normalizeDocumentTags(['待分类'])).toEqual([])

  })



  it('resolveTopicKeysFromTags maps preset labels to topic keys', () => {

    expect(resolveTopicKeysFromTags(['Vue 3', '面经'])).toEqual(['vue3'])

  })



  it('buildLibraryFilterTabs appends custom category capsules', () => {

    const tabs = buildLibraryFilterTabs([

      { tags: ['面经'] },

      { tags: ['Vue 3'] }

    ])



    expect(tabs.some(tab => tab.key === buildTagFilterKey('面经') && tab.label === '面经')).toBe(true)

    expect(tabs.some(tab => tab.key === 'md')).toBe(true)

  })



  it('matchesLibraryDocumentFilter supports custom tag filters', () => {

    const document = {

      type: 'docx' as const,

      topicKeys: [] as const,

      tags: ['面经']

    }



    expect(matchesLibraryDocumentFilter(document, buildTagFilterKey('面经'))).toBe(true)

    expect(matchesLibraryDocumentFilter(document, 'vue3')).toBe(false)

  })



  it('inferTagsFromFileName keeps filename heuristics without placeholder', () => {

    expect(inferTagsFromFileName('vue3-notes.md')).toContain('Vue 3')

    expect(inferTagsFromFileName('牛客面经.docx')).toEqual([])

  })



  it('resolveLibraryDocumentDisplayTags returns normalized tags only', () => {

    expect(resolveLibraryDocumentDisplayTags(['待分类'])).toEqual([])

    expect(resolveLibraryDocumentDisplayTags(['场景题', '待分类'])).toEqual(['场景题'])

  })



  it('resolveLibraryDocumentStatusLabel reflects parse status only', () => {

    expect(resolveLibraryDocumentStatusLabel({

      status: 'pending',

      tags: []

    })).toBe('')



    expect(resolveLibraryDocumentStatusLabel({

      status: 'parsed',

      tags: []

    })).toBe('已解析')

  })



  it('mergePendingCustomTag appends input on save', () => {
    expect(mergePendingCustomTag(['面经'], '算法')).toEqual(['面经', '算法'])
    expect(mergePendingCustomTag(['面经'], '  ')).toEqual(['面经'])
  })

  it('resolveQuickPickCustomTags excludes tags already on document', () => {
    expect(resolveQuickPickCustomTags(['面经', '算法', '项目'], ['面经'])).toEqual(['算法', '项目'])
    expect(resolveQuickPickCustomTags(['面经'], ['面经'])).toEqual([])
  })

  it('resolveLibraryDocumentSourceLabel prefers imported file name', () => {

    expect(resolveLibraryDocumentSourceLabel({

      importedName: '原始面经.docx',

      name: '我的面经笔记',

      sourceKey: 'library-project-review'

    }, {

      'library-project-review': '项目复盘沉淀'

    })).toBe('原始面经.docx')

  })

})



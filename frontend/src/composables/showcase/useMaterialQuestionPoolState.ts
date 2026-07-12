import { computed, ref } from 'vue'
import type { MaterialQuestionPool } from '@/types/material'
import type { PersistedLibraryDocument } from '@/types/workbench'
import { resolveMaterialDocumentVersion } from '@/services/material/material-document-version'
import { generateMaterialResourceQuestionPool } from '@/services/material/resource-question-api'
import {
  getMaterialQuestionPool,
  setMaterialQuestionPool
} from '@/services/storage/material-pool-storage'

interface PrepareMaterialQuestionOptions {
  count: number
  orderMode: 'chapter' | 'random'
  modelId?: string
}

export function useMaterialQuestionPoolState(getDocumentById: (documentId: string) => PersistedLibraryDocument | null) {
  const poolVersion = ref(0)

  const touchPoolVersion = () => {
    poolVersion.value += 1
  }

  const resolvePoolForDocument = (document: PersistedLibraryDocument | null) => {
    void poolVersion.value
    if (!document) return null

    const storedPool = getMaterialQuestionPool(document.id)
    const currentVersion = resolveMaterialDocumentVersion(document)
    if (!storedPool) return null
    if (storedPool.documentVersion !== currentVersion) {
      return {
        ...storedPool,
        status: 'idle' as const,
        errorMessage: '资料内容已更新，请重新生成练习题'
      }
    }
    return storedPool
  }

  const getPoolStatusLabel = (pool: MaterialQuestionPool | null) => {
    if (!pool || pool.status === 'idle') return '未准备'
    if (pool.status === 'preparing') return '准备中'
    if (pool.status === 'ready') return `已生成 ${ pool.questions.length } 题`
    if (pool.status === 'error') return '生成失败'
    return '未准备'
  }

  const prepareMaterialQuestions = async (
    documentId: string,
    options: PrepareMaterialQuestionOptions
  ) => {
    const document = getDocumentById(documentId)
    if (!document?.rawText?.trim()) {
      return {
        ok: false as const,
        message: '当前资料正文为空，请先导入或补充内容'
      }
    }

    const documentVersion = resolveMaterialDocumentVersion(document)

    setMaterialQuestionPool({
      documentId,
      documentVersion,
      chunks: [],
      questions: [],
      preparedAt: new Date().toISOString(),
      status: 'preparing'
    })
    touchPoolVersion()

    let pool: MaterialQuestionPool

    try {
      const result = await generateMaterialResourceQuestionPool(document, {
        count: Math.max(1, options.count || 1),
        orderMode: options.orderMode,
        documentVersion,
        modelId: options.modelId
      })

      pool = {
        documentId,
        documentVersion,
        chunks: [],
        questions: result.questions,
        resourceQuestionMeta: result.resourceQuestionMeta,
        preparedAt: new Date().toISOString(),
        status: result.questions.length ? 'ready' : 'error',
        errorMessage: result.questions.length ? undefined : '当前资料暂未生成可用题目'
      }
    } catch (error) {
      pool = {
        documentId,
        documentVersion,
        chunks: [],
        questions: [],
        preparedAt: new Date().toISOString(),
        status: 'error',
        errorMessage: error instanceof Error ? error.message : '资料出题失败，请稍后重试'
      }
    }

    setMaterialQuestionPool(pool)
    touchPoolVersion()

    if (pool.status !== 'ready') {
      return {
        ok: false as const,
        message: pool.errorMessage || '未能从当前资料生成练习题'
      }
    }

    return {
      ok: true as const,
      pool
    }
  }

  const selectedDocumentPool = computed(() => {
    return (documentId: string) => resolvePoolForDocument(getDocumentById(documentId))
  })

  return {
    poolVersion,
    touchPoolVersion,
    resolvePoolForDocument,
    getPoolStatusLabel,
    prepareMaterialQuestions,
    selectedDocumentPool
  }
}

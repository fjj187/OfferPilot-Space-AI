import { computed, ref } from 'vue'
import type { MaterialQuestionPool } from '@/types/material'
import type { PersistedLibraryDocument } from '@/types/workbench'
import { buildMaterialQuestionPool } from '@/services/material/material-question-builder'
import { resolveMaterialDocumentVersion } from '@/services/material/material-document-version'
import {
  getMaterialQuestionPool,
  setMaterialQuestionPool
} from '@/utils/storage/material-pool-storage'

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

  const prepareMaterialQuestions = async (documentId: string) => {
    const document = getDocumentById(documentId)
    if (!document?.rawText?.trim()) {
      return {
        ok: false as const,
        message: '当前资料正文为空，请先导入或补充内容'
      }
    }

    setMaterialQuestionPool({
      documentId,
      documentVersion: resolveMaterialDocumentVersion(document),
      chunks: [],
      questions: [],
      preparedAt: new Date().toISOString(),
      status: 'preparing'
    })
    touchPoolVersion()

    const pool = buildMaterialQuestionPool(document)
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

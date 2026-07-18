import type { AxiosRequestConfig } from 'axios'
import request from '@/services/http/request'
import type {
  MaterialQuestionItem,
  MaterialResourceQuestion,
  ResourceQuestionSequenceMode
} from '@/types/material'
import type { PersistedLibraryDocument } from '@/types/workbench'
import { inferMaterialQuestionTopicKeys } from '@/services/material/material-question-topics'

interface ApiEnvelope<T> {
  success?: boolean
  data?: T
  code?: string | number
  msg?: string
  message?: string
}

interface AnalyzeResourceResponse {
  resourceId: string
  summary: string
  knowledgePoints: Array<{
    id: string
    name: string
    description: string
    chapterTitle: string
    difficultyLevel: MaterialQuestionItem['difficulty']
    orderIndex: number
  }>
  seedCount: number
}

interface GenerateResourceQuestionResponse {
  questionId: string
  resourceId: string
  seedId: string
  title: string
  question: string
  answerOutline: string[]
  knowledgePoint: string
  difficulty: MaterialQuestionItem['difficulty']
  questionType: MaterialQuestionItem['questionType']
  sourceRefs: string[]
  nextCursor?: string
  hasNext?: boolean
  createdAt: string
}

interface GenerateMaterialResourceQuestionPoolOptions {
  count: number
  orderMode: 'chapter' | 'random'
  documentVersion: string
  modelId?: string
}

const RESOURCE_QUESTION_REQUEST_TIMEOUT_MS = 180_000

const resolveResourceApiBase = () => {
  const configuredBase = import.meta.env.VITE_RESOURCE_API_BASE_URL?.trim() || ''
  if (configuredBase) return configuredBase.replace(/\/$/, '')
  if (import.meta.env.DEV) {
    return `${ window.location.origin }/api/resource`
  }
  return ''
}

const normalizeApiPath = (apiBase: string, path: string) => `${ apiBase }${ path }`

const unwrapApiEnvelope = <T>(response: IRequestData, fallbackMessage: string) => {
  const responseEnvelope = response as ApiEnvelope<T>

  if (responseEnvelope && typeof responseEnvelope === 'object' && 'success' in responseEnvelope) {
    const envelope = responseEnvelope
    if (envelope.success === false) {
      throw new Error(envelope.message || fallbackMessage)
    }
    return envelope.data as T
  }

  const payload = (response.data || response) as ApiEnvelope<T> | T

  if (payload && typeof payload === 'object' && 'code' in payload) {
    const envelope = payload as ApiEnvelope<T>
    if (String(envelope.code) !== '200') {
      throw new Error(envelope.message || envelope.msg || fallbackMessage)
    }
    if (envelope.data) {
      return envelope.data
    }

    const businessPayload = {
      ...envelope
    }
    delete businessPayload.code
    delete businessPayload.msg
    delete businessPayload.message
    return businessPayload as T
  }

  if (response.error !== 0) {
    if (response.errorType === 'timeout') {
      throw new Error('资料出题请求超时，请确认后端和模型服务可用后重试')
    }
    if (response.errorType === 'network') {
      throw new Error('无法连接资料出题服务，请确认已运行 pnpm dev 并启动后端')
    }
    throw new Error(response.msg || fallbackMessage)
  }

  return payload as T
}

const postResourceApi = async <T>(
  path: string,
  payload: unknown,
  config?: AxiosRequestConfig
) => {
  const apiBase = resolveResourceApiBase()
  if (!apiBase) {
    throw new Error('资料出题 API 未配置。')
  }

  const response = await request.post(
    normalizeApiPath(apiBase, path),
    payload,
    {
      timeout: RESOURCE_QUESTION_REQUEST_TIMEOUT_MS,
      requestName: path,
      ...config
    }
  )
  return unwrapApiEnvelope<T>(response, '资料出题请求失败，请稍后重试。')
}

const toSequenceMode = (orderMode: 'chapter' | 'random'): ResourceQuestionSequenceMode => (
  orderMode === 'chapter' ? 'by_chapter' : 'by_knowledge'
)

const toMaterialQuestion = (
  question: GenerateResourceQuestionResponse,
  order: number
): MaterialQuestionItem => {
  const materialQuestion = {
    id: question.questionId,
    documentId: question.resourceId,
    chunkId: question.sourceRefs[0] || question.seedId,
    seedId: question.seedId,
    order,
    title: question.title,
    prompt: question.question,
    difficulty: question.difficulty,
    questionType: question.questionType,
    generatedBy: 'llm' as const,
    focusAreas: question.difficulty === 'hard'
      ? ['principle_depth' as const]
      : question.questionType === 'scenario'
        ? ['case_detail' as const]
        : ['structure' as const],
    referenceAnswer: question.answerOutline.join('\n'),
    sourceHeading: question.knowledgePoint,
    sourceRefs: question.sourceRefs
  }

  return {
    ...materialQuestion,
    topicKeys: inferMaterialQuestionTopicKeys(materialQuestion)
  }
}

const analyzeResource = (
  document: PersistedLibraryDocument,
  options: GenerateMaterialResourceQuestionPoolOptions
) => {
  return postResourceApi<AnalyzeResourceResponse>('/analyze', {
    resourceId: document.id,
    title: document.name,
    rawText: document.rawText,
    documentVersion: options.documentVersion,
    modelId: options.modelId
  }, {
    requestName: 'analyzeResourceQuestion'
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : '资料分析失败'
    throw new Error(`资料分析失败：${ message }`)
  })
}

const generateNextQuestion = (payload: {
  resourceId: string
  sequenceMode: ResourceQuestionSequenceMode
  cursor: string
  modelId?: string
  fastMode?: boolean
}) => postResourceApi<GenerateResourceQuestionResponse>('/question/next', payload, {
  requestName: 'generateNextResourceQuestion'
}).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : '顺序出题失败'
  throw new Error(`顺序出题失败：${ message }`)
})

const generateRandomQuestion = (payload: {
  resourceId: string
  excludeSeedIds: string[]
  modelId?: string
  fastMode?: boolean
}) => postResourceApi<GenerateResourceQuestionResponse>('/question/random', payload, {
  requestName: 'generateRandomResourceQuestion'
}).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : '随机出题失败'
  throw new Error(`随机出题失败：${ message }`)
})

export const generateMaterialResourceQuestionPool = async (
  document: PersistedLibraryDocument,
  options: GenerateMaterialResourceQuestionPoolOptions
) => {
  const analyzeResult = await analyzeResource(document, options)
  if (!analyzeResult?.seedCount) {
    throw new Error('资料分析成功，但没有返回可用题目种子')
  }
  const targetCount = Math.max(1, Math.min(options.count || 1, analyzeResult.seedCount || options.count || 1))
  const questions: MaterialQuestionItem[] = []
  const usedSeedIds = new Set<string>()
  let cursor = '0'

  for (let index = 0; index < targetCount; index += 1) {
    const resourceQuestion = options.orderMode === 'random'
      ? await generateRandomQuestion({
        resourceId: document.id,
        excludeSeedIds: [...usedSeedIds],
        fastMode: true
      })
      : await generateNextQuestion({
        resourceId: document.id,
        sequenceMode: toSequenceMode(options.orderMode),
        cursor,
        fastMode: true
      })

    usedSeedIds.add(resourceQuestion.seedId)
    cursor = resourceQuestion.nextCursor || String(index + 1)
    questions.push(toMaterialQuestion(resourceQuestion, index))
  }

  const resourceQuestionMeta: MaterialResourceQuestion = {
    summary: analyzeResult.summary,
    seedCount: analyzeResult.seedCount,
    knowledgePoints: analyzeResult.knowledgePoints.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      chapterTitle: item.chapterTitle,
      difficultyLevel: item.difficultyLevel
    }))
  }

  return {
    questions,
    resourceQuestionMeta
  }
}

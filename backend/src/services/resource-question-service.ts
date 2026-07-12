import { completeRemoteLlmJson, isRemoteLlmConfigured } from '../utils/complete-remote-llm-json.js'
import {
  buildGenerateResourceQuestionLlmMessages,
  buildResourceAnalyzeLlmMessages,
  parseGeneratedResourceQuestionJson,
  parseResourceAnalyzeLlmJson
} from '../utils/resource-question-llm.js'
import {
  getStoredResourceQuestionRecord,
  upsertStoredResourceQuestionRecord
} from '../storage/resource-question-store.js'
import type {
  AnalyzeResourceQuestionRequest,
  GenerateNextResourceQuestionRequest,
  GenerateRandomResourceQuestionRequest,
  GeneratedResourceQuestionDto,
  KnowledgePointDto,
  QuestionSeedDto,
  ResourceChunkDto,
  ResourceQuestionDifficulty,
  ResourceQuestionRecord,
  ResourceQuestionType
} from '../types/resource-question.js'

const headingPattern = /^(#{1,4})\s+(.+)$/
const maxChunkLength = 1000
const minChunkLength = 80
const minSubstantiveChunkLength = 12

const difficultyRank: Record<ResourceQuestionDifficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2
}

const isSeparatorLine = (line: string) => /^-{3,}$/.test(line.trim()) || /^_{3,}$/.test(line.trim())

const normalizeText = (value: string) => value.replace(/\r\n/g, '\n').trim()

const estimateTokenCount = (text: string) => Math.ceil(text.length / 2)

const resolveQuestionType = (text: string): ResourceQuestionType => {
  if (/```[\s\S]*?```/.test(text)) return 'code'
  if (/场景|项目|案例|沟通|设计/.test(text)) return 'scenario'
  return 'concept'
}

const resolveDifficulty = (text: string, level: number): ResourceQuestionDifficulty => {
  if (/为什么|原理|源码|底层|机制|架构/.test(text)) return 'hard'
  if (level <= 2 || /代码|性能|工程化/.test(text)) return 'medium'
  return 'easy'
}

const pushResourceChunk = (
  chunks: ResourceChunkDto[],
  resourceId: string,
  heading: string,
  level: number,
  content: string
) => {
  const normalized = content.trim()
  if (!normalized || normalized.length < minSubstantiveChunkLength) return

  chunks.push({
    id: `chunk_${ resourceId }_${ chunks.length + 1 }`,
    resourceId,
    orderIndex: chunks.length,
    content: normalized,
    tokenCount: estimateTokenCount(normalized),
    chapterHint: heading || (level ? `章节 ${ chunks.length + 1 }` : '资料正文')
  })
}

const splitLongResourceChunk = (
  chunks: ResourceChunkDto[],
  resourceId: string,
  heading: string,
  level: number,
  content: string
) => {
  if (content.length <= maxChunkLength) {
    pushResourceChunk(chunks, resourceId, heading, level, content)
    return
  }

  let offset = 0
  let partIndex = 0
  while (offset < content.length) {
    const slice = content.slice(offset, offset + maxChunkLength).trim()
    if (slice.length >= minChunkLength || offset + maxChunkLength >= content.length) {
      pushResourceChunk(
        chunks,
        resourceId,
        partIndex ? `${ heading }（续 ${ partIndex + 1 }）` : heading,
        level,
        slice
      )
      partIndex += 1
    }
    offset += maxChunkLength - 100
  }
}

const splitResourceChunks = (resourceId: string, rawText: string): ResourceChunkDto[] => {
  const normalizedText = normalizeText(rawText)
  if (!normalizedText) return []

  const chunks: ResourceChunkDto[] = []
  const lines = normalizedText.split('\n')
  let currentHeading = '资料正文'
  let currentLevel = 0
  let currentLines: string[] = []

  const flushSection = () => {
    const sectionText = currentLines
      .filter(line => !isSeparatorLine(line))
      .join('\n')
      .trim()
    currentLines = []
    if (!sectionText) return
    splitLongResourceChunk(chunks, resourceId, currentHeading, currentLevel, sectionText)
  }

  for (const line of lines) {
    const headingMatch = line.match(headingPattern)
    if (headingMatch) {
      flushSection()
      currentHeading = headingMatch[2].trim() || currentHeading
      currentLevel = headingMatch[1].length
      continue
    }
    if (!isSeparatorLine(line)) {
      currentLines.push(line)
    }
  }

  flushSection()

  if (!chunks.length) {
    splitLongResourceChunk(chunks, resourceId, '资料正文', 0, normalizedText)
  }

  return chunks
}

const buildMockAnalyzeResult = (
  resourceId: string,
  rawText: string,
  chunks: ResourceChunkDto[]
) => {
  const now = new Date().toISOString()
  const knowledgePoints: KnowledgePointDto[] = chunks.slice(0, 30).map((chunk, index) => {
    const sourceText = `${ chunk.chapterHint }\n${ chunk.content }`
    return {
      id: `kp_${ resourceId }_${ index + 1 }`,
      resourceId,
      name: chunk.chapterHint,
      description: chunk.content.slice(0, 160),
      chapterTitle: chunk.chapterHint,
      difficultyLevel: resolveDifficulty(sourceText, index),
      orderIndex: index
    }
  })

  const seedSource = knowledgePoints.length ? knowledgePoints : [{
    id: `kp_${ resourceId }_1`,
    resourceId,
    name: '资料核心知识点',
    description: rawText.slice(0, 160),
    chapterTitle: chunks[0]?.chapterHint || '资料正文',
    difficultyLevel: 'medium' as const,
    orderIndex: 0
  }]

  const questionSeeds: QuestionSeedDto[] = seedSource.map((knowledgePoint, index) => {
    const sourceChunk = chunks[index] || chunks[0]
    const sourceText = `${ knowledgePoint.name }\n${ sourceChunk?.content || rawText }`
    return {
      id: `seed_${ resourceId }_${ index + 1 }`,
      resourceId,
      knowledgePointId: knowledgePoint.id,
      chapterTitle: knowledgePoint.chapterTitle,
      difficulty: resolveDifficulty(sourceText, index),
      questionType: resolveQuestionType(sourceText),
      promptHint: `围绕「${ knowledgePoint.name }」生成一题结构化面试题，并要求候选人结合资料说明。`,
      sourceChunkIds: sourceChunk ? [sourceChunk.id] : [],
      sequenceOrder: index,
      status: 'ready',
      createdAt: now
    }
  })

  return {
    summary: rawText.replace(/\s+/g, ' ').slice(0, 220),
    knowledgePoints: seedSource,
    questionSeeds
  }
}

const getKnowledgePointBySeed = (record: ResourceQuestionRecord, seed: QuestionSeedDto) => {
  return record.knowledgePoints.find(item => item.id === seed.knowledgePointId)
    || record.knowledgePoints[0]
    || {
      id: `kp_${ record.resourceId }_fallback`,
      resourceId: record.resourceId,
      name: seed.chapterTitle,
      description: seed.promptHint,
      chapterTitle: seed.chapterTitle,
      difficultyLevel: seed.difficulty,
      orderIndex: seed.sequenceOrder
    }
}

const getSourceChunksBySeed = (record: ResourceQuestionRecord, seed: QuestionSeedDto) => {
  const chunkMap = new Map(record.chunks.map(chunk => [chunk.id, chunk]))
  const chunks = seed.sourceChunkIds
    .map(chunkId => chunkMap.get(chunkId))
    .filter((chunk): chunk is ResourceChunkDto => Boolean(chunk))
  return chunks.length ? chunks : record.chunks.slice(0, 1)
}

const buildFallbackGeneratedQuestion = (
  record: ResourceQuestionRecord,
  seed: QuestionSeedDto,
  knowledgePoint: KnowledgePointDto,
  sourceChunks: ResourceChunkDto[],
  cursorMeta?: Pick<GeneratedResourceQuestionDto, 'nextCursor' | 'hasNext'>
): GeneratedResourceQuestionDto => {
  const sourceText = sourceChunks.map(chunk => chunk.content).join('\n\n').slice(0, 700)
  const now = new Date().toISOString()

  return {
    questionId: `rq_${ record.resourceId }_${ seed.id }_${ Date.now() }`,
    resourceId: record.resourceId,
    seedId: seed.id,
    title: `请讲解：${ knowledgePoint.name }`,
    question: [
      seed.promptHint,
      sourceText ? `请结合以下资料依据展开回答：\n${ sourceText }` : '',
      '回答时请说明核心概念、关键细节和面试表达结构。'
    ].filter(Boolean).join('\n\n'),
    answerOutline: [
      `说明「${ knowledgePoint.name }」的核心定义或作用`,
      '结合资料依据拆解关键步骤或机制',
      '补充面试表达中的案例、边界和常见追问'
    ],
    knowledgePoint: knowledgePoint.name,
    difficulty: seed.difficulty,
    questionType: seed.questionType,
    sourceRefs: sourceChunks.map(chunk => chunk.id),
    createdAt: now,
    ...cursorMeta
  }
}

const selectRandomSeed = (
  seeds: QuestionSeedDto[],
  request: GenerateRandomResourceQuestionRequest
) => {
  const excluded = new Set(request.excludeSeedIds || [])
  const candidates = seeds.filter(seed => {
    if (excluded.has(seed.id)) return false
    if (request.difficulty && seed.difficulty !== request.difficulty) return false
    if (request.questionType && seed.questionType !== request.questionType) return false
    return true
  })
  const source = candidates.length ? candidates : seeds.filter(seed => !excluded.has(seed.id))
  const finalCandidates = source.length ? source : seeds
  return finalCandidates[Math.floor(Math.random() * finalCandidates.length)] || null
}

const sortSeedsForSequence = (
  seeds: QuestionSeedDto[],
  sequenceMode: GenerateNextResourceQuestionRequest['sequenceMode']
) => {
  const sorted = [...seeds]
  if (sequenceMode === 'by_difficulty') {
    return sorted.sort((left, right) => (
      difficultyRank[left.difficulty] - difficultyRank[right.difficulty]
      || left.sequenceOrder - right.sequenceOrder
    ))
  }

  if (sequenceMode === 'by_knowledge') {
    return sorted.sort((left, right) => (
      left.knowledgePointId.localeCompare(right.knowledgePointId)
      || left.sequenceOrder - right.sequenceOrder
    ))
  }

  return sorted.sort((left, right) => left.sequenceOrder - right.sequenceOrder)
}

export class ResourceQuestionService {
  async analyzeResource(request: AnalyzeResourceQuestionRequest) {
    const resourceId = String(request.resourceId || '').trim()
    if (!resourceId) {
      throw Object.assign(new Error('resourceId is required.'), { code: 'RESOURCE_ID_REQUIRED' })
    }

    const rawText = normalizeText(request.rawText || '')
    if (!rawText) {
      throw Object.assign(new Error('rawText is required.'), { code: 'RESOURCE_TEXT_REQUIRED' })
    }

    const now = new Date().toISOString()
    const title = String(request.title || resourceId).trim()
    const existingRecord = getStoredResourceQuestionRecord(resourceId)
    if (
      existingRecord?.analyzeStatus === 'ready'
      && existingRecord.documentVersion === request.documentVersion
      && existingRecord.questionSeeds.length > 0
    ) {
      return {
        resourceId,
        summary: existingRecord.summary,
        knowledgePoints: existingRecord.knowledgePoints,
        seedCount: existingRecord.questionSeeds.length
      }
    }

    const chunks = splitResourceChunks(resourceId, rawText)
    if (!chunks.length) {
      throw Object.assign(new Error('当前资料内容过短，无法生成题目种子。'), { code: 'RESOURCE_TEXT_TOO_SHORT' })
    }

    let analyzeResult = buildMockAnalyzeResult(resourceId, rawText, chunks)

    if (isRemoteLlmConfigured(request.modelId)) {
      const messages = buildResourceAnalyzeLlmMessages({
        resourceId,
        title,
        rawText,
        chunks
      })
      try {
        const raw = await completeRemoteLlmJson(messages, {
          modelId: request.modelId
        })
        const llmResult = parseResourceAnalyzeLlmJson(raw, resourceId, chunks)
        if (llmResult.questionSeeds.length) {
          analyzeResult = {
            ...llmResult,
            summary: llmResult.summary || analyzeResult.summary
          }
        }
      }
      catch (error) {
        console.warn('[backend] resource analyze LLM fallback:', error)
      }
    }

    const record: ResourceQuestionRecord = {
      resourceId,
      title,
      rawText,
      summary: analyzeResult.summary,
      documentVersion: request.documentVersion,
      analyzeStatus: 'ready',
      chunks,
      knowledgePoints: analyzeResult.knowledgePoints,
      questionSeeds: analyzeResult.questionSeeds,
      generatedQuestions: [],
      createdAt: now,
      updatedAt: now
    }

    const storedRecord = upsertStoredResourceQuestionRecord(record)
    return {
      resourceId,
      summary: storedRecord.summary,
      knowledgePoints: storedRecord.knowledgePoints,
      seedCount: storedRecord.questionSeeds.length
    }
  }

  getQuestionMeta(resourceId: string) {
    const record = getStoredResourceQuestionRecord(resourceId)
    if (!record) {
      return {
        resourceId,
        seedCount: 0,
        analyzeStatus: 'idle' as const,
        sequenceModes: ['by_chapter', 'by_knowledge', 'by_difficulty'] as const
      }
    }

    return {
      resourceId: record.resourceId,
      seedCount: record.questionSeeds.length,
      analyzeStatus: record.analyzeStatus,
      sequenceModes: ['by_chapter', 'by_knowledge', 'by_difficulty'] as const,
      summary: record.summary,
      errorMessage: record.errorMessage,
      documentVersion: record.documentVersion
    }
  }

  async generateQuestionForSeed(
    record: ResourceQuestionRecord,
    seed: QuestionSeedDto,
    options?: {
      modelId?: string
      fastMode?: boolean
      cursorMeta?: Pick<GeneratedResourceQuestionDto, 'nextCursor' | 'hasNext'>
    }
  ) {
    const knowledgePoint = getKnowledgePointBySeed(record, seed)
    const sourceChunks = getSourceChunksBySeed(record, seed)
    const fallback = buildFallbackGeneratedQuestion(record, seed, knowledgePoint, sourceChunks, options?.cursorMeta)
    let question = fallback

    if (!options?.fastMode && isRemoteLlmConfigured(options?.modelId)) {
      const messages = buildGenerateResourceQuestionLlmMessages({
        title: record.title,
        summary: record.summary,
        seed,
        knowledgePoint,
        sourceChunks
      })
      try {
        const raw = await completeRemoteLlmJson(messages, {
          modelId: options?.modelId
        })
        question = parseGeneratedResourceQuestionJson(raw, fallback)
      }
      catch (error) {
        console.warn('[backend] generate resource question LLM fallback:', error)
      }
    }

    const nextRecord = {
      ...record,
      generatedQuestions: [question, ...record.generatedQuestions].slice(0, 200),
      updatedAt: new Date().toISOString()
    }
    upsertStoredResourceQuestionRecord(nextRecord)
    return question
  }

  async generateRandomQuestion(request: GenerateRandomResourceQuestionRequest) {
    const record = getStoredResourceQuestionRecord(request.resourceId)
    if (!record || record.analyzeStatus !== 'ready') {
      throw Object.assign(new Error('请先分析资料后再出题。'), { code: 'RESOURCE_NOT_ANALYZED' })
    }

    const seed = selectRandomSeed(record.questionSeeds, request)
    if (!seed) {
      throw Object.assign(new Error('当前资料没有可用题目种子。'), { code: 'QUESTION_SEED_EMPTY' })
    }

    return this.generateQuestionForSeed(record, seed, {
      modelId: request.modelId,
      fastMode: request.fastMode
    })
  }

  async generateNextQuestion(request: GenerateNextResourceQuestionRequest) {
    const record = getStoredResourceQuestionRecord(request.resourceId)
    if (!record || record.analyzeStatus !== 'ready') {
      throw Object.assign(new Error('请先分析资料后再出题。'), { code: 'RESOURCE_NOT_ANALYZED' })
    }

    const sequenceMode = request.sequenceMode || 'by_chapter'
    const orderedSeeds = sortSeedsForSequence(record.questionSeeds, sequenceMode)
    if (!orderedSeeds.length) {
      throw Object.assign(new Error('当前资料没有可用题目种子。'), { code: 'QUESTION_SEED_EMPTY' })
    }

    const cursorIndex = Math.max(0, Number(request.cursor || 0) || 0)
    const seedIndex = cursorIndex % orderedSeeds.length
    const seed = orderedSeeds[seedIndex]
    const nextCursor = String(seedIndex + 1)

    return this.generateQuestionForSeed(record, seed, {
      modelId: request.modelId,
      fastMode: request.fastMode,
      cursorMeta: {
        nextCursor,
        hasNext: seedIndex + 1 < orderedSeeds.length
      }
    })
  }
}

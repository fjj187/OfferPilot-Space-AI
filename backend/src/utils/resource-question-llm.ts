import type {
  GeneratedResourceQuestionDto,
  KnowledgePointDto,
  QuestionSeedDto,
  ResourceChunkDto,
  ResourceQuestionDifficulty,
  ResourceQuestionType
} from '../types/resource-question.js'

const extractJsonText = (raw: string) => {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }
  return trimmed
}

const allowedDifficulties = new Set<ResourceQuestionDifficulty>(['easy', 'medium', 'hard'])
const allowedQuestionTypes = new Set<ResourceQuestionType>(['concept', 'code', 'scenario'])

const normalizeDifficulty = (value: unknown): ResourceQuestionDifficulty => {
  const normalized = String(value || 'medium')
  return allowedDifficulties.has(normalized as ResourceQuestionDifficulty)
    ? normalized as ResourceQuestionDifficulty
    : 'medium'
}

const normalizeQuestionType = (value: unknown): ResourceQuestionType => {
  const normalized = String(value || 'concept')
  return allowedQuestionTypes.has(normalized as ResourceQuestionType)
    ? normalized as ResourceQuestionType
    : 'concept'
}

export const buildResourceAnalyzeLlmMessages = (
  payload: {
    resourceId: string
    title: string
    rawText: string
    chunks: ResourceChunkDto[]
  }
) => {
  const chunkDigest = payload.chunks.slice(0, 20).map(chunk => [
    `chunkId: ${ chunk.id }`,
    `章节: ${ chunk.chapterHint }`,
    chunk.content.slice(0, 700)
  ].join('\n')).join('\n\n')

  const system = [
    '你是中文前端面试训练资料分析器。',
    '请从资料中提取知识点和可出题语义种子。',
    '必须只输出 JSON 对象，不要 Markdown 代码块，不要解释。',
    'JSON 结构：',
    '{',
    '  "summary": "资料摘要",',
    '  "knowledgePoints": [',
    '    {',
    '      "name": "知识点名称",',
    '      "description": "知识点说明",',
    '      "chapterTitle": "章节标题",',
    '      "difficultyLevel": "easy|medium|hard"',
    '    }',
    '  ],',
    '  "questionSeeds": [',
    '    {',
    '      "knowledgePointName": "关联知识点名称",',
    '      "chapterTitle": "章节标题",',
    '      "difficulty": "easy|medium|hard",',
    '      "questionType": "concept|code|scenario",',
    '      "promptHint": "出题方向",',
    '      "sourceChunkIds": ["chunk id"]',
    '    }',
    '  ]',
    '}'
  ].join('\n')

  const user = [
    `resourceId: ${ payload.resourceId }`,
    `资料标题：${ payload.title }`,
    '资料切片：',
    chunkDigest,
    '要求：题目种子覆盖核心章节，避免只复述原文；优先生成适合前端面试的题目。'
  ].join('\n\n')

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user }
  ]
}

export const parseResourceAnalyzeLlmJson = (
  raw: string,
  resourceId: string,
  chunks: ResourceChunkDto[]
) => {
  const parsed = JSON.parse(extractJsonText(raw)) as {
    summary?: unknown
    knowledgePoints?: unknown[]
    questionSeeds?: unknown[]
  }
  const now = new Date().toISOString()
  const chunkIdSet = new Set(chunks.map(chunk => chunk.id))
  const knowledgePoints: KnowledgePointDto[] = []

  for (const entry of Array.isArray(parsed.knowledgePoints) ? parsed.knowledgePoints : []) {
    if (!entry || typeof entry !== 'object') continue
    const candidate = entry as Record<string, unknown>
    const name = String(candidate.name || '').trim()
    if (!name) continue

    knowledgePoints.push({
      id: `kp_${ resourceId }_${ knowledgePoints.length + 1 }`,
      resourceId,
      name,
      description: String(candidate.description || name).trim(),
      chapterTitle: String(candidate.chapterTitle || '资料正文').trim(),
      difficultyLevel: normalizeDifficulty(candidate.difficultyLevel),
      orderIndex: knowledgePoints.length
    })
  }

  const fallbackKnowledgePoint = knowledgePoints[0] || {
    id: `kp_${ resourceId }_1`,
    resourceId,
    name: '资料核心知识点',
    description: '围绕资料正文提炼的核心知识点',
    chapterTitle: chunks[0]?.chapterHint || '资料正文',
    difficultyLevel: 'medium' as const,
    orderIndex: 0
  }
  if (!knowledgePoints.length) {
    knowledgePoints.push(fallbackKnowledgePoint)
  }

  const findKnowledgePoint = (name: string, chapterTitle: string) => {
    return knowledgePoints.find(item => item.name === name)
      || knowledgePoints.find(item => item.chapterTitle === chapterTitle)
      || fallbackKnowledgePoint
  }

  const questionSeeds: QuestionSeedDto[] = []
  for (const entry of Array.isArray(parsed.questionSeeds) ? parsed.questionSeeds : []) {
    if (!entry || typeof entry !== 'object') continue
    const candidate = entry as Record<string, unknown>
    const promptHint = String(candidate.promptHint || '').trim()
    if (!promptHint) continue

    const chapterTitle = String(candidate.chapterTitle || '资料正文').trim()
    const knowledgePoint = findKnowledgePoint(String(candidate.knowledgePointName || '').trim(), chapterTitle)
    const sourceChunkIds = Array.isArray(candidate.sourceChunkIds)
      ? candidate.sourceChunkIds.map(item => String(item)).filter(item => chunkIdSet.has(item))
      : []

    questionSeeds.push({
      id: `seed_${ resourceId }_${ questionSeeds.length + 1 }`,
      resourceId,
      knowledgePointId: knowledgePoint.id,
      chapterTitle,
      difficulty: normalizeDifficulty(candidate.difficulty),
      questionType: normalizeQuestionType(candidate.questionType),
      promptHint,
      sourceChunkIds: sourceChunkIds.length ? sourceChunkIds : chunks.slice(0, 1).map(chunk => chunk.id),
      sequenceOrder: questionSeeds.length,
      status: 'ready',
      createdAt: now
    })
  }

  return {
    summary: String(parsed.summary || '').trim(),
    knowledgePoints,
    questionSeeds
  }
}

export const buildGenerateResourceQuestionLlmMessages = (
  payload: {
    title: string
    summary: string
    seed: QuestionSeedDto
    knowledgePoint: KnowledgePointDto
    sourceChunks: ResourceChunkDto[]
  }
) => {
  const sourceText = payload.sourceChunks.map(chunk => [
    `sourceRef: ${ chunk.id }`,
    `章节: ${ chunk.chapterHint }`,
    chunk.content.slice(0, 900)
  ].join('\n')).join('\n\n')

  const system = [
    '你是中文前端面试官，请根据题目种子生成一题正式模拟面试题。',
    '必须只输出 JSON 对象，不要 Markdown 代码块，不要解释。',
    'JSON 结构：',
    '{',
    '  "title": "题目标题",',
    '  "question": "完整题干",',
    '  "answerOutline": ["答案要点1", "答案要点2"],',
    '  "knowledgePoint": "对应知识点",',
    '  "difficulty": "easy|medium|hard",',
    '  "questionType": "concept|code|scenario",',
    '  "sourceRefs": ["chunk id"]',
    '}'
  ].join('\n')

  const user = [
    `资料标题：${ payload.title }`,
    payload.summary ? `资料摘要：${ payload.summary }` : '',
    `章节：${ payload.seed.chapterTitle }`,
    `知识点：${ payload.knowledgePoint.name }`,
    `难度：${ payload.seed.difficulty }`,
    `题型：${ payload.seed.questionType }`,
    `出题方向：${ payload.seed.promptHint }`,
    '资料依据：',
    sourceText,
    '要求：题面要能直接用于模拟面试；答案要点用中文短句；不得编造资料外的专有结论。'
  ].filter(Boolean).join('\n\n')

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user }
  ]
}

export const parseGeneratedResourceQuestionJson = (
  raw: string,
  fallback: GeneratedResourceQuestionDto
) => {
  const parsed = JSON.parse(extractJsonText(raw)) as Record<string, unknown>
  const answerOutline = Array.isArray(parsed.answerOutline)
    ? parsed.answerOutline.map(item => String(item).trim()).filter(Boolean)
    : []
  const sourceRefs = Array.isArray(parsed.sourceRefs)
    ? parsed.sourceRefs.map(item => String(item).trim()).filter(Boolean)
    : []

  return {
    ...fallback,
    title: String(parsed.title || fallback.title).trim(),
    question: String(parsed.question || fallback.question).trim(),
    answerOutline: answerOutline.length ? answerOutline : fallback.answerOutline,
    knowledgePoint: String(parsed.knowledgePoint || fallback.knowledgePoint).trim(),
    difficulty: normalizeDifficulty(parsed.difficulty),
    questionType: normalizeQuestionType(parsed.questionType),
    sourceRefs: sourceRefs.length ? sourceRefs : fallback.sourceRefs
  }
}

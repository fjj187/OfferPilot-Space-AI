import type {
  PracticePoolDifficulty,
  PracticePoolFocusArea,
  PracticePoolQuestionType,
  PracticeQuestionItemDto
} from '../types/practice-pool.js'

const allowedDifficulties = new Set<PracticePoolDifficulty>(['easy', 'medium', 'hard'])
const allowedTypes = new Set<PracticePoolQuestionType>(['concept', 'code', 'scenario'])
const allowedFocusAreas = new Set<PracticePoolFocusArea>([
  'structure',
  'case_detail',
  'result_metric',
  'principle_depth'
])

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

const normalizeQuestion = (
  entry: Record<string, unknown>,
  sessionId: string,
  order: number
): PracticeQuestionItemDto | null => {
  const title = String(entry.title || '').trim()
  const prompt = String(entry.prompt || '').trim()
  if (!title || !prompt) return null

  const difficulty = String(entry.difficulty || 'medium') as PracticePoolDifficulty
  const questionType = String(entry.questionType || 'concept') as PracticePoolQuestionType
  const focusAreasRaw = Array.isArray(entry.focusAreas) ? entry.focusAreas : []
  const focusAreas = focusAreasRaw
    .map(item => String(item))
    .filter((item): item is PracticePoolFocusArea => allowedFocusAreas.has(item as PracticePoolFocusArea))

  return {
    id: `practice-pool-${ sessionId }-${ order + 1 }`,
    sessionId,
    order,
    title,
    prompt,
    difficulty: allowedDifficulties.has(difficulty) ? difficulty : 'medium',
    questionType: allowedTypes.has(questionType) ? questionType : 'concept',
    generatedBy: 'llm',
    focusAreas: focusAreas.length ? focusAreas : undefined,
    referenceAnswer: String(entry.referenceAnswer || '').trim() || undefined,
    weaknessTag: String(entry.weaknessTag || '').trim() || undefined,
    sourceQuestionId: String(entry.sourceQuestionId || '').trim() || undefined
  }
}

export const parsePracticePoolLlmJson = (
  raw: string,
  sessionId: string,
  maxCount: number
): PracticeQuestionItemDto[] => {
  const parsed = JSON.parse(extractJsonText(raw)) as { questions?: unknown[] }
  const list = Array.isArray(parsed.questions) ? parsed.questions : []
  const questions: PracticeQuestionItemDto[] = []

  for (const entry of list) {
    if (questions.length >= maxCount) break
    if (!entry || typeof entry !== 'object') continue
    const normalized = normalizeQuestion(entry as Record<string, unknown>, sessionId, questions.length)
    if (normalized) questions.push(normalized)
  }

  return questions
}

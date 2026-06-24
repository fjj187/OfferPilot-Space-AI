import type { StoredInterviewReportSummary } from '../types/report.js'

const allowedDifficulties = new Set(['easy', 'medium', 'hard'])
const allowedTypes = new Set(['concept', 'code', 'scenario'])
const allowedZones = new Set(['vue', 'javascript', 'typescript', 'engineering', 'performance'])
const allowedFocusAreas = new Set(['structure', 'case_detail', 'result_metric', 'principle_depth'])

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

const normalizeStringList = (
  value: unknown,
  options?: {
    maxCount?: number
    allowedSet?: Set<string>
  }
) => {
  const maxCount = options?.maxCount || 4
  const allowedSet = options?.allowedSet

  if (!Array.isArray(value)) return []

  const normalized = value
    .map(item => String(item || '').trim())
    .filter(Boolean)
    .filter(item => !allowedSet || allowedSet.has(item))

  return [...new Set(normalized)].slice(0, maxCount)
}

export const parseReportLlmJson = (
  raw: string,
  fallback: Pick<
    StoredInterviewReportSummary,
    | 'summaryHeadline'
    | 'summaryBody'
    | 'primaryWeakness'
    | 'weaknessTags'
    | 'weaknessFocusAreas'
    | 'suggestedFocus'
    | 'practicePlan'
  >
) => {
  const parsed = JSON.parse(extractJsonText(raw)) as Record<string, unknown>

  const summaryHeadline = String(parsed.summaryHeadline || '').trim() || fallback.summaryHeadline
  const summaryBody = String(parsed.summaryBody || '').trim() || fallback.summaryBody
  const primaryWeakness = String(parsed.primaryWeakness || '').trim() || fallback.primaryWeakness || ''

  const weaknessTags = normalizeStringList(parsed.weaknessTags, { maxCount: 4 })
  const weaknessFocusAreas = normalizeStringList(parsed.weaknessFocusAreas, {
    maxCount: 3,
    allowedSet: allowedFocusAreas
  })
  const suggestedFocus = normalizeStringList(parsed.suggestedFocus, { maxCount: 4 })

  const practicePlanRaw = (
    parsed.practicePlan && typeof parsed.practicePlan === 'object'
      ? parsed.practicePlan as Record<string, unknown>
      : null
  )

  const practicePlan = practicePlanRaw
    ? {
        weaknessTag: String(practicePlanRaw.weaknessTag || '').trim()
          || primaryWeakness
          || fallback.practicePlan?.weaknessTag
          || fallback.primaryWeakness
          || '当前弱项',
        questionType: allowedTypes.has(String(practicePlanRaw.questionType || ''))
          ? String(practicePlanRaw.questionType)
          : (fallback.practicePlan?.questionType || 'concept'),
        difficulty: allowedDifficulties.has(String(practicePlanRaw.difficulty || ''))
          ? String(practicePlanRaw.difficulty)
          : (fallback.practicePlan?.difficulty || 'medium'),
        zone: allowedZones.has(String(practicePlanRaw.zone || ''))
          ? String(practicePlanRaw.zone)
          : (fallback.practicePlan?.zone || 'vue')
      }
    : fallback.practicePlan

  return {
    summaryHeadline,
    summaryBody,
    primaryWeakness: primaryWeakness || fallback.primaryWeakness,
    weaknessTags: weaknessTags.length ? weaknessTags : fallback.weaknessTags,
    weaknessFocusAreas: weaknessFocusAreas.length ? weaknessFocusAreas : (fallback.weaknessFocusAreas || []),
    suggestedFocus: suggestedFocus.length ? suggestedFocus : (fallback.suggestedFocus || []),
    practicePlan
  }
}

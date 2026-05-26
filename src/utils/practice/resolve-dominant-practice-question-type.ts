import type { PersistedPracticeQuestionType } from '@/types/workbench'

/** 按本轮实际题型频次取众数；无数据时回退 */
export function resolveDominantPracticeQuestionType(
  types: Array<PersistedPracticeQuestionType | undefined>,
  fallback: PersistedPracticeQuestionType = 'concept'
): PersistedPracticeQuestionType {
  const counts = new Map<PersistedPracticeQuestionType, number>()

  for (const type of types) {
    if (!type) continue
    counts.set(type, (counts.get(type) || 0) + 1)
  }

  if (!counts.size) return fallback

  let winner = fallback
  let maxCount = 0

  for (const [type, count] of counts) {
    if (count > maxCount) {
      maxCount = count
      winner = type
    }
  }

  return winner
}

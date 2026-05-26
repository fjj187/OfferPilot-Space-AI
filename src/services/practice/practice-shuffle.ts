import type { PracticeQuestionItem } from '@/types/practice-pool'

/** 用 shuffleSeed（洗牌种子）做可复现的 Fisher-Yates 洗牌 */
export const shufflePracticeQuestionsWithSeed = (questions: PracticeQuestionItem[], seed: number) => {
  const copy = [...questions]
  let state = (seed || 1) >>> 0

  const nextUnit = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextUnit() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swapIndex]
    copy[swapIndex] = current
  }
  return copy
}

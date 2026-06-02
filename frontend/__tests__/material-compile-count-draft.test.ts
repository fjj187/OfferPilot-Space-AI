import { describe, expect, it } from 'vitest'

/** 与 SpaceLibraryScene 中 clampMaterialCompileCount 规则一致 */
const clampMaterialCompileCount = (
  raw: string | number,
  maxLimit: number | null
) => {
  const materialCountMin = 1
  const parsed = typeof raw === 'number'
    ? raw
    : Number.parseInt(String(raw).trim(), 10)
  let next = Number.isFinite(parsed) ? parsed : materialCountMin
  next = Math.max(materialCountMin, next)
  if (maxLimit !== null) {
    next = Math.min(maxLimit, next)
  }
  return next
}

describe('material compile count draft', () => {
  it('失焦规范化：5 在 93 题池内保持 5，不会回到 93', () => {
    expect(clampMaterialCompileCount('5', 93)).toBe(5)
  })

  it('空输入回退到最小题数 1', () => {
    expect(clampMaterialCompileCount('', 93)).toBe(1)
  })

  it('超过上限时压到上限', () => {
    expect(clampMaterialCompileCount('200', 93)).toBe(93)
  })
})

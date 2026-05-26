import type { MaterialChunk } from '@/types/material'
import type { PersistedPracticeDifficulty, PersistedPracticeQuestionType } from '@/types/workbench'

export const MATERIAL_BASIS_MARKER = '【本题资料依据】'

export const normalizeQuestionHeading = (heading: string) => {
  return heading
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\d+\.\s*/, '')
    .trim()
}

/** 题面型标题：带问号或常见问句词 */
export const isQuestionLikeHeading = (heading: string) => {
  const normalized = normalizeQuestionHeading(heading)
  if (!normalized || normalized === '资料正文' || /^段落\s+\d+/.test(normalized)) return false
  if (/[？?]$/.test(normalized)) return true
  return /^(什么是|什么叫|如何|怎么|怎样|为什么|为何|有哪些|包括哪些|区别|对比|差异|谈谈|说说|解释|简述|描述|列举)/.test(normalized)
}

/** 二级及以上标题且像面试题：正文通常是参考答案要点 */
export const isInterviewQuestionChunk = (chunk: MaterialChunk) => {
  const heading = normalizeQuestionHeading(chunk.heading)
  if (!isQuestionLikeHeading(heading)) return false
  return chunk.level >= 2 || /[？?]/.test(heading)
}

/** 从 chunk 正文提取可进报告的参考答案摘要 */
export const extractMaterialReferenceAnswer = (text: string, maxLength = 480) => {
  const normalized = text.replace(/-{3,}/g, '').replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  if (normalized.length <= maxLength) return normalized
  return `${ normalized.slice(0, maxLength) }...`
}

/** 判断 chunk 正文是否更像「答案要点」而非「出题说明」 */
export const looksLikeAnswerBody = (text: string) => {
  const trimmed = text.replace(/-{3,}/g, '').trim()
  if (!trimmed) return false
  if (/^[-*•]|\n[-*•]|\n\d+\./m.test(trimmed)) return true
  if (trimmed.length >= 48 && /\n/.test(trimmed)) return true
  return false
}

/** 入库 prompt 与展示题面保持一致，避免模板前缀泄漏到 UI */
export const buildHeadingQuestionPrompt = (heading: string) => heading

export const formatMaterialReference = (heading: string, text: string) => {
  const excerpt = text
    .replace(/-{3,}/g, '')
    .slice(0, 400)
    .replace(/\s+/g, ' ')
    .trim()
  if (!excerpt) return `${ MATERIAL_BASIS_MARKER }${ heading }`
  return `${ MATERIAL_BASIS_MARKER }${ heading }：${ excerpt }`
}

export const splitMaterialPrompt = (prompt: string) => {
  const index = prompt.indexOf(MATERIAL_BASIS_MARKER)
  if (index < 0) {
    return {
      instruction: prompt.trim(),
      reference: ''
    }
  }
  return {
    instruction: prompt.slice(0, index).trim(),
    reference: prompt.slice(index).trim()
  }
}

const stripInstructionalPrefix = (text: string) => {
  let source = text.trim()
  source = source.replace(/^请结合[^：:\n]*[：:]\s*(?:以下问题[：:]\s*)?/u, '').trim()
  source = source.replace(/^请根据[^：:\n]*[：:]\s*/u, '').trim()
  source = source.replace(/^请讲解[：:]\s*/u, '').trim()
  source = source.replace(/^概念理解[：:]\s*/u, '').trim()
  return source
}

/** 从 prompt / 标题提取纯题面，去掉「请结合资料…」等模板前缀 */
export const resolveQuestionDisplayText = (prompt: string, title: string) => {
  const { instruction } = splitMaterialPrompt(prompt)
  let source = instruction.trim()
  if (!source) {
    source = title.replace(/^第\s+\d+\s*\/\s*\d+\s*题\s*·\s*/, '').trim()
  }

  source = stripInstructionalPrefix(source)
  const firstLine = source.split('\n').find(line => line.trim())?.trim() || source
  if (/[？?]$/.test(firstLine)) return firstLine

  const colonIdx = Math.max(firstLine.lastIndexOf('：'), firstLine.lastIndexOf(':'))
  if (colonIdx >= 0 && colonIdx < firstLine.length - 1) {
    const before = firstLine.slice(0, colonIdx)
    const after = firstLine.slice(colonIdx + 1).trim()
    if (/请|结合|资料|讲解|以下|回答|理解|概念/.test(before) && after) return after
  }

  return firstLine || source
}

export const resolveThreadDisplayPrompt = (thread: { title: string, prompt: string }) => {
  return resolveQuestionDisplayText(thread.prompt, thread.title)
}

/** 资料题组：只给作答结构提示，不泄露题目复述或参考答案 */
export const buildMaterialAnswerHint = (options: {
  title?: string
  questionType?: PersistedPracticeQuestionType
  difficulty?: PersistedPracticeDifficulty
}) => {
  const title = options.title || ''

  if (options.questionType === 'code') {
    return '先说这段代码解决什么问题，再讲关键逻辑，最后补一句可改进点。'
  }
  if (options.questionType === 'scenario') {
    return '建议按「背景 → 你的做法 → 结果/反思」三段作答，控制在一分钟左右。'
  }
  if (/区别|差异|对比|不同/.test(title)) {
    return '建议用对比方式作答：先列相同点，再分点说差异，最后一句总结适用场景。'
  }
  if (/为什么|为何|作用|意义|好处/.test(title)) {
    return '建议先一句话点明结论，再从原理或场景出发分点展开，避免只堆名词。'
  }
  if (/有哪些|包括|列举/.test(title)) {
    return '建议先总述类别或数量，再分条说明，每条用一句话带过即可。'
  }
  if (/如何|怎么|怎样/.test(title)) {
    return '建议按步骤或层次展开，先讲思路，再讲关键细节，必要时举一个简短例子。'
  }
  if (options.difficulty === 'hard') {
    return '这题偏深，建议从原理层入手，再联系到实际项目中的取舍。'
  }
  return '建议先给结论，再分点展开，最后简短收束。'
}

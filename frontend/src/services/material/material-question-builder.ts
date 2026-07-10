import type {
  MaterialChunk,
  MaterialQuestionItem,
  MaterialQuestionPool
} from '@/types/material'
import type { PersistedLibraryDocument } from '@/types/workbench'
import { resolveMaterialDocumentVersion } from '@/services/material/material-document-version'
import { splitMaterialChunks } from '@/services/material/material-chunk-splitter'
import { prepareMaterialRawText } from '@/services/material/normalize-interview-notes-markdown'
import { inferMaterialQuestionTopicKeys } from '@/services/material/material-question-topics'
import {
  buildHeadingQuestionPrompt,
  extractMaterialReferenceAnswer,
  formatMaterialReference,
  isContinuationChunkHeading,
  isInterviewQuestionChunk,
  isQuestionLikeHeading,
  looksLikeAnswerBody,
  normalizeQuestionHeading
} from '@/services/material/material-prompt'

const codeFencePattern = /```[\s\S]*?```/
const minExplainSectionLength = 48
const minGenericQuestionBodyLength = 36

const extractGenericQuestionTitle = (text: string) => {
  const normalized = text
    .replace(/\s+/g, ' ')
    .trim()
  if (!normalized) return '请结合资料内容进行讲解'

  const firstSentence = normalized
    .split(/(?<=[。！？；.!?])/)
    .map(item => item.trim())
    .find(Boolean) || normalized

  const cleanSentence = firstSentence.replace(/^[\d.、\s]+/, '').trim()
  if (cleanSentence.length <= 28) return cleanSentence
  return `${ cleanSentence.slice(0, 28) }...`
}

const resolveQuestionType = (chunk: MaterialChunk): MaterialQuestionItem['questionType'] => {
  if (codeFencePattern.test(chunk.text)) return 'code'
  if (/场景|项目|案例|沟通/.test(`${ chunk.heading } ${ chunk.text }`)) return 'scenario'
  return 'concept'
}

const resolveDifficulty = (chunk: MaterialChunk): MaterialQuestionItem['difficulty'] => {
  if (/为什么|原理|源码|底层|机制/.test(`${ chunk.heading } ${ chunk.text }`)) return 'hard'
  if (chunk.level <= 2 && chunk.heading && chunk.heading !== '资料正文') return 'medium'
  if (codeFencePattern.test(chunk.text)) return 'medium'
  return 'easy'
}

const buildQuestionBase = (
  chunk: MaterialChunk,
  suffix: string,
  order: number,
  title: string,
  prompt: string
): MaterialQuestionItem => {
  const questionType = resolveQuestionType(chunk)
  const difficulty = resolveDifficulty(chunk)
  const focusAreas = difficulty === 'hard'
    ? (['principle_depth'] as const)
    : questionType === 'scenario'
      ? (['case_detail'] as const)
      : (['structure'] as const)
  const substantiveText = chunk.text.replace(/-{3,}/g, '').trim()
  const referenceAnswer = substantiveText
    ? extractMaterialReferenceAnswer(substantiveText)
    : undefined

  return {
    id: `material-q-${ chunk.documentId }-${ chunk.id }-${ suffix }`,
    documentId: chunk.documentId,
    chunkId: chunk.id,
    order,
    title,
    prompt,
    difficulty,
    questionType,
    generatedBy: 'rule',
    focusAreas: [...focusAreas],
    sourceHeading: normalizeQuestionHeading(chunk.heading),
    referenceAnswer,
    topicKeys: inferMaterialQuestionTopicKeys({
      title,
      prompt,
      sourceHeading: normalizeQuestionHeading(chunk.heading)
    })
  }
}

const buildQuestionsForChunk = (chunk: MaterialChunk): MaterialQuestionItem[] => {
  const questions: MaterialQuestionItem[] = []
  const normalizedHeading = normalizeQuestionHeading(chunk.heading)
  const substantiveText = chunk.text.replace(/-{3,}/g, '').trim()
  const isContinuation = isContinuationChunkHeading(chunk.heading)
  const hasMeaningfulHeading = Boolean(
    normalizedHeading
    && normalizedHeading !== '资料正文'
    && !/^段落\s+\d+/.test(normalizedHeading)
    && !isContinuation
  )

  if (!isContinuation && isInterviewQuestionChunk(chunk)) {
    questions.push(buildQuestionBase(
      chunk,
      'heading',
      0,
      normalizedHeading,
      buildHeadingQuestionPrompt(normalizedHeading)
    ))
  } else if (
    hasMeaningfulHeading
    && chunk.level <= 2
    && substantiveText.length >= minExplainSectionLength
    && !looksLikeAnswerBody(substantiveText)
  ) {
    questions.push(buildQuestionBase(
      chunk,
      'explain',
      0,
      `请讲解：${ normalizedHeading }`,
      `请结合资料章节「${ normalizedHeading }」讲解核心概念，并说明你会如何在面试中结构化表达。`
    ))
  } else if (hasMeaningfulHeading && isQuestionLikeHeading(normalizedHeading)) {
    questions.push(buildQuestionBase(
      chunk,
      'heading-fallback',
      0,
      normalizedHeading,
      buildHeadingQuestionPrompt(normalizedHeading)
    ))
  }

  const codeMatch = chunk.text.match(codeFencePattern)
  if (codeMatch && questions.length < 2) {
    const codeQuestion = buildQuestionBase(
      chunk,
      'code',
      questions.length,
      `阅读并解释：${ chunk.heading }中的代码片段`,
      `请阅读以下代码片段，说明其作用、关键设计点，以及可能的改进方向。\n\n${ codeMatch[0] }`
    )
    codeQuestion.difficulty = codeQuestion.difficulty === 'easy' ? 'medium' : codeQuestion.difficulty
    codeQuestion.questionType = 'code'
    codeQuestion.focusAreas = ['principle_depth']
    questions.push(codeQuestion)
  }

  if (!questions.length && hasMeaningfulHeading && !isContinuation) {
    const prompt = substantiveText.length >= 24 && substantiveText.length < 160 && !looksLikeAnswerBody(substantiveText)
      ? `请根据资料内容回答本题，并尽量结合章节要点展开。\n\n${ formatMaterialReference(normalizedHeading, substantiveText) }`
      : `请根据资料内容回答：${ normalizedHeading }`
    questions.push(buildQuestionBase(
      chunk,
      'concept',
      0,
      isQuestionLikeHeading(normalizedHeading)
        ? normalizedHeading
        : `概念理解：${ normalizedHeading }`,
      prompt
    ))
  }

  // Some imported Docs paragraphs are long and substantive, but may not carry a usable heading.
  if (!questions.length && substantiveText.length >= minGenericQuestionBodyLength) {
    const fallbackTitle = extractGenericQuestionTitle(substantiveText)
    questions.push(buildQuestionBase(
      chunk,
      'body-fallback',
      0,
      fallbackTitle,
      `请根据资料内容进行结构化讲解，并概括核心要点。\n\n${ formatMaterialReference(normalizedHeading, substantiveText) }`
    ))
  }

  return questions.slice(0, 2)
}

export function buildMaterialQuestionPool(document: PersistedLibraryDocument): MaterialQuestionPool {
  const chunks = splitMaterialChunks(prepareMaterialRawText(document.rawText || ''), document.id)
  const questions = chunks.flatMap(chunk => buildQuestionsForChunk(chunk))

  return {
    documentId: document.id,
    documentVersion: resolveMaterialDocumentVersion(document),
    chunks,
    questions,
    preparedAt: new Date().toISOString(),
    status: questions.length ? 'ready' : 'error',
    errorMessage: questions.length ? undefined : '当前资料内容过短，暂无法生成练习题'
  }
}

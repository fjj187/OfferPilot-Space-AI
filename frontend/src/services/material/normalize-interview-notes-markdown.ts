/** 面经 docx（Word 文档）经 mammoth 转 Markdown 后的场次行，如「12.10 一面」 */
const SESSION_SECTION_PATTERN = /^\d{1,2}\.\d{1,2}\s+(?:一面|二面|三面|四面|HR)/i

/** mammoth 常把 `.` 等转义，加粗用 __ 包裹 */
export const cleanMammothArtifact = (text: string): string => {
  return text
    .replace(/\\([.#*_+\-=\[\](){}\\|])/g, '$1')
    .replace(/__/g, '')
    .trim()
}

const stripMarkdownHeading = (text: string) => text.replace(/^#{1,6}\s+/, '').trim()

export const isSessionSectionLine = (text: string) => SESSION_SECTION_PATTERN.test(text)

export const isInterviewNotesAnswerLine = (cleanedLine: string) => {
  const body = stripMarkdownHeading(cleanedLine)
  return /^答[：:]/.test(body)
}

/** 编号题面（1. xxx），排除日期场次 12.10 一面 */
export const isInterviewNotesQuestionLine = (cleanedLine: string) => {
  const body = stripMarkdownHeading(cleanedLine)
  if (!body || isInterviewNotesAnswerLine(cleanedLine) || isSessionSectionLine(body)) return false
  if (/^答[：:]/.test(body)) return false
  return /^\d+\.\s+\S/.test(body)
}

const extractAnswerLead = (cleanedLine: string) => {
  const body = stripMarkdownHeading(cleanedLine)
  return body.replace(/^答[：:]\s*/, '').trim()
}

const extractQuestionTitle = (cleanedLine: string) => stripMarkdownHeading(cleanedLine)

/**
 * 识别牛客/面经类 docx：大量「编号题面 + ## 答：」结构，而非 ### 题面？ 型 md。
 */
export function isInterviewNotesMarkdown(markdown: string): boolean {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  let answerLines = 0
  let numberedQuestions = 0

  for (const line of lines) {
    const cleaned = cleanMammothArtifact(line)
    if (!cleaned) continue
    if (isInterviewNotesAnswerLine(cleaned)) answerLines += 1
    else if (isInterviewNotesQuestionLine(cleaned)) numberedQuestions += 1
  }

  return (answerLines >= 2 && numberedQuestions >= 2) || numberedQuestions >= 3
}

/**
 * 将面经 Q/A 体归一化为「### 题面 + 正文参考答案」，供 material-chunk-splitter 按 ### 切题。
 */
export function normalizeInterviewNotesMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const output: string[] = []
  let currentSession = ''
  let currentQuestion = ''
  let answerLines: string[] = []

  const flushQuestion = () => {
    if (!currentQuestion) return

    if (currentSession) {
      output.push(currentSession)
      currentSession = ''
    }

    output.push(`### ${currentQuestion}`)
    const answer = answerLines.join('\n').trim()
    if (answer) output.push(answer)
    output.push('')

    currentQuestion = ''
    answerLines = []
  }

  for (const line of lines) {
    const cleaned = cleanMammothArtifact(line)
    if (!cleaned) {
      if (currentQuestion && answerLines.length) answerLines.push('')
      continue
    }

    if (isSessionSectionLine(stripMarkdownHeading(cleaned))) {
      flushQuestion()
      currentSession = `## ${stripMarkdownHeading(cleaned)}`
      continue
    }

    if (isInterviewNotesAnswerLine(cleaned)) {
      const lead = extractAnswerLead(cleaned)
      if (lead) answerLines.push(lead)
      continue
    }

    if (isInterviewNotesQuestionLine(cleaned)) {
      flushQuestion()
      currentQuestion = extractQuestionTitle(cleaned)
      continue
    }

    if (currentQuestion) {
      answerLines.push(cleaned)
    }
  }

  flushQuestion()

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/** docx / 面经 md 入库与出题前统一入口 */
export function prepareMaterialRawText(rawText: string): string {
  const trimmed = rawText.replace(/\r\n/g, '\n').trim()
  if (!trimmed) return trimmed
  if (isInterviewNotesMarkdown(trimmed)) {
    return normalizeInterviewNotesMarkdown(trimmed)
  }
  return trimmed
}

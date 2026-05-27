const DEFAULT_HINT_MAX_LINES = 5
const MAX_HINT_LINE_LENGTH = 88

/** 从本轮 AI 反馈正文提取侧栏要点摘要（不二次调模型） */
export const extractInterviewFeedbackHint = (
  content: string,
  maxLines = DEFAULT_HINT_MAX_LINES
) => {
  const source = content.trim()
  if (!source) return ''

  const lines = collectFeedbackHintLines(source)
  if (!lines.length) return ''

  const clipped = lines.slice(0, maxLines)
  const body = clipped.join('\n')
  return lines.length > maxLines ? `${ body }\n...` : body
}

const collectFeedbackHintLines = (source: string) => {
  const lines: string[] = []
  const seen = new Set<string>()

  const pushLine = (line: string) => {
    const normalized = sanitizeHintLine(line)
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    lines.push(normalized)
  }

  for (const rawLine of source.split('\n')) {
    const trimmed = rawLine.replace(/^#+\s*/, '').trim()
    if (/^❌|^✅/.test(trimmed)) {
      pushLine(trimmed)
    }
  }

  const numberedStructure = source.match(
    /(?:✅\s*)?(?:\*\*)?正确结构[^*\n]*(?:\*\*)?[：:]\s*\n?([\s\S]*?)(?=\n(?:请补充|❌|#{2,3}\s|——|$))/u
  )
  if (numberedStructure?.[1]) {
    for (const rawLine of numberedStructure[1].split('\n')) {
      const trimmed = rawLine.trim()
      if (/^\d+\.\s+/.test(trimmed)) {
        pushLine(trimmed)
      }
    }
  }

  const actionLine = [...source.split('\n')]
    .map(line => line.replace(/^#+\s*/, '').trim())
    .find(line => /^(请重新回答|请补充|请按|请直接|若本题|请先)/.test(line))
  if (actionLine && !/^请补充完整/.test(actionLine)) {
    pushLine(actionLine)
  }

  if (lines.length < 2) {
    extractSectionHintLines(source).forEach(pushLine)
  }

  if (lines.length < 2) {
    for (const rawLine of source.split('\n')) {
      const trimmed = rawLine.replace(/^#+\s*/, '').trim()
      if (/^[-*•]\s+/.test(trimmed)) {
        pushLine(trimmed)
      }
    }
  }

  return lines
}

const extractSectionHintLines = (source: string) => {
  const candidates: string[] = []

  const correctStructure = source.match(
    /(?:✅\s*)?(?:\*\*)?正确结构[^*\n]*(?:\*\*)?[：:]\s*([\s\S]*?)(?=\n(?:请补充|❌|#{2,3}\s|——|$))/u
  )
  if (correctStructure?.[1]?.trim()) {
    candidates.push(correctStructure[1])
  }

  const sectionHeaders = ['修正建议', '引导反馈', '下一步引导', '继续追问', '纠偏反馈'] as const
  for (const header of sectionHeaders) {
    const section = source.match(
      new RegExp(`#{2,4}\\s*${ header }\\s*\\n+([\\s\\S]*?)(?=\\n#{2,4}\\s|$)`, 'u')
    )
    if (section?.[1]?.trim()) {
      candidates.push(section[1])
      break
    }
  }

  const normalized = normalizeHintText(candidates.find(item => item.trim()) || '')
  if (!normalized) return []

  return normalized
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

/** 从上一轮 AI 反馈里摘出当前应回答的追问/重答要求 */
export const extractLatestInterviewerPrompt = (content: string) => {
  const source = content.trim()
  if (!source) return ''

  const explicitLine = [...source.split('\n')]
    .map(line => line.replace(/^#+\s*/, '').trim())
    .reverse()
    .find(line => /^(请重新回答|请补充|请基于|如果我继续|继续追问|下一轮)/.test(line))

  if (explicitLine) {
    return explicitLine
      .replace(/^请重新回答[：:]\s*/u, '')
      .replace(/^请补充[^：:]*[：:]\s*/u, '')
      .trim()
  }

  const followUpSection = source.match(/#{2,4}\s*继续追问\s*\n+([^\n#]+)/u)
  if (followUpSection?.[1]?.trim()) {
    return followUpSection[1].trim()
  }

  return ''
}

const sanitizeHintLine = (line: string) => {
  const normalized = line
    .replace(/\*\*/g, '')
    .replace(/^[-*•]\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) return ''
  if (normalized.length <= MAX_HINT_LINE_LENGTH) return normalized
  return `${ normalized.slice(0, MAX_HINT_LINE_LENGTH) }...`
}

const normalizeHintText = (text: string) => {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

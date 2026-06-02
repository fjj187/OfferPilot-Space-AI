import mammoth from 'mammoth'
import { prepareMaterialRawText } from '@/services/material/normalize-interview-notes-markdown'

/** Word 内置 / 中文界面标题样式 → Markdown 标题，供 material-chunk-splitter 按 # 切节 */
const DOCX_HEADING_STYLE_MAP = [
  'p[style-name=\'Heading 1\'] => h1:fresh',
  'p[style-name=\'Heading 2\'] => h2:fresh',
  'p[style-name=\'Heading 3\'] => h3:fresh',
  'p[style-name=\'Heading 4\'] => h4:fresh',
  'p[style-name=\'标题 1\'] => h1:fresh',
  'p[style-name=\'标题 2\'] => h2:fresh',
  'p[style-name=\'标题 3\'] => h3:fresh',
  'p[style-name=\'标题 4\'] => h4:fresh'
]

export interface DocxParseResult {
  rawText: string
  warnings: string[]
}

export const normalizeDocxMarkdown = (markdown: string) => {
  return markdown
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export const parseDocxArrayBuffer = async (arrayBuffer: ArrayBuffer): Promise<DocxParseResult> => {
  const result = await mammoth.convertToMarkdown(
    { arrayBuffer },
    { styleMap: DOCX_HEADING_STYLE_MAP }
  )

  return {
    rawText: prepareMaterialRawText(normalizeDocxMarkdown(result.value)),
    warnings: result.messages.map(message => message.message)
  }
}

export const parseDocxFile = async (file: File): Promise<DocxParseResult> => {
  return parseDocxArrayBuffer(await file.arrayBuffer())
}

export const resolveMaterialDocumentVersion = (document: {
  importedAt: string
  rawText: string
}) => {
  let hash = 0
  for (let index = 0; index < document.rawText.length; index += 1) {
    hash = ((hash << 5) - hash) + document.rawText.charCodeAt(index)
    hash |= 0
  }
  return `${ document.importedAt }:${ document.rawText.length }:${ hash }`
}

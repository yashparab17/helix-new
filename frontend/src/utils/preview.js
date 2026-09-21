const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|bmp)$/i
const PDF_EXTENSION = /\.pdf$/i
const TEXT_EXTENSIONS = /\.(txt|md|markdown|json|csv|log|ya?ml)$/i

/** Classifies a filename for inline preview: 'image' | 'pdf' | 'text' | null. */
export function getPreviewKind(filename) {
  if (IMAGE_EXTENSIONS.test(filename)) return 'image'
  if (PDF_EXTENSION.test(filename)) return 'pdf'
  if (TEXT_EXTENSIONS.test(filename)) return 'text'
  return null
}

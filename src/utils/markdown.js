import { marked } from 'marked'
import createDOMPurify from 'dompurify'

const domPurify = typeof window !== 'undefined' ? createDOMPurify(window) : null

export function renderSafeMarkdown(markdown) {
  if (!markdown) {
    return ''
  }

  const renderedHtml = marked.parse(String(markdown), {
    breaks: true,
    gfm: true,
  })

  if (!domPurify) {
    return renderedHtml
  }

  return domPurify.sanitize(renderedHtml, {
    USE_PROFILES: { html: true },
  })
}
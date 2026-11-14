import { useMemo } from 'react'

interface BlogContentProps {
  /**
   * The HTML string authorized for the current viewer.
   * For locked paid posts, this contains ONLY the preview excerpt.
   */
  html: string
  isLocked: boolean
}

const ALLOWED_TAGS = new Set([
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'S',
  'SPAN',
  'MARK',
  'BLOCKQUOTE',
  'CITE',
  'PRE',
  'CODE',
  'UL',
  'OL',
  'LI',
  'A',
  'HR',
  'BR',
])

const ALLOWED_ATTRIBUTES = new Set(['class', 'style', 'href', 'target', 'rel', 'tabindex'])

function sanitizeRichTextHtml(rawHtml: string): string {
  if (typeof window === 'undefined') return rawHtml

  const parser = new DOMParser()
  const doc = parser.parseFromString(rawHtml, 'text/html')

  const sanitizeNode = (node: Node) => {
    const childNodes = Array.from(node.childNodes)

    for (const child of childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement

        if (!ALLOWED_TAGS.has(element.tagName)) {
          element.remove()
          continue
        }

        for (const attr of Array.from(element.attributes)) {
          const attrName = attr.name.toLowerCase()
          if (!ALLOWED_ATTRIBUTES.has(attrName)) {
            element.removeAttribute(attr.name)
            continue
          }

          if (attrName === 'href' && /^\s*javascript:/i.test(attr.value)) {
            element.removeAttribute(attr.name)
          }
        }

        if (element.tagName === 'PRE' && !element.hasAttribute('tabindex')) {
          element.setAttribute('tabindex', '0')
        }

        sanitizeNode(element)
      }
    }
  }

  sanitizeNode(doc.body)
  return doc.body.innerHTML
}

export function BlogContent({ html, isLocked }: BlogContentProps) {
  const sanitizedHtml = useMemo(() => sanitizeRichTextHtml(html), [html])

  return (
    <div className="relative mt-8">
      <div
        className={`rich-text-content ${
          isLocked
            ? 'mask-[linear-gradient(to_bottom,black_62%,transparent_100%)] pb-8 select-none'
            : ''
        }`}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  )
}


/**
 * Markdown <-> User-Friendly HTML document conversion utilities.
 * Handles headings, bold, italic, strikethrough, bullet lists,
 * numbered lists, quotes, dividers, and interactive checkbox task lines.
 */

export function htmlToMarkdown(html: string): string {
  if (!html) return ''

  // Use DOMParser when in browser environment
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    function parseNode(node: Node): string {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || ''
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return ''
      }

      const el = node as HTMLElement
      const tag = el.tagName.toLowerCase()

      // Checkbox Task Row
      if (el.classList.contains('task-checkbox-row') || el.hasAttribute('data-checked')) {
        const isChecked =
          el.getAttribute('data-checked') === 'true' || (el.querySelector('input[type="checkbox"]') as HTMLInputElement)?.checked
        const textSpan = el.querySelector('.task-text') || el
        const text = textSpan.textContent?.trim() || ''
        return `\n- [${isChecked ? 'x' : ' '}] ${text}\n`
      }

      const childText = Array.from(el.childNodes).map(parseNode).join('')

      switch (tag) {
        case 'h1':
          return `\n# ${childText.trim()}\n\n`
        case 'h2':
          return `\n## ${childText.trim()}\n\n`
        case 'h3':
          return `\n### ${childText.trim()}\n\n`
        case 'strong':
        case 'b':
          return `**${childText}**`
        case 'em':
        case 'i':
          return `*${childText}*`
        case 's':
        case 'strike':
        case 'del':
          return `~~${childText}~~`
        case 'u':
          return `<u>${childText}</u>`
        case 'mark':
          return `==${childText}==`
        case 'blockquote':
          return `\n> ${childText.trim()}\n\n`
        case 'hr':
          return `\n---\n\n`
        case 'ul':
          return `\n${childText}\n`
        case 'ol':
          return `\n${childText}\n`
        case 'li': {
          // If parent is OL, could be numbered, else bullet
          const isOrdered = el.parentElement?.tagName.toLowerCase() === 'ol'
          const index = Array.from(el.parentElement?.children || []).indexOf(el) + 1
          const prefix = isOrdered ? `${index}. ` : `- `
          return `${prefix}${childText.trim()}\n`
        }
        case 'p':
          return childText.trim() ? `\n${childText}\n` : '\n'
        case 'br':
          return '\n'
        case 'div':
          return childText.trim() ? `\n${childText}\n` : '\n'
        default:
          return childText
      }
    }

    const raw = parseNode(doc.body)
    // Normalize excessive newlines and strip zero-width spaces
    return raw
      .replace(/\u200B/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  // Fallback simple regex cleaner
  return html
    .replace(/\u200B/g, '')
    .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<del>(.*?)<\/del>/gi, '~~$1~~')
    .replace(/<s>(.*?)<\/s>/gi, '~~$1~~')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<[^>]+>/g, '')
    .trim()
}

export function markdownToHtml(markdown: string): string {
  if (!markdown) return '<p></p>'

  const lines = markdown.split('\n')
  const output: string[] = []
  let inBulletList = false
  let inNumberedList = false

  const closeLists = () => {
    if (inBulletList) {
      output.push('</ul>')
      inBulletList = false
    }
    if (inNumberedList) {
      output.push('</ol>')
      inNumberedList = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    if (!trimmed) {
      closeLists()
      continue
    }

    // Checkbox checklist line: - [ ] text or - [x] text
    const checklistMatch = trimmed.match(/^-\s*\[([ xX])\]\s*(.*)$/)
    if (checklistMatch) {
      closeLists()
      const isChecked = checklistMatch[1].toLowerCase() === 'x'
      const taskText = formatInline(checklistMatch[2])
      output.push(
        `<div class="task-checkbox-row ${isChecked ? 'is-completed' : ''}" data-checked="${isChecked}">` +
          `<input type="checkbox" ${isChecked ? 'checked' : ''} />` +
          `<span class="task-text">${taskText}</span>` +
          `</div>`,
      )
      continue
    }

    // Heading 1: # Title
    if (trimmed.startsWith('# ')) {
      closeLists()
      output.push(`<h1>${formatInline(trimmed.slice(2))}</h1>`)
      continue
    }

    // Heading 2: ## Title
    if (trimmed.startsWith('## ')) {
      closeLists()
      output.push(`<h2>${formatInline(trimmed.slice(3))}</h2>`)
      continue
    }

    // Heading 3: ### Title
    if (trimmed.startsWith('### ')) {
      closeLists()
      output.push(`<h3>${formatInline(trimmed.slice(4))}</h3>`)
      continue
    }

    // Blockquote: > text
    if (trimmed.startsWith('> ')) {
      closeLists()
      output.push(`<blockquote>${formatInline(trimmed.slice(2))}</blockquote>`)
      continue
    }

    // Divider: --- or ***
    if (trimmed === '---' || trimmed === '***') {
      closeLists()
      output.push('<hr/>')
      continue
    }

    // Bullet list: - item or * item
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/)
    if (bulletMatch) {
      if (!inBulletList) {
        closeLists()
        output.push('<ul>')
        inBulletList = true
      }
      output.push(`<li>${formatInline(bulletMatch[1])}</li>`)
      continue
    }

    // Numbered list: 1. item
    const numMatch = trimmed.match(/^\d+\.\s+(.*)$/)
    if (numMatch) {
      if (!inNumberedList) {
        closeLists()
        output.push('<ol>')
        inNumberedList = true
      }
      output.push(`<li>${formatInline(numMatch[1])}</li>`)
      continue
    }

    // Regular paragraph
    closeLists()
    output.push(`<p>${formatInline(trimmed)}</p>`)
  }

  closeLists()
  return output.join('')
}

function formatInline(text: string): string {
  return (
    text
      // Bold: **text**
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      // Italic: *text*
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      // Strikethrough: ~~text~~
      .replace(/~~(.*?)~~/g, '<s>$1</s>')
      // Highlight: ==text==
      .replace(/==(.*?)==/g, '<mark>$1</mark>')
      // Inline code: `text`
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-sm font-mono text-slate-800">$1</code>')
  )
}

/**
 * Extracts plain text snippet for note card previews.
 */
export function extractTextSnippet(html: string, maxLen = 140): string {
  if (!html) return ''
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen).trim() + '...'
}

/**
 * Counts tasks in an HTML note (returns total and completed).
 */
export function countTasksInHtml(html: string): { total: number; completed: number } {
  if (!html) return { total: 0, completed: 0 }
  const total = (html.match(/task-checkbox-row/g) || []).length
  const completed = (html.match(/data-checked="true"/g) || []).length + (html.match(/is-completed/g) || []).length
  // Deduplicate if both attributes exist on same row
  const actualCompleted = (html.match(/data-checked="true"/g) || []).length
  return { total, completed: actualCompleted }
}

'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Type,
  Highlighter,
  Quote,
  Minus,
  Undo,
  Redo,
  Copy,
  Check,
  Code2,
  Eye,
} from 'lucide-react'
import { htmlToMarkdown, markdownToHtml } from '@/lib/markdown-convert'
import { useLanguage } from '@/context/LanguageContext'

interface RichTextEditorProps {
  initialHtml: string
  onChange: (html: string, markdown: string) => void
  placeholder?: string
}

function getSelectionHeading(editorEl: HTMLElement | null): string {
  if (typeof window === 'undefined' || !editorEl) return 'p'
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return 'p'
  let node: Node | null = selection.anchorNode
  while (node && node !== editorEl) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as HTMLElement).tagName.toLowerCase()
      if (tag === 'h1' || tag === 'h2' || tag === 'h3') return tag
    }
    node = node.parentNode
  }
  return 'p'
}

function isSelectionHighlighted(editorEl: HTMLElement | null): boolean {
  if (typeof window === 'undefined' || !editorEl) return false
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false

  let node: Node | null = selection.anchorNode
  while (node && node !== editorEl) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      const tag = el.tagName.toLowerCase()
      if (tag === 'mark') return true
      const bg = el.style.backgroundColor
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return true
    }
    node = node.parentNode
  }

  try {
    const val = document.queryCommandValue('hiliteColor') || document.queryCommandValue('backColor')
    if (val && val !== 'transparent' && val !== 'rgba(0, 0, 0, 0)' && val !== 'rgb(255, 255, 255)') {
      return true
    }
  } catch {
    // Ignore
  }

  return false
}

function isSelectionInTag(editorEl: HTMLElement | null, tagName: string): boolean {
  if (typeof window === 'undefined' || !editorEl) return false
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false

  let node: Node | null = selection.anchorNode
  while (node && node !== editorEl) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      if (el.tagName.toLowerCase() === tagName.toLowerCase()) return true
    }
    node = node.parentNode
  }
  return false
}

function isSelectionInChecklist(editorEl: HTMLElement | null): boolean {
  if (typeof window === 'undefined' || !editorEl) return false
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false

  let node: Node | null = selection.anchorNode
  while (node && node !== editorEl) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      if (el.classList.contains('task-checkbox-row')) return true
    }
    node = node.parentNode
  }
  return false
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialHtml,
  onChange,
  placeholder = 'Write your thoughts, tasks, or notes here...',
}) => {
  const { t } = useLanguage()
  const editorRef = useRef<HTMLDivElement>(null)
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    heading: 'p',
    highlight: false,
    quote: false,
    bulletList: false,
    numberList: false,
    checklist: false,
  })
  const [viewMode, setViewMode] = useState<'visual' | 'markdown'>('visual')
  const [markdownText, setMarkdownText] = useState(() => htmlToMarkdown(initialHtml))
  const [copied, setCopied] = useState(false)
  const isUpdatingFromProp = useRef(false)

  // Update active format indicators based on current text selection
  const updateActiveFormats = useCallback(() => {
    if (typeof document === 'undefined') return
    const isHilite = isSelectionHighlighted(editorRef.current)
    const isBq = isSelectionInTag(editorRef.current, 'blockquote')
    const isUl = isSelectionInTag(editorRef.current, 'ul')
    const isOl = isSelectionInTag(editorRef.current, 'ol')
    const isTask = isSelectionInChecklist(editorRef.current)

    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strike: document.queryCommandState('strikeThrough'),
      heading: getSelectionHeading(editorRef.current),
      highlight: isHilite,
      quote: isBq,
      bulletList: isUl,
      numberList: isOl,
      checklist: isTask,
    })
  }, [])

  // Sync state whenever editor changes
  const syncContent = useCallback(() => {
    if (!editorRef.current || isUpdatingFromProp.current) return
    const html = editorRef.current.innerHTML
    const md = htmlToMarkdown(html)
    setMarkdownText(md)
    onChange(html, md)
    updateActiveFormats()
  }, [onChange, updateActiveFormats])

  // Set initial content on mount
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialHtml) {
      isUpdatingFromProp.current = true
      editorRef.current.innerHTML = initialHtml || '<p><br></p>'
      setMarkdownText(htmlToMarkdown(initialHtml))
      isUpdatingFromProp.current = false
    }
  }, [initialHtml])

  // Selection change listener to keep toolbar active states in sync
  useEffect(() => {
    const handleSelectionChange = () => {
      if (document.activeElement === editorRef.current || editorRef.current?.contains(document.activeElement)) {
        updateActiveFormats()
      }
    }
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [updateActiveFormats])

  // Event delegation on editor container for interactive checklist changes
  useEffect(() => {
    const el = editorRef.current
    if (!el) return

    const handleCheckboxChange = (e: Event) => {
      const target = e.target as HTMLElement
      if (target instanceof HTMLInputElement && target.type === 'checkbox') {
        const row = target.closest('.task-checkbox-row') as HTMLElement | null
        if (row) {
          row.setAttribute('data-checked', target.checked ? 'true' : 'false')
          if (target.checked) {
            row.classList.add('is-completed')
          } else {
            row.classList.remove('is-completed')
          }
          syncContent()
        }
      }
    }

    el.addEventListener('change', handleCheckboxChange)
    return () => {
      el.removeEventListener('change', handleCheckboxChange)
    }
  }, [syncContent])

  // Handle format commands
  const applyFormat = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(command, false, value)
    syncContent()
  }

  const handleHeadingChange = (level: 'p' | 'h1' | 'h2' | 'h3') => {
    if (!editorRef.current) return
    editorRef.current.focus()
    if (level === 'p') {
      document.execCommand('formatBlock', false, '<p>')
    } else {
      document.execCommand('formatBlock', false, `<${level}>`)
    }
    syncContent()
  }

  // Toggle highlight: shows active state, and toggles on/off cleanly even while typing
  const toggleHighlight = () => {
    if (!editorRef.current) return
    editorRef.current.focus()

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    // Check if inside a highlight
    let node: Node | null = selection.anchorNode
    let markElement: HTMLElement | null = null
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        const tag = el.tagName.toLowerCase()
        const bg = el.style.backgroundColor
        if (tag === 'mark' || (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)')) {
          markElement = el
          break
        }
      }
      node = node.parentNode
    }

    const range = selection.getRangeAt(0)

    // If currently highlighted -> TOGGLE OFF
    if (markElement) {
      if (!range.collapsed) {
        // Selection is not collapsed: unwrap mark element
        const parent = markElement.parentNode
        if (parent) {
          while (markElement.firstChild) {
            parent.insertBefore(markElement.firstChild, markElement)
          }
          parent.removeChild(markElement)
        }
        document.execCommand('hiliteColor', false, 'transparent')
      } else {
        // Selection is collapsed: break out of the mark element so typed text is NOT highlighted
        const preRange = range.cloneRange()
        preRange.selectNodeContents(markElement)
        preRange.setEnd(range.startContainer, range.startOffset)
        const textBefore = preRange.toString()

        const postRange = range.cloneRange()
        postRange.selectNodeContents(markElement)
        postRange.setStart(range.endContainer, range.endOffset)
        const textAfter = postRange.toString()

        if (textAfter.length === 0) {
          // At end of highlight
          const zws = document.createTextNode('\u200B')
          markElement.after(zws)
          const newRange = document.createRange()
          newRange.setStart(zws, 1)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        } else if (textBefore.length === 0) {
          // At start of highlight
          const zws = document.createTextNode('\u200B')
          markElement.before(zws)
          const newRange = document.createRange()
          newRange.setStart(zws, 1)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        } else {
          // In middle of highlight: split highlight
          preRange.setEnd(range.startContainer, range.startOffset)
          const beforeFragment = preRange.extractContents()

          const zws = document.createTextNode('\u200B')
          const mark2 = markElement.cloneNode(true) as HTMLElement

          markElement.innerHTML = ''
          markElement.appendChild(beforeFragment)

          markElement.after(zws)
          zws.after(mark2)

          const newRange = document.createRange()
          newRange.setStart(zws, 1)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
      }
      syncContent()
      updateActiveFormats()
      return
    }

    // Not currently highlighted -> TOGGLE ON
    if (!range.collapsed) {
      const mark = document.createElement('mark')
      try {
        mark.appendChild(range.extractContents())
        range.insertNode(mark)
        range.selectNodeContents(mark)
        selection.removeAllRanges()
        selection.addRange(range)
      } catch {
        document.execCommand('hiliteColor', false, '#fed7aa')
      }
    } else {
      const mark = document.createElement('mark')
      const zws = document.createTextNode('\u200B')
      mark.appendChild(zws)
      range.insertNode(mark)

      const newRange = document.createRange()
      newRange.setStart(zws, 1)
      newRange.collapse(true)
      selection.removeAllRanges()
      selection.addRange(newRange)
    }
    syncContent()
    updateActiveFormats()
  }

  // Toggle quote: turns quote on or off
  const toggleQuote = () => {
    if (!editorRef.current) return
    editorRef.current.focus()

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    // Check if inside a blockquote
    let node: Node | null = selection.anchorNode
    let bqElement: HTMLElement | null = null
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === 'blockquote') {
        bqElement = node as HTMLElement
        break
      }
      node = node.parentNode
    }

    if (bqElement) {
      // TOGGLE OFF: Convert blockquote back to standard paragraph
      const p = document.createElement('p')
      p.innerHTML = bqElement.innerHTML.trim() ? bqElement.innerHTML : '<br>'
      bqElement.replaceWith(p)

      const range = document.createRange()
      range.selectNodeContents(p)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
      syncContent()
      updateActiveFormats()
      return
    }

    // TOGGLE ON: Convert current block to blockquote
    node = selection.anchorNode
    let blockElement: HTMLElement | null = null
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as HTMLElement).tagName.toLowerCase()
        if (['p', 'div', 'h1', 'h2', 'h3'].includes(tag)) {
          blockElement = node as HTMLElement
          break
        }
      }
      node = node.parentNode
    }

    if (blockElement && blockElement !== editorRef.current) {
      const bq = document.createElement('blockquote')
      bq.innerHTML = blockElement.innerHTML.trim() ? blockElement.innerHTML : '<br>'
      blockElement.replaceWith(bq)

      const range = document.createRange()
      range.selectNodeContents(bq)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
      syncContent()
      updateActiveFormats()
      return
    }

    document.execCommand('formatBlock', false, '<blockquote>')
    syncContent()
    updateActiveFormats()
  }

  // Toggle selected line / block into a checklist line, or reverse back if already a checklist line
  const toggleTaskCheckbox = () => {
    if (!editorRef.current) return
    editorRef.current.focus()

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    // 1. Check if anchor or focus is inside an existing task-checkbox-row
    let node: Node | null = selection.anchorNode
    let existingRow: HTMLElement | null = null
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).classList.contains('task-checkbox-row')) {
        existingRow = node as HTMLElement
        break
      }
      node = node.parentNode
    }

    if (existingRow) {
      // REVERSE TOGGLE: Already a checklist line -> transform back to standard paragraph
      const textSpan = existingRow.querySelector('.task-text')
      const textHtml = textSpan ? textSpan.innerHTML : existingRow.innerText
      const p = document.createElement('p')
      p.innerHTML = textHtml.trim() ? textHtml : '<br>'
      existingRow.replaceWith(p)

      const range = document.createRange()
      range.selectNodeContents(p)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
      syncContent()
      updateActiveFormats()
      return
    }

    // 2. Not in a checkbox row: find the closest enclosing block (p, div, li, etc.)
    node = selection.anchorNode
    let blockElement: HTMLElement | null = null
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as HTMLElement).tagName.toLowerCase()
        if (['p', 'div', 'h1', 'h2', 'h3', 'blockquote', 'li'].includes(tag)) {
          blockElement = node as HTMLElement
          break
        }
      }
      node = node.parentNode
    }

    const selectedText = selection.toString().trim()

    if (blockElement && blockElement !== editorRef.current) {
      const content = blockElement.innerHTML.trim()
      const row = document.createElement('div')
      row.className = 'task-checkbox-row'
      row.setAttribute('data-checked', 'false')
      row.innerHTML = `<input type="checkbox" /><span class="task-text">${content || '&nbsp;'}</span>`
      blockElement.replaceWith(row)

      const span = row.querySelector('.task-text')
      if (span) {
        const range = document.createRange()
        range.selectNodeContents(span)
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
      }
      syncContent()
      updateActiveFormats()
      return
    }

    // Fallback: insert new checkbox row
    const taskHtml = `<div class="task-checkbox-row" data-checked="false"><input type="checkbox"/><span class="task-text">${selectedText || '&nbsp;'}</span></div>`
    document.execCommand('insertHTML', false, taskHtml)
    syncContent()
    updateActiveFormats()
  }

  const insertDivider = () => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand('insertHorizontalRule', false)
    syncContent()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // ENTER KEY HANDLING
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const anchorNode = selection.anchorNode

        // 1. Enter on Checklist row:
        // Always insert a new checklist row below, keeping current rule the same
        const taskRow = (anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement)?.closest('.task-checkbox-row')
        if (taskRow) {
          e.preventDefault()
          const newRow = document.createElement('div')
          newRow.className = 'task-checkbox-row'
          newRow.setAttribute('data-checked', 'false')
          newRow.innerHTML = '<input type="checkbox"/><span class="task-text">&nbsp;</span>'

          taskRow.after(newRow)
          const span = newRow.querySelector('.task-text')
          if (span) {
            const range = document.createRange()
            range.selectNodeContents(span)
            range.collapse(false)
            selection.removeAllRanges()
            selection.addRange(range)
          }
          syncContent()
          updateActiveFormats()
          return
        }

        // 2. Enter on list item (li):
        // Prevent default browser conversion of empty li into a normal rule!
        // Instead: insert a new li below and keep the current rule as a bullet/numbered list
        const liElement = (anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement)?.closest('li')
        if (liElement) {
          e.preventDefault()
          const range = selection.getRangeAt(0)
          const postRange = range.cloneRange()
          postRange.selectNodeContents(liElement)
          postRange.setStart(range.endContainer, range.endOffset)
          const remainingFragment = postRange.extractContents()

          const newLi = document.createElement('li')
          if (remainingFragment.childNodes.length > 0 && remainingFragment.textContent?.trim() !== '') {
            newLi.appendChild(remainingFragment)
          } else {
            newLi.innerHTML = '<br>'
          }

          if (!liElement.innerHTML.trim() || liElement.innerHTML === '') {
            liElement.innerHTML = '<br>'
          }

          liElement.after(newLi)

          const newRange = document.createRange()
          newRange.setStart(newLi, 0)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
          syncContent()
          updateActiveFormats()
          return
        }
      }
    }

    // BACKSPACE KEY HANDLING
    if (e.key === 'Backspace' && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0 && selection.isCollapsed) {
        const anchorNode = selection.anchorNode

        // 1. Backspace in blockquote:
        // Removing a quote line using backspace should first turn it into a normal line and only the next backspace should remove the line
        const bqElement = (anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement)?.closest('blockquote')
        if (bqElement) {
          const range = selection.getRangeAt(0)
          const preRange = range.cloneRange()
          preRange.selectNodeContents(bqElement)
          preRange.setEnd(range.startContainer, range.startOffset)
          const textBefore = preRange.toString().replace(/[\u200B\s]/g, '')

          if (textBefore.length === 0) {
            e.preventDefault()
            const p = document.createElement('p')
            p.innerHTML = bqElement.innerHTML.trim() ? bqElement.innerHTML : '<br>'
            bqElement.replaceWith(p)

            const newRange = document.createRange()
            newRange.setStart(p, 0)
            newRange.collapse(true)
            selection.removeAllRanges()
            selection.addRange(newRange)
            syncContent()
            updateActiveFormats()
            return
          }
        }

        // 2. Backspace on list item (li):
        // Pressing backspace when the line is empty should convert it into a normal line
        const liElement = (anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement)?.closest('li')
        if (liElement) {
          const textContent = liElement.textContent?.replace(/[\u200B\s]/g, '') || ''
          const range = selection.getRangeAt(0)
          const preRange = range.cloneRange()
          preRange.selectNodeContents(liElement)
          preRange.setEnd(range.startContainer, range.startOffset)
          const textBefore = preRange.toString().replace(/[\u200B\s]/g, '')

          if (textContent.length === 0 || textBefore.length === 0) {
            e.preventDefault()
            const parentList = liElement.parentElement
            const p = document.createElement('p')
            p.innerHTML = liElement.innerHTML.trim() && textContent.length > 0 ? liElement.innerHTML : '<br>'

            if (!parentList || parentList.children.length <= 1) {
              if (parentList) {
                parentList.replaceWith(p)
              } else {
                liElement.replaceWith(p)
              }
            } else {
              const lis = Array.from(parentList.children)
              const index = lis.indexOf(liElement)
              if (index === 0) {
                parentList.before(p)
                liElement.remove()
              } else if (index === lis.length - 1) {
                parentList.after(p)
                liElement.remove()
              } else {
                const itemsAfter = lis.slice(index + 1)
                const listTag = parentList.tagName.toLowerCase()
                const newList = document.createElement(listTag)
                itemsAfter.forEach(item => newList.appendChild(item))

                liElement.remove()
                parentList.after(newList)
                parentList.after(p)
              }
            }

            const newRange = document.createRange()
            newRange.setStart(p, 0)
            newRange.collapse(true)
            selection.removeAllRanges()
            selection.addRange(newRange)
            syncContent()
            updateActiveFormats()
            return
          }
        }

        // 3. Backspace on checklist row (.task-checkbox-row):
        // Pressing backspace when row is empty should convert it into a normal line
        const taskRow = (anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement)?.closest('.task-checkbox-row')
        if (taskRow) {
          const textSpan = taskRow.querySelector('.task-text')
          const rowText = textSpan?.textContent?.replace(/[\u200B\s]/g, '') || ''
          const range = selection.getRangeAt(0)
          const preRange = range.cloneRange()
          preRange.selectNodeContents(taskRow)
          preRange.setEnd(range.startContainer, range.startOffset)
          const textBefore = preRange.toString().replace(/[\u200B\s]/g, '')

          if (rowText.length === 0 || textBefore.length === 0) {
            e.preventDefault()
            const p = document.createElement('p')
            p.innerHTML = textSpan && textSpan.innerHTML.trim() && rowText.length > 0 ? textSpan.innerHTML : '<br>'
            taskRow.replaceWith(p)

            const newRange = document.createRange()
            newRange.setStart(p, 0)
            newRange.collapse(true)
            selection.removeAllRanges()
            selection.addRange(newRange)
            syncContent()
            updateActiveFormats()
            return
          }
        }
      }
    }

    if (e.metaKey || e.ctrlKey) {
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault()
        applyFormat('bold')
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault()
        applyFormat('italic')
      } else if (e.key.toLowerCase() === 'u') {
        e.preventDefault()
        applyFormat('underline')
      }
    }
  }

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setMarkdownText(val)
    const convertedHtml = markdownToHtml(val)
    if (editorRef.current) {
      editorRef.current.innerHTML = convertedHtml
    }
    onChange(convertedHtml, val)
  }

  const copyMarkdown = () => {
    navigator.clipboard.writeText(markdownText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Word count singular/plural formatted with i18n
  const rawWords = (markdownText || '')
    .replace(/\u200B/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const wordCount = rawWords.length
  const wordLabel = `${wordCount} ${wordCount === 1 ? t('word') : t('words')}`

  return (
    <div className="relative flex flex-col w-full h-full bg-white rounded-2xl border border-rose-100 overflow-hidden shadow-2xs">
      {/* Top Toolbar Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-rose-100 bg-rose-50/50 gap-2 flex-wrap">
        {/* Only show rich-formatting toolbar when in visual editor mode */}
        {viewMode === 'visual' ? (
          <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none max-w-full">
            {/* Text Size / Heading Selection */}
            <div className="flex items-center bg-white border border-rose-100 rounded-xl p-0.5 shadow-2xs mr-1">
              <button
                type="button"
                onClick={() => handleHeadingChange('p')}
                title="Normal text"
                aria-label="Normal text"
                className={`min-h-[34px] min-w-[34px] px-2 flex items-center justify-center rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeFormats.heading === 'p'
                    ? 'bg-rose-500 text-white font-semibold'
                    : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                }`}
              >
                <Type className="w-3.5 h-3.5 mr-1" />
                <span>Normal</span>
              </button>
              <button
                type="button"
                onClick={() => handleHeadingChange('h1')}
                title="Heading 1"
                aria-label="Heading 1"
                className={`min-h-[34px] min-w-[34px] px-2 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeFormats.heading === 'h1' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                }`}
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => handleHeadingChange('h2')}
                title="Heading 2"
                aria-label="Heading 2"
                className={`min-h-[34px] min-w-[34px] px-2 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeFormats.heading === 'h2' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                }`}
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => handleHeadingChange('h3')}
                title="Heading 3"
                aria-label="Heading 3"
                className={`min-h-[34px] min-w-[34px] px-2 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeFormats.heading === 'h3' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                }`}
              >
                H3
              </button>
            </div>

            <div className="w-[1px] h-6 bg-rose-200/70 mx-1 shrink-0" />

            {/* Text Style buttons */}
            <div className="flex items-center gap-0.5 bg-white border border-rose-100 rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => applyFormat('bold')}
                title={t('bold')}
                aria-label={t('bold')}
                className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  activeFormats.bold ? 'bg-rose-500 text-white font-semibold' : 'text-slate-700 hover:bg-rose-50'
                }`}
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('italic')}
                title={t('italic')}
                aria-label={t('italic')}
                className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  activeFormats.italic ? 'bg-rose-500 text-white font-semibold' : 'text-slate-700 hover:bg-rose-50'
                }`}
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('underline')}
                title={t('underline')}
                aria-label={t('underline')}
                className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  activeFormats.underline ? 'bg-rose-500 text-white font-semibold' : 'text-slate-700 hover:bg-rose-50'
                }`}
              >
                <Underline className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('strikeThrough')}
                title={t('strike')}
                aria-label={t('strike')}
                className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  activeFormats.strike ? 'bg-rose-500 text-white font-semibold' : 'text-slate-700 hover:bg-rose-50'
                }`}
              >
                <Strikethrough className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={toggleHighlight}
                title="Highlight"
                aria-label="Highlight"
                className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  activeFormats.highlight ? 'bg-amber-500 text-white font-semibold shadow-2xs' : 'text-amber-500 hover:bg-amber-50'
                }`}
              >
                <Highlighter className="w-4 h-4" />
              </button>
            </div>

            <div className="w-[1px] h-6 bg-rose-200/70 mx-1 shrink-0" />

            {/* Lists & Interactive Checkbox Toggle */}
            <div className="flex items-center gap-0.5 bg-white border border-rose-100 rounded-xl p-0.5 shadow-2xs">
              {/* Checkbox Line: Icon only, green icon, shows active state */}
              <button
                type="button"
                onClick={toggleTaskCheckbox}
                title={t('checklist')}
                aria-label={t('checklist')}
                className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  activeFormats.checklist ? 'bg-emerald-600 text-white font-semibold shadow-2xs' : 'text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => applyFormat('insertUnorderedList')}
                title={t('bulletList')}
                aria-label={t('bulletList')}
                className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  activeFormats.bulletList ? 'bg-rose-500 text-white font-semibold shadow-2xs' : 'text-slate-700 hover:bg-rose-50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => applyFormat('insertOrderedList')}
                title={t('numberList')}
                aria-label={t('numberList')}
                className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  activeFormats.numberList ? 'bg-rose-500 text-white font-semibold shadow-2xs' : 'text-slate-700 hover:bg-rose-50'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={toggleQuote}
                title={t('quote')}
                aria-label={t('quote')}
                className={`min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  activeFormats.quote ? 'bg-rose-500 text-white font-semibold shadow-2xs' : 'text-slate-700 hover:bg-rose-50'
                }`}
              >
                <Quote className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={insertDivider}
                title={t('divider')}
                aria-label={t('divider')}
                className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-700 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center gap-0.5 bg-white border border-rose-100 rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => applyFormat('undo')}
                title={t('undo')}
                aria-label={t('undo')}
                className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-700 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('redo')}
                title={t('redo')}
                aria-label={t('redo')}
                className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-700 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 py-1">
            <span>Markdown View Mode</span>
          </div>
        )}

        {/* View mode toggle */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <div className="flex items-center bg-white border border-rose-100 rounded-xl p-0.5 text-xs font-medium shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`min-h-[30px] px-2.5 flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'visual' ? 'bg-rose-500 text-white font-semibold' : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('markdown')}
              className={`min-h-[30px] px-2.5 flex items-center gap-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'markdown' ? 'bg-rose-500 text-white font-semibold' : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
          </div>

          {viewMode === 'markdown' && (
            <button
              type="button"
              onClick={copyMarkdown}
              className="min-h-[30px] px-2.5 flex items-center gap-1 rounded-lg bg-rose-100/70 hover:bg-rose-200 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Copy markdown to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Body Area: Word counter placed in bottom-right with high z-index */}
      <div className="relative flex-1 p-4 md:p-6 overflow-y-auto">
        {viewMode === 'visual' ? (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder={placeholder}
            onInput={syncContent}
            onKeyUp={updateActiveFormats}
            onMouseUp={updateActiveFormats}
            onKeyDown={handleKeyDown}
            className="note-editor-content w-full focus:outline-none focus-visible:outline-none pb-8"
          />
        ) : (
          <div className="flex flex-col h-full w-full">
            <textarea
              value={markdownText}
              onChange={handleMarkdownChange}
              placeholder="# Write markdown here..."
              className="w-full flex-1 p-4 font-mono text-sm leading-relaxed text-slate-800 bg-rose-50/20 rounded-xl border border-rose-100 focus:outline-none focus:ring-1 focus:ring-rose-400 resize-none min-h-[300px] pb-8"
            />
          </div>
        )}

        {/* Word info in bottom right with high z-index, handles singular / plural properly */}
        <div className="absolute bottom-3 right-3 z-30 pointer-events-none text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs border border-rose-100 text-rose-500 font-medium select-none shadow-2xs">
          {wordLabel}
        </div>
      </div>
    </div>
  )
}

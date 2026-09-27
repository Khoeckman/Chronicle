'use client'

import React, { useState } from 'react'
import { X, Check, Calendar, Tag as TagIcon, Square, Download } from 'lucide-react'
import { Task, TaskColor } from '@/types/note'
import { RichTextEditor } from '../Editor/RichTextEditor'
import { exportSingleTaskAsMarkdown } from '@/lib/storage'
import { format24HourTime } from '@/lib/date-utils'
import { useLanguage } from '@/context/LanguageContext'

interface NoteModalProps {
  note: Task | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedTask: Task) => void
  onDelete?: (taskId: string) => void
  defaultDate: string // YYYY-MM-DD
}

interface TaskFormProps {
  note: Task | null
  defaultDate: string
  onClose: () => void
  onSave: (updatedTask: Task) => void
}

const allColors: TaskColor[] = ['rose', 'pink', 'peach', 'amber', 'lemon', 'mint', 'emerald', 'teal', 'sky', 'indigo', 'lavender', 'slate']

const colorBg: Record<TaskColor, string> = {
  rose: 'bg-rose-400',
  pink: 'bg-pink-400',
  peach: 'bg-orange-400',
  amber: 'bg-amber-400',
  lemon: 'bg-yellow-400',
  mint: 'bg-emerald-400',
  emerald: 'bg-teal-600',
  teal: 'bg-cyan-500',
  sky: 'bg-sky-400',
  indigo: 'bg-indigo-400',
  lavender: 'bg-purple-400',
  slate: 'bg-slate-400',
}

const TaskForm: React.FC<TaskFormProps> = ({ note, defaultDate, onClose, onSave }) => {
  const { language, t } = useLanguage()

  const [title, setTitle] = useState(() => note?.title || '')
  const [contentHtml, setContentHtml] = useState(() => note?.contentHtml || '<p><br></p>')
  const [contentMarkdown, setContentMarkdown] = useState(() => note?.contentMarkdown || '')
  const [date, setDate] = useState(() => note?.date || defaultDate)
  const [isCompleted, setIsCompleted] = useState(() => !!note?.isCompleted)
  const [tags, setTags] = useState<string[]>(() => note?.tags || [])
  const [newTagInput, setNewTagInput] = useState('')
  const [color, setColor] = useState<TaskColor>(() => note?.color || 'rose')
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(() => (note ? format24HourTime(note.updatedAt) : null))

  const handleEditorChange = (html: string, markdown: string) => {
    setContentHtml(html)
    setContentMarkdown(markdown)
    setLastSavedTime('Just now')
  }

  const handleAddTag = () => {
    const trimmed = newTagInput.trim().toLowerCase().replace(/^#/, '')
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setNewTagInput('')
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleSaveAndClose = () => {
    const updatedTask: Task = {
      id: note ? note.id : `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim() || (language === 'nl' ? 'Naamloze taak' : 'Untitled Task'),
      contentHtml: contentHtml || '<p><br></p>',
      contentMarkdown: contentMarkdown || '',
      date: date || defaultDate,
      createdAt: note ? note.createdAt : Date.now(),
      updatedAt: Date.now(),
      isCompleted,
      tags,
      color,
    }
    onSave(updatedTask)
    onClose()
  }

  const handleExportMarkdown = () => {
    if (!note) return
    exportSingleTaskAsMarkdown(note, contentMarkdown)
  }

  const addTagPlaceholder = t('addTag')

  return (
    <div
      className="relative flex flex-col w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-rose-100 bg-rose-50/70 gap-2 flex-wrap">
        {/* Left: Task completion toggle & Date picker (equal height: min-h-[38px] h-[38px]) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCompleted(!isCompleted)}
            className={`min-h-[38px] h-[38px] px-3.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isCompleted
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-white text-slate-700 border-rose-200 hover:border-rose-300 hover:bg-rose-50'
            }`}
          >
            {isCompleted ? (
              <Check className="w-4 h-4 text-white stroke-[2.75] shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{isCompleted ? t('filterCompleted') : language === 'nl' ? 'Als voltooid markeren' : 'Mark Complete'}</span>
          </button>

          {/* Date Input - matched to exact height 38px as buttons */}
          <label className="min-h-[38px] h-[38px] flex items-center gap-2 bg-white border border-rose-200/80 rounded-xl px-3 text-xs text-slate-700 cursor-pointer hover:border-rose-300">
            <Calendar className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-transparent focus:outline-none font-medium cursor-pointer text-xs h-full"
            />
          </label>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Prettier Saved: hh:mm pill (no monospace font) */}
          {lastSavedTime && (
            <span className="text-xs text-rose-600/80 bg-white/90 border border-rose-200/80 rounded-full px-2.5 py-1 hidden sm:inline-flex items-center gap-1.5 mr-1 shadow-2xs font-medium tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>
                {t('saved')}: {lastSavedTime === 'Just now' ? t('justNow') : lastSavedTime}
              </span>
            </span>
          )}

          {note && (
            <button
              type="button"
              onClick={handleExportMarkdown}
              title={t('downloadMarkdown')}
              className="min-h-[38px] min-w-[38px] h-[38px] w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-rose-100/60 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Done button: centered check icon with thicker stroke */}
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="min-h-[38px] h-[38px] px-4 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs ml-1 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3] shrink-0" />
            <span className="leading-none">{t('done')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            title={t('close')}
            className="min-h-[38px] min-w-[38px] h-[38px] w-[38px] flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-xl hover:bg-rose-100/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Note Title & Expanded 12 Colors Palette (Black outline with offset zero for active color) */}
      <div className="px-4 py-3 border-b border-rose-100 flex items-center justify-between gap-3 bg-white flex-wrap sm:flex-nowrap">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={t('titlePlaceholder')}
          className="w-full text-lg sm:text-xl font-bold text-slate-900 placeholder:text-rose-200 focus:outline-none min-w-[200px]"
          autoFocus={!note}
        />

        {/* 12 Color Options with black outline and outline-offset zero */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap max-w-full py-1">
          {allColors.map(c => {
            const isSelectedColor = color === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                title={`Color: ${c}`}
                style={{
                  outline: isSelectedColor ? '2px solid #000000' : 'none',
                  outlineOffset: '0px',
                }}
                className={`w-5 h-5 rounded-full ${colorBg[c]} transition-transform cursor-pointer ${
                  isSelectedColor ? 'scale-105' : 'opacity-80 hover:opacity-100 hover:scale-105'
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* Custom Tags Bar: click whole tag to delete, pretty Add tag input fitting placeholder width */}
      <div className="px-4 py-2 bg-rose-50/30 border-b border-rose-100 flex items-center gap-2 flex-wrap text-xs">
        <span className="text-rose-400 flex items-center gap-1 text-[11px] font-semibold">
          <TagIcon className="w-3 h-3" />
          {t('tags')}
        </span>

        {/* Selected custom tags - Clicking the whole tag deletes it */}
        {tags.map(tTag => (
          <button
            key={tTag}
            type="button"
            onClick={() => handleRemoveTag(tTag)}
            title={t('tapToDeleteTag')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100/90 hover:bg-rose-200 text-rose-800 text-xs font-medium transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <span>#{tTag}</span>
            <span className="text-rose-500 font-bold text-sm leading-none">×</span>
          </button>
        ))}

        {/* Prettier Tag input with width dynamically fitting the placeholder */}
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-rose-300 hover:border-rose-400 focus-within:border-rose-500 focus-within:bg-white bg-white/70 transition-all text-xs shadow-2xs">
          <span className="text-rose-400 font-bold text-xs select-none">#</span>
          <input
            type="text"
            value={newTagInput}
            onChange={e => setNewTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={addTagPlaceholder}
            style={{
              width: `${Math.max(newTagInput.length, addTagPlaceholder.length) + 1}ch`,
            }}
            className="bg-transparent focus:outline-none text-xs text-slate-800 placeholder:text-rose-300 font-medium transition-all"
          />
        </div>
      </div>

      {/* Rich Document Editor */}
      <div className="flex-1 p-3 sm:p-4 overflow-hidden flex flex-col min-h-[380px]">
        <RichTextEditor initialHtml={contentHtml} onChange={handleEditorChange} placeholder={t('editorPlaceholder')} />
      </div>
    </div>
  )
}

export const NoteModal: React.FC<NoteModalProps> = ({ note, isOpen, onClose, onSave, defaultDate }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <TaskForm key={note ? note.id : `new-${defaultDate}`} note={note} defaultDate={defaultDate} onClose={onClose} onSave={onSave} />
    </div>
  )
}

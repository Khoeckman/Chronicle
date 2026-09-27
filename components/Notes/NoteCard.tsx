'use client'

import React from 'react'
import { Trash2, Clock, Check } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Task, TaskColor } from '@/types/note'
import { formatDisplayDate, isToday, format24HourTime } from '@/lib/date-utils'
import { extractTextSnippet, countTasksInHtml } from '@/lib/markdown-convert'
import { useLanguage } from '@/context/LanguageContext'

interface NoteCardProps {
  note: Task
  onSelect: (task: Task) => void
  onToggleTaskComplete: (taskId: string, completed: boolean) => void
  onDelete: (taskId: string) => void
  showDate?: boolean
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onSelect, onToggleTaskComplete, onDelete, showDate = false }) => {
  const { language, t } = useLanguage()
  const dateLocale = language === 'nl' ? 'nl-NL' : 'en-US'

  const subtaskCounts = countTasksInHtml(note.contentHtml)
  const previewText = extractTextSnippet(note.contentHtml, 110)

  const handleTaskCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextCompleted = !note.isCompleted
    if (nextCompleted) {
      try {
        confetti({
          particleCount: 36,
          spread: 60,
          origin: { y: 0.75 },
          colors: ['#10b981', '#f472b6', '#ec4899', '#c084fc', '#38bdf8'],
        })
      } catch {
        // Safe fallback
      }
    }
    onToggleTaskComplete(note.id, nextCompleted)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(note.id)
  }

  // 12 beautiful pastel styles preserved even when completed!
  const colorStyles: Record<TaskColor, string> = {
    rose: 'bg-rose-50/60 border-rose-200/80 hover:border-rose-300',
    pink: 'bg-pink-50/60 border-pink-200/80 hover:border-pink-300',
    peach: 'bg-orange-50/60 border-orange-200/80 hover:border-orange-300',
    amber: 'bg-amber-50/60 border-amber-200/80 hover:border-amber-300',
    lemon: 'bg-yellow-50/60 border-yellow-200/80 hover:border-yellow-300',
    mint: 'bg-emerald-50/60 border-emerald-200/80 hover:border-emerald-300',
    emerald: 'bg-teal-50/60 border-teal-200/80 hover:border-teal-300',
    teal: 'bg-cyan-50/60 border-cyan-200/80 hover:border-cyan-300',
    sky: 'bg-sky-50/60 border-sky-200/80 hover:border-sky-300',
    indigo: 'bg-indigo-50/60 border-indigo-200/80 hover:border-indigo-300',
    lavender: 'bg-purple-50/60 border-purple-200/80 hover:border-purple-300',
    slate: 'bg-slate-50/70 border-slate-200/80 hover:border-slate-300',
  }

  const dotColorMap: Record<TaskColor, string> = {
    rose: 'bg-rose-500',
    pink: 'bg-pink-500',
    peach: 'bg-orange-500',
    amber: 'bg-amber-500',
    lemon: 'bg-yellow-500',
    mint: 'bg-emerald-500',
    emerald: 'bg-teal-600',
    teal: 'bg-cyan-600',
    sky: 'bg-sky-500',
    indigo: 'bg-indigo-500',
    lavender: 'bg-purple-500',
    slate: 'bg-slate-500',
  }

  const noteColor: TaskColor = note.color || 'rose'
  const cardStyle = colorStyles[noteColor] || colorStyles.rose
  const taskAccentBg = dotColorMap[noteColor] || dotColorMap.rose

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(note)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(note)
        }
      }}
      className={`group relative flex flex-col p-4 rounded-2xl border transition-all text-left shadow-2xs hover:shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${cardStyle}`}
    >
      {/* Top row: Checkbox centered with Title + Actions */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Circular Task Status Indicator: white hole (half size) when incomplete; full solid circle with check when completed */}
          <button
            type="button"
            onClick={handleTaskCheckboxClick}
            title={note.isCompleted ? t('markIncomplete') : t('markCompleted')}
            aria-label={note.isCompleted ? t('markIncomplete') : t('markCompleted')}
            className="flex items-center justify-center rounded-full transition-transform active:scale-90 cursor-pointer shrink-0 p-0.5 self-center"
          >
            {note.isCompleted ? (
              <div className={`w-5 h-5 rounded-full ${taskAccentBg} flex items-center justify-center text-white shadow-2xs`}>
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            ) : (
              <div
                className={`w-5 h-5 rounded-full ${taskAccentBg} flex items-center justify-center shadow-2xs hover:scale-105 transition-transform`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white block shrink-0" />
              </div>
            )}
          </button>

          {/* Title - centered with the checkbox */}
          <div className="min-w-0 flex-1 flex items-center self-center">
            <h3
              className={`text-sm sm:text-base font-bold leading-tight truncate ${
                note.isCompleted ? 'line-through text-slate-400 font-medium' : 'text-slate-900'
              }`}
            >
              {note.title || (language === 'nl' ? 'Naamloze taak' : 'Untitled Task')}
            </h3>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 -mr-1">
          <button
            type="button"
            onClick={handleDeleteClick}
            title={t('deleteTask')}
            aria-label={t('deleteTask')}
            className="p-1.5 rounded-lg hover:bg-rose-100/70 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview text */}
      {previewText && <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-3 pl-8 font-normal leading-relaxed">{previewText}</p>}

      {/* Metadata Row: Clean Unboxed Metadata */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-rose-100/60 text-[11px] text-slate-500 gap-2 flex-wrap pl-8">
        <div className="flex items-center gap-2 flex-wrap">
          {showDate && (
            <>
              <span className="font-semibold text-rose-700 capitalize">
                {isToday(note.date) ? t('today') : formatDisplayDate(note.date, dateLocale)}
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
            </>
          )}

          {/* Clean Unboxed Custom Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-1.5 text-rose-600">
              {note.tags.map((tTag, idx) => (
                <React.Fragment key={tTag}>
                  <span className="font-medium hover:text-rose-800 transition-colors">#{tTag}</span>
                  {idx < note.tags.length - 1 && (
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Subtasks text with all-petite-caps scaled up to normal readable size */}
          {subtaskCounts.total > 0 && (
            <>
              {note.tags?.length > 0 && (
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
              )}
              <span className="tabular-nums text-slate-600 text-sm font-semibold tracking-wide" style={{ fontVariant: 'all-petite-caps' }}>
                {subtaskCounts.completed}/{subtaskCounts.total} {t('subtasks')}
              </span>
            </>
          )}
        </div>

        {/* 24-hour timestamp */}
        <div className="flex items-center gap-1 text-slate-400 text-xs tabular-nums shrink-0">
          <Clock className="w-3 h-3" />
          <span>{format24HourTime(note.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}

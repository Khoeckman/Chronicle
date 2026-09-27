'use client'

import React, { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { getWeekDays, isSameDay, isToday, formatDateIso, getDayOfWeekShort, addDays, getTodayIso } from '@/lib/date-utils'
import { Task, TaskColor } from '@/types/note'
import { useLanguage } from '@/context/LanguageContext'

interface WeekViewProps {
  selectedDate: string // YYYY-MM-DD
  onSelectDate: (iso: string) => void
  tasks: Task[]
}

const dotColorMap: Record<TaskColor, string> = {
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

export const WeekView: React.FC<WeekViewProps> = ({ selectedDate, onSelectDate, tasks }) => {
  const { language, t } = useLanguage()
  const dateLocale = language === 'nl' ? 'nl-NL' : 'en-US'

  const currentSelectedDateObj = new Date(selectedDate + 'T12:00:00')
  const weekDays = getWeekDays(currentSelectedDateObj)
  const todayIso = getTodayIso()
  const isViewingToday = isSameDay(selectedDate, todayIso)

  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('right')
  const touchStartX = useRef<number | null>(null)

  const handlePrevWeek = () => {
    setSwipeDirection('left')
    const prev = addDays(currentSelectedDateObj, -7)
    onSelectDate(formatDateIso(prev))
  }

  const handleNextWeek = () => {
    setSwipeDirection('right')
    const next = addDays(currentSelectedDateObj, 7)
    onSelectDate(formatDateIso(next))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diffX = e.changedTouches[0].clientX - touchStartX.current
    if (diffX > 45) {
      handlePrevWeek()
    } else if (diffX < -45) {
      handleNextWeek()
    }
    touchStartX.current = null
  }

  const handleGoToday = () => {
    onSelectDate(todayIso)
  }

  const firstDay = weekDays[0]
  const lastDay = weekDays[6]
  const monthLabel =
    firstDay.getMonth() === lastDay.getMonth()
      ? firstDay.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })
      : `${firstDay.toLocaleDateString(dateLocale, { month: 'short' })} - ${lastDay.toLocaleDateString(dateLocale, { month: 'short', year: 'numeric' })}`

  const weekKey = formatDateIso(firstDay)

  return (
    <div
      className="w-full bg-white/95 rounded-2xl border border-rose-100/90 p-3 md:p-4 shadow-2xs overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Week Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm md:text-base font-bold text-slate-900 tracking-tight capitalize">{monthLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          {!isViewingToday && (
            <button
              type="button"
              onClick={handleGoToday}
              className="min-h-[34px] px-3 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            >
              {t('today')}
            </button>
          )}

          <div className="flex items-center border border-rose-100 rounded-lg bg-rose-50/60 p-0.5">
            <button
              type="button"
              onClick={handlePrevWeek}
              aria-label={t('prevWeek')}
              title={t('prevWeek')}
              className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-rose-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              aria-label={t('nextWeek')}
              title={t('nextWeek')}
              className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-rose-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Animated 7 Days Row */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={weekKey}
            initial={{ opacity: 0, x: swipeDirection === 'right' ? 36 : -36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: swipeDirection === 'right' ? -36 : 36 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="grid grid-cols-7 gap-1.5 sm:gap-2"
          >
            {weekDays.map(day => {
              const iso = formatDateIso(day)
              const isSelected = isSameDay(selectedDate, iso)
              const isCurrentToday = isToday(day)
              const dayTasks = tasks.filter(t => t.date === iso)

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => onSelectDate(iso)}
                  className={`min-h-[76px] sm:min-h-[86px] flex flex-col items-center justify-between p-2 rounded-xl transition-all relative cursor-pointer ${
                    isSelected
                      ? 'bg-rose-100/80 text-slate-900 border-2 border-rose-300 shadow-2xs font-semibold'
                      : 'bg-rose-50/40 hover:bg-rose-100/60 text-slate-700 border border-rose-100/60'
                  } ${isCurrentToday ? 'outline outline-1 outline-dotted outline-rose-500 -outline-offset-1' : ''}`}
                >
                  {/* Day abbreviation */}
                  <span className={`text-[11px] font-semibold tracking-tight uppercase ${isSelected ? 'text-rose-700' : 'text-slate-500'}`}>
                    {getDayOfWeekShort(day, dateLocale)}
                  </span>

                  {/* Day Number (no top-right dot) */}
                  <div className="flex items-center justify-center my-0.5">
                    <span
                      className={`text-base sm:text-lg tabular-nums ${
                        isSelected
                          ? 'text-slate-900 font-bold'
                          : isCurrentToday
                            ? 'text-rose-600 font-extrabold'
                            : 'text-slate-800 font-bold'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Task dots: white hole (half size) when incomplete; full circle when completed */}
                  <div className="flex items-center justify-center gap-1.5 min-h-[16px] w-full px-1 filter-none">
                    {dayTasks.length > 0 ? (
                      <div className="flex items-center justify-center gap-1.5 flex-wrap filter-none">
                        {dayTasks.slice(0, 4).map((t, idx) => {
                          const dotBg = dotColorMap[t.color || 'rose'] || 'bg-rose-400'
                          return (
                            <div
                              key={t.id || idx}
                              className={`w-2.5 h-2.5 rounded-full ${dotBg} shadow-2xs filter-none opacity-100 flex items-center justify-center shrink-0`}
                              title={t.title || 'Task'}
                            >
                              {!t.isCompleted && <span className="w-[5px] h-[5px] rounded-full bg-white block shrink-0" />}
                            </div>
                          )
                        })}
                        {dayTasks.length > 4 && (
                          <span className="text-[9px] font-bold text-slate-500 leading-none">+{dayTasks.length - 4}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-transparent select-none">-</span>
                    )}
                  </div>
                </button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { getMonthDays, isSameDay, isToday, formatDateIso, parseIsoDate, addMonths, getTodayIso } from '@/lib/date-utils'
import { Task, TaskColor } from '@/types/note'
import { useLanguage } from '@/context/LanguageContext'

interface MonthViewProps {
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

export const MonthView: React.FC<MonthViewProps> = ({ selectedDate, onSelectDate, tasks }) => {
  const { language, t } = useLanguage()
  const dateLocale = language === 'nl' ? 'nl-NL' : 'en-US'

  const currentSelectedDateObj = parseIsoDate(selectedDate)
  const [viewDate, setViewDate] = useState<Date>(new Date(currentSelectedDateObj.getFullYear(), currentSelectedDateObj.getMonth(), 1))
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('right')
  const touchStartX = useRef<number | null>(null)
  const todayIso = getTodayIso()
  const isViewingToday = isSameDay(selectedDate, todayIso)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const days = getMonthDays(year, month)

  const handlePrevMonth = () => {
    setSwipeDirection('left')
    setViewDate(addMonths(viewDate, -1))
  }

  const handleNextMonth = () => {
    setSwipeDirection('right')
    setViewDate(addMonths(viewDate, 1))
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diffX = e.changedTouches[0].clientX - touchStartX.current
    if (diffX > 45) {
      handlePrevMonth()
    } else if (diffX < -45) {
      handleNextMonth()
    }
    touchStartX.current = null
  }

  const handleGoToday = () => {
    const today = new Date()
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))
    onSelectDate(todayIso)
  }

  const monthTitle = viewDate.toLocaleDateString(dateLocale, {
    month: 'long',
    year: 'numeric',
  })

  const monthKey = `${year}-${month}`
  const weekDayHeaders = language === 'nl' ? ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div
      className="w-full bg-white/95 rounded-2xl border border-rose-100/90 p-3 md:p-4 shadow-2xs overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header controls */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900 tracking-tight capitalize">{monthTitle}</h2>
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
              onClick={handlePrevMonth}
              aria-label={t('prevMonth')}
              title={t('prevMonth')}
              className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-rose-600 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label={t('nextMonth')}
              title={t('nextMonth')}
              className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-rose-600 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {weekDayHeaders.map(header => (
          <span key={header} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-1">
            {header}
          </span>
        ))}
      </div>

      {/* Animated 35 or 42 Days grid */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={monthKey}
            initial={{ opacity: 0, x: swipeDirection === 'right' ? 36 : -36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: swipeDirection === 'right' ? -36 : 36 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="grid grid-cols-7 gap-1"
          >
            {days.map(day => {
              const iso = formatDateIso(day)
              const isSelected = isSameDay(selectedDate, iso)
              const isCurrentToday = isToday(day)
              const isCurrentMonth = day.getMonth() === month
              const dayTasks = tasks.filter(t => t.date === iso)

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => onSelectDate(iso)}
                  className={`min-h-[52px] sm:min-h-[60px] p-1 flex flex-col items-center justify-between rounded-xl transition-all relative cursor-pointer ${
                    isSelected
                      ? 'bg-rose-100/80 text-slate-900 border-2 border-rose-300 font-semibold shadow-2xs z-10'
                      : !isCurrentMonth
                        ? 'text-slate-300 hover:bg-rose-50/20'
                        : 'text-slate-700 hover:bg-rose-50/60 bg-rose-50/20'
                  } ${isCurrentToday ? 'outline outline-1 outline-dotted outline-rose-500 -outline-offset-1' : ''}`}
                >
                  {/* Day number (no top-right dot) */}
                  <div className="flex items-center justify-center w-full">
                    <span
                      className={`text-xs sm:text-sm tabular-nums ${
                        isSelected
                          ? 'text-slate-900 font-bold'
                          : isCurrentToday
                            ? 'text-rose-600 font-extrabold'
                            : !isCurrentMonth
                              ? 'text-slate-300'
                              : 'text-slate-800 font-semibold'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Day task dots: white hole (half size) when incomplete; full circle when completed */}
                  <div className="flex items-center justify-center gap-1 w-full min-h-[16px] px-0.5 filter-none">
                    {dayTasks.length > 0 && (
                      <div className="flex items-center justify-center gap-1 flex-wrap filter-none">
                        {dayTasks.slice(0, 3).map((t, idx) => {
                          const dotBg = dotColorMap[t.color || 'rose'] || 'bg-rose-400'
                          return (
                            <div
                              key={t.id || idx}
                              className={`w-3 h-3 rounded-full ${dotBg} shadow-2xs filter-none opacity-100 flex items-center justify-center shrink-0`}
                              title={t.title || 'Task'}
                            >
                              {!t.isCompleted && <span className="w-1.5 h-1.5 rounded-full bg-white block shrink-0" />}
                            </div>
                          )
                        })}
                        {dayTasks.length > 3 && <span className="text-[9px] font-bold text-slate-500 leading-none">+</span>}
                      </div>
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

'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, FileText } from 'lucide-react'
import { Task, CalendarViewMode, StatusFilter, DateScope } from '@/types/note'
import { loadTasks, saveTasks, subscribeToSyncUpdates, getInitialSeedTasks } from '@/lib/storage'
import { getTodayIso, formatDisplayDate, isToday, parseIsoDate, isDateInWeek, isDateInMonth } from '@/lib/date-utils'
import { Navbar } from '@/components/Navbar'
import { WeekView } from '@/components/Calendar/WeekView'
import { MonthView } from '@/components/Calendar/MonthView'
import { NoteCard } from '@/components/Notes/NoteCard'
import { NoteModal } from '@/components/Notes/NoteModal'
import { SearchAndFilter } from '@/components/SearchAndFilter'
import { DataSyncModal } from '@/components/DataSyncModal'
import { LanguageProvider, useLanguage } from '@/context/LanguageContext'

function ChronicleApp() {
  const { language, t } = useLanguage()
  const dateLocale = language === 'nl' ? 'nl-NL' : 'en-US'

  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIso)
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('week')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [dateScope, setDateScope] = useState<DateScope>('day')
  const [activeModalTask, setActiveModalTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)

  // Load tasks from localStorage after hydration and subscribe to external updates
  useEffect(() => {
    setTasks(loadTasks())

    const unsubscribe = subscribeToSyncUpdates(() => {
      const fresh = loadTasks()
      setTasks(fresh)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const updateTasksState = useCallback((newTasks: Task[]) => {
    setTasks(newTasks)
    saveTasks(newTasks)
  }, [])

  const handleSaveTask = (updatedTask: Task) => {
    const exists = tasks.some(t => t.id === updatedTask.id)
    let nextTasks: Task[]
    if (exists) {
      nextTasks = tasks.map(t => (t.id === updatedTask.id ? updatedTask : t))
    } else {
      nextTasks = [updatedTask, ...tasks]
    }
    updateTasksState(nextTasks)
  }

  const handleDeleteTask = (taskId: string) => {
    const nextTasks = tasks.filter(t => t.id !== taskId)
    updateTasksState(nextTasks)
  }

  const handleToggleTaskComplete = (taskId: string, completed: boolean) => {
    const nextTasks = tasks.map(t => (t.id === taskId ? { ...t, isCompleted: completed, updatedAt: Date.now() } : t))
    updateTasksState(nextTasks)
  }

  const handleOpenNewTask = (prefillTitle?: string, prefillHtml?: string) => {
    const newTaskObj: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: prefillTitle || '',
      contentHtml: prefillHtml || '<p><br></p>',
      contentMarkdown: '',
      date: selectedDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isCompleted: false,
      tags: selectedTag ? [selectedTag] : [],
      color: 'rose',
    }
    setActiveModalTask(newTaskObj)
    setIsModalOpen(true)
  }

  const handleOpenEditTask = (task: Task) => {
    setActiveModalTask(task)
    setIsModalOpen(true)
  }

  // Collect all unique tags across all tasks
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    tasks.forEach(t => {
      t.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [tasks])

  // Filter tasks based on DateScope, Search, Status, and Tag
  const filteredTasks = useMemo(() => {
    const selectedDateObj = parseIsoDate(selectedDate)

    return tasks.filter(task => {
      // 1. Date Scope filter
      if (dateScope === 'day') {
        if (task.date !== selectedDate) return false
      } else if (dateScope === 'range') {
        if (calendarViewMode === 'week') {
          if (!isDateInWeek(task.date, selectedDateObj)) return false
        } else {
          if (!isDateInMonth(task.date, selectedDateObj)) return false
        }
      }

      // 2. Status filter
      if (statusFilter === 'active' && task.isCompleted) return false
      if (statusFilter === 'completed' && !task.isCompleted) return false

      // 3. Tag filter
      if (selectedTag && (!task.tags || !task.tags.includes(selectedTag))) {
        return false
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const inTitle = task.title.toLowerCase().includes(q)
        const inHtml = task.contentHtml.toLowerCase().includes(q)
        const inMarkdown = (task.contentMarkdown || '').toLowerCase().includes(q)
        const inTags = task.tags?.some(t => t.toLowerCase().includes(q.replace(/^#/, '')))
        if (!inTitle && !inHtml && !inMarkdown && !inTags) {
          return false
        }
      }

      return true
    })
  }, [tasks, selectedDate, dateScope, calendarViewMode, statusFilter, selectedTag, searchQuery])

  // Stats calculation
  const stats = useMemo(() => {
    const total = filteredTasks.length
    const completed = filteredTasks.filter(t => t.isCompleted).length
    return { total, completed }
  }, [filteredTasks])

  const currentScopeHeading = useMemo(() => {
    if (dateScope === 'day') {
      if (isToday(selectedDate)) {
        return language === 'nl' ? 'Taken van vandaag' : "Today's Tasks"
      }
      return formatDisplayDate(selectedDate, dateLocale)
    }
    if (dateScope === 'range') {
      if (calendarViewMode === 'week') {
        return language === 'nl' ? 'Taken van deze week' : "This Week's Tasks"
      }
      return language === 'nl' ? 'Taken van deze maand' : "This Month's Tasks"
    }
    return language === 'nl' ? 'Alle taken' : 'All Tasks'
  }, [dateScope, selectedDate, calendarViewMode, language, dateLocale])

  return (
    <div className="min-h-screen flex flex-col pb-20 sm:pb-12">
      {/* Top Navigation Bar */}
      <Navbar
        viewMode={calendarViewMode}
        onViewModeChange={setCalendarViewMode}
        onOpenNewTaskModal={() => handleOpenNewTask()}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 md:py-6 space-y-4 md:space-y-5">
        {/* Calendar View Container (Week or Month) */}
        <section aria-label="Calendar Navigation">
          {calendarViewMode === 'week' ? (
            <WeekView
              selectedDate={selectedDate}
              onSelectDate={iso => {
                setSelectedDate(iso)
                setDateScope('day')
              }}
              tasks={tasks}
            />
          ) : (
            <MonthView
              selectedDate={selectedDate}
              onSelectDate={iso => {
                setSelectedDate(iso)
                setDateScope('day')
              }}
              tasks={tasks}
            />
          )}
        </section>

        {/* Search, Status & Custom Tag Filtering Bar */}
        <section aria-label="Search and Filter">
          <SearchAndFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            availableTags={availableTags}
            dateScope={dateScope}
            onDateScopeChange={setDateScope}
            calendarViewMode={calendarViewMode}
            totalResultsCount={filteredTasks.length}
          />
        </section>

        {/* Selected Scope Header (Cleaned metadata: "0/1 tasks completed" with font-variant: all-petite-caps) */}
        <section className="flex items-center justify-between gap-3 pt-1 flex-wrap">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 capitalize">{currentScopeHeading}</h1>

            {/* Clean: "0/1 tasks completed" with font-variant: all-petite-caps and scaled up */}
            <div
              className="text-sm sm:text-base font-semibold text-rose-500 mt-0.5 tabular-nums tracking-wide"
              style={{ fontVariant: 'all-petite-caps' }}
            >
              {stats.completed}/{stats.total} {t('tasksCompleted')}
            </div>
          </div>

          {/* Single Add Note button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenNewTask()}
              className="min-h-[36px] px-4 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addNote')}</span>
            </button>
          </div>
        </section>

        {/* Tasks Grid */}
        <section aria-label="Tasks List" className="space-y-4">
          {filteredTasks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTasks.map(task => (
                <NoteCard
                  key={task.id}
                  note={task}
                  onSelect={handleOpenEditTask}
                  onToggleTaskComplete={handleToggleTaskComplete}
                  onDelete={handleDeleteTask}
                  showDate={dateScope !== 'day'}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white/80 rounded-2xl border border-dashed border-rose-200">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400 mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {searchQuery || selectedTag || statusFilter !== 'all'
                  ? language === 'nl'
                    ? 'Geen taken gevonden die voldoen aan de filters'
                    : 'No tasks match your filters'
                  : language === 'nl'
                    ? 'Nog geen taken voor deze weergave'
                    : 'No tasks for this view yet'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-4 leading-relaxed">
                {searchQuery || selectedTag || statusFilter !== 'all'
                  ? language === 'nl'
                    ? 'Probeer je zoekopdracht of labelfilter te wissen om alle items te zien.'
                    : 'Try clearing your search query or tag filter to view all entries.'
                  : language === 'nl'
                    ? 'Leg snelle gedachten, checklists of herinneringen vast voor deze datum.'
                    : 'Capture quick thoughts, checklists, or reminders for this date.'}
              </p>

              {searchQuery || selectedTag || statusFilter !== 'all' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                    setSelectedTag(null)
                  }}
                  className="min-h-[38px] px-4 text-xs font-semibold text-rose-700 bg-rose-100/70 hover:bg-rose-200/80 rounded-xl transition-colors cursor-pointer"
                >
                  {language === 'nl' ? 'Wis alle filters' : 'Clear all filters'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenNewTask()}
                  className="min-h-[38px] px-4 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('addNote')}</span>
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Mobile Sticky Floating Action Button */}
      <div className="sm:hidden fixed bottom-4 right-4 z-30">
        <button
          type="button"
          onClick={() => handleOpenNewTask()}
          aria-label={t('addTaskOrNote')}
          className="min-h-[52px] min-w-[52px] rounded-full bg-rose-500 text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Task Detail / Editor Modal */}
      <NoteModal
        note={activeModalTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setActiveModalTask(null)
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        defaultDate={selectedDate}
      />

      {/* Offline Storage & Backup Modal */}
      <DataSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        tasks={tasks}
        onImportTasks={imported => {
          updateTasksState(imported)
        }}
        onResetSeedTasks={() => {
          const fresh = getInitialSeedTasks()
          updateTasksState(fresh)
        }}
      />
    </div>
  )
}

export default function Home() {
  return (
    <LanguageProvider>
      <ChronicleApp />
    </LanguageProvider>
  )
}

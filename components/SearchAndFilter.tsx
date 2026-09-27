'use client'

import React from 'react'
import { Search, X, Tag as TagIcon, Calendar } from 'lucide-react'
import { StatusFilter, DateScope, CalendarViewMode } from '@/types/note'
import { useLanguage } from '@/context/LanguageContext'

interface SearchAndFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (status: StatusFilter) => void
  selectedTag: string | null
  onSelectTag: (tag: string | null) => void
  availableTags: string[]
  dateScope: DateScope
  onDateScopeChange: (scope: DateScope) => void
  calendarViewMode: CalendarViewMode
  totalResultsCount: number
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedTag,
  onSelectTag,
  availableTags,
  dateScope,
  onDateScopeChange,
  calendarViewMode,
  totalResultsCount,
}) => {
  const { t } = useLanguage()

  const statusOptions: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: t('filterAll') },
    { id: 'active', label: t('filterActive') },
    { id: 'completed', label: t('filterCompleted') },
  ]

  const rangeLabel = calendarViewMode === 'week' ? t('week') : t('month')

  return (
    <div className="flex flex-col gap-2.5 w-full bg-white/95 rounded-2xl border border-rose-100 p-3 shadow-2xs">
      {/* Search Input and Dynamic Scope Switcher: Day / (Week or Month) / All */}
      <div className="flex items-center gap-2 flex-col sm:flex-row">
        {/* Search bar */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-rose-300">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-8 py-2 bg-rose-50/30 hover:bg-rose-50/60 focus:bg-white text-sm text-slate-800 placeholder:text-rose-300 rounded-xl border border-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label={t('clearSearch')}
              title={t('clearSearch')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-rose-300 hover:text-rose-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dynamic Scope Filter: Day / Week or Month / All */}
        <div className="flex items-center bg-rose-50/80 p-0.5 rounded-xl border border-rose-100 self-stretch sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => onDateScopeChange('day')}
            className={`flex-1 sm:flex-initial min-h-[34px] px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              dateScope === 'day' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-rose-400" />
            <span>{t('day')}</span>
          </button>

          <button
            type="button"
            onClick={() => onDateScopeChange('range')}
            className={`flex-1 sm:flex-initial min-h-[34px] px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              dateScope === 'range' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            <span>{rangeLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => onDateScopeChange('all')}
            className={`flex-1 sm:flex-initial min-h-[34px] px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              dateScope === 'all' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            <span>{t('all')}</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Status Segmented Controls (All / Active / Completed) + Counter */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-rose-50">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none">
          {statusOptions.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onStatusFilterChange(opt.id)}
              className={`min-h-[30px] px-3 text-xs rounded-lg transition-all whitespace-nowrap font-medium cursor-pointer ${
                statusFilter === opt.id
                  ? 'bg-rose-500 text-white font-semibold shadow-2xs'
                  : 'bg-rose-50/60 text-slate-600 hover:text-rose-700 hover:bg-rose-100/70'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Results Counter - with font-variant: all-petite-caps and no monospace font */}
        <div className="text-sm font-semibold text-rose-500 tabular-nums shrink-0 tracking-wide" style={{ fontVariant: 'all-petite-caps' }}>
          {totalResultsCount} {totalResultsCount === 1 ? t('task') : t('tasks')}
        </div>
      </div>

      {/* Custom Tag filter bar (if custom tags have been created) */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs">
          <span className="text-rose-400 flex items-center gap-1 shrink-0 mr-1 text-[11px] font-semibold">
            <TagIcon className="w-3 h-3" />
            {t('tagsLabel')}
          </span>

          <button
            type="button"
            onClick={() => onSelectTag(null)}
            className={`px-2 py-0.5 rounded-md transition-colors whitespace-nowrap font-medium cursor-pointer ${
              selectedTag === null ? 'bg-rose-200 text-rose-900 font-semibold' : 'text-slate-500 hover:text-rose-700'
            }`}
          >
            {t('allTags')}
          </button>

          {availableTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-0.5 rounded-lg transition-all whitespace-nowrap font-medium cursor-pointer ${
                selectedTag === tag ? 'bg-rose-500 text-white shadow-2xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

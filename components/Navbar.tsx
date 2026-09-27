'use client'

import React from 'react'
import { CalendarDays, Calendar as CalendarIcon, Plus, HardDrive, Languages } from 'lucide-react'
import { CalendarViewMode } from '@/types/note'
import { useLanguage } from '@/context/LanguageContext'

interface NavbarProps {
  viewMode: CalendarViewMode
  onViewModeChange: (mode: CalendarViewMode) => void
  onOpenNewTaskModal: () => void
  onOpenSyncModal: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ viewMode, onViewModeChange, onOpenNewTaskModal, onOpenSyncModal }) => {
  const { language, setLanguage, t } = useLanguage()

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-rose-100/80 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Chronicle wordmark with Notes & Calendar underneath (Kept strictly in English) */}
        <div className="flex flex-col justify-center shrink-0">
          <span className="text-lg md:text-xl font-bold tracking-tight text-slate-900 leading-tight">Chronicle</span>
          <span className="text-[11px] font-semibold text-rose-500 tracking-tight leading-none">Notes & Calendar</span>
        </div>

        {/* Zone 2: Navigation controls (Week / Month view switcher) */}
        <nav className="flex items-center gap-1.5">
          <div className="flex items-center bg-rose-50/80 p-0.5 rounded-xl border border-rose-100/70">
            <button
              type="button"
              onClick={() => onViewModeChange('week')}
              className={`min-h-[34px] px-2.5 sm:px-3 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'week' ? 'bg-white text-rose-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{t('week')}</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('month')}
              className={`min-h-[34px] px-2.5 sm:px-3 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'month' ? 'bg-white text-rose-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{t('month')}</span>
            </button>
          </div>
        </nav>

        {/* Zone 3: Language toggle & Primary actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Switcher (EN / NL) */}
          <div
            className="flex items-center bg-rose-50/80 p-0.5 rounded-xl border border-rose-100/70 text-xs font-semibold"
            title={language === 'en' ? 'Switch to Nederlands' : 'Schakel over naar English'}
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`min-h-[32px] px-2 rounded-lg transition-all cursor-pointer ${
                language === 'en' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('nl')}
              className={`min-h-[32px] px-2 rounded-lg transition-all cursor-pointer ${
                language === 'nl' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              NL
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenSyncModal}
            title={t('storageAndBackup')}
            aria-label={t('storageAndBackup')}
            className="min-h-[38px] min-w-[38px] w-[38px] h-[38px] flex items-center justify-center rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors border border-rose-200/80 bg-white cursor-pointer shadow-2xs"
          >
            <HardDrive className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenNewTaskModal}
            title={t('addTaskOrNote')}
            aria-label={t('addTaskOrNote')}
            className="min-h-[38px] min-w-[38px] w-[38px] h-[38px] flex items-center justify-center rounded-xl text-white bg-rose-500 hover:bg-rose-600 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}

'use client'

import React, { useState } from 'react'
import { X, Download, Upload, ShieldCheck, CheckCircle2, HardDrive } from 'lucide-react'
import { Task } from '@/types/note'
import { exportTasksAsJson } from '@/lib/storage'
import { useLanguage } from '@/context/LanguageContext'

interface DataSyncModalProps {
  isOpen: boolean
  onClose: () => void
  tasks: Task[]
  onImportTasks: (imported: Task[]) => void
  onResetSeedTasks?: () => void
}

export const DataSyncModal: React.FC<DataSyncModalProps> = ({ isOpen, onClose, tasks, onImportTasks }) => {
  const { language, t } = useLanguage()
  const [importStatus, setImportStatus] = useState<string | null>(null)

  if (!isOpen) return null

  const handleExport = () => {
    exportTasksAsJson(tasks)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = event => {
      try {
        const text = event.target?.result as string
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportTasks(parsed)
          setImportStatus(
            language === 'nl' ? `${parsed.length} taken succesvol hersteld!` : `Successfully restored ${parsed.length} tasks!`,
          )
          setTimeout(() => {
            setImportStatus(null)
            onClose()
          }, 1400)
        } else {
          setImportStatus(language === 'nl' ? 'Ongeldig back-upbestand: geen taken gevonden.' : 'Invalid backup file: no tasks found.')
        }
      } catch {
        setImportStatus(
          language === 'nl'
            ? 'Fout bij het lezen van het bestand. Geef een geldige JSON-back-up op.'
            : 'Error reading file. Please provide a valid JSON backup.',
        )
      }
    }
    reader.readAsText(file)
  }

  const storageBytes =
    typeof window !== 'undefined'
      ? new Blob([localStorage.getItem('chronicle_tasks_data_v2') || localStorage.getItem('chronicle_notes_data_v1') || '']).size
      : 0
  const storageKb = (storageBytes / 1024).toFixed(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100 bg-rose-50/60">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-900 text-base">{t('storageTitle')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-100/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/40 border border-rose-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs text-slate-600">
              <p className="font-semibold text-slate-900">{language === 'nl' ? 'Lokale opslag actief' : 'Device Local Storage Active'}</p>
              <p>
                {language === 'nl'
                  ? 'Je taken worden veilig opgeslagen op je apparaat voor snelle offline toegang.'
                  : 'Your tasks are saved securely on your device for fast offline access.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-1">
            <div className="p-2.5 rounded-xl bg-rose-50/40 border border-rose-100">
              <div className="text-base font-bold font-mono tabular-nums text-rose-600">{tasks.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">{language === 'nl' ? 'Totaal' : 'Total Tasks'}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50/40 border border-rose-100">
              <div className="text-base font-bold font-mono tabular-nums text-emerald-600">
                {tasks.filter(tTask => tTask.isCompleted).length}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">{t('filterCompleted')}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50/40 border border-rose-100">
              <div className="text-base font-bold font-mono tabular-nums text-slate-700">{storageKb} KB</div>
              <div className="text-[11px] text-slate-500 font-medium">{language === 'nl' ? 'Geheugen' : 'Storage'}</div>
            </div>
          </div>

          {importStatus && (
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-900 text-xs font-medium flex items-center gap-2 border border-rose-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-rose-100">
            <button
              type="button"
              onClick={handleExport}
              className="w-full h-11 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>{language === 'nl' ? 'Alle taken exporteren (JSON)' : 'Export All Tasks (JSON Backup)'}</span>
            </button>

            <label className="w-full h-11 px-4 rounded-xl border border-rose-200 hover:bg-rose-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-rose-400" />
              <span>{language === 'nl' ? 'Back-up importeren / herstellen' : 'Import / Restore Backup'}</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

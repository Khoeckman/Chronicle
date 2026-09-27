export type Language = 'en' | 'nl'

export const translations = {
  en: {
    // Nav & Common
    week: 'Week',
    month: 'Month',
    day: 'Day',
    all: 'All',
    storageAndBackup: 'Storage & Backup',
    addTaskOrNote: 'Add task or note',
    addNote: 'Add Note',
    language: 'Language',

    // Search & Filter
    searchPlaceholder: 'Search tasks, #tags, or details...',
    filterAll: 'All',
    filterActive: 'Active',
    filterCompleted: 'Completed',
    task: 'task',
    tasks: 'tasks',
    tasksCompleted: 'tasks completed',
    subtasks: 'subtasks',
    clearSearch: 'Clear search',
    tagsLabel: 'Tags:',
    allTags: 'All tags',

    // Calendar
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    prevWeek: 'Previous week',
    nextWeek: 'Next week',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    weekOf: 'Week of {date}',
    monthOf: 'Month of {date}',
    allNotes: 'All Notes',
    noNotesDate: 'No notes for this date',
    tapToAddNote: 'Tap + to write a note or task',
    noNotesMatch: 'No notes found matching your search',
    clearFilter: 'Clear filter',

    // Note Card
    markIncomplete: 'Mark as incomplete',
    markCompleted: 'Mark task completed',
    deleteTask: 'Delete',

    // Note Modal
    titlePlaceholder: 'Title of task or note...',
    tags: 'Tags:',
    addTag: 'Add tag',
    tapToDeleteTag: 'Tap to delete tag',
    editorPlaceholder: 'Write your task details, checklist, or journal here...',
    saved: 'Saved',
    justNow: 'Just now',
    done: 'Done',
    close: 'Close',
    downloadMarkdown: 'Download as Markdown file',
    words: 'words',
    word: 'word',

    // Toolbar
    bold: 'Bold',
    italic: 'Italic',
    underline: 'Underline',
    strike: 'Strikethrough',
    bulletList: 'Bullet list',
    numberList: 'Numbered list',
    checklist: 'Checklist',
    quote: 'Quote',
    divider: 'Divider',
    undo: 'Undo',
    redo: 'Redo',
    clearAll: 'Clear all',

    // Data Sync Modal
    storageTitle: 'Storage & Backup',
    downloadBackupTitle: 'Download Backup (JSON)',
    downloadBackupDesc: 'Download all your tasks, markdown content, and tags as a JSON backup file.',
    exportJson: 'Export JSON',
    importTasksTitle: 'Import Tasks (JSON)',
    importTasksDesc: 'Upload a previously exported JSON backup to restore or merge tasks.',
    chooseJsonFile: 'Choose JSON File',
    storageInfo: 'Your data is stored locally in your browser with automatic persistence.',
    importSuccess: 'Successfully imported {count} tasks!',
    invalidJson: 'Invalid JSON file format',
  },
  nl: {
    // Nav & Common
    week: 'Week',
    month: 'Maand',
    day: 'Dag',
    all: 'Alles',
    storageAndBackup: 'Opslag & Back-up',
    addTaskOrNote: 'Taak of notitie toevoegen',
    addNote: 'Notitie toevoegen',
    language: 'Taal',

    // Search & Filter
    searchPlaceholder: 'Zoek taken, #tags of details...',
    filterAll: 'Alles',
    filterActive: 'Actief',
    filterCompleted: 'Voltooid',
    task: 'taak',
    tasks: 'taken',
    tasksCompleted: 'taken voltooid',
    subtasks: 'deeltaken',
    clearSearch: 'Zoekopdracht wissen',
    tagsLabel: 'Labels:',
    allTags: 'Alle labels',

    // Calendar
    today: 'Vandaag',
    tomorrow: 'Morgen',
    yesterday: 'Gisteren',
    prevWeek: 'Vorige week',
    nextWeek: 'Volgende week',
    prevMonth: 'Vorige maand',
    nextMonth: 'Volgende maand',
    weekOf: 'Week van {date}',
    monthOf: 'Maand {date}',
    allNotes: 'Alle notities',
    noNotesDate: 'Geen notities voor deze datum',
    tapToAddNote: 'Tik op + om een notitie of taak te maken',
    noNotesMatch: 'Geen notities gevonden die overeenkomen met je zoekopdracht',
    clearFilter: 'Filter wissen',

    // Note Card
    markIncomplete: 'Markeren als onvoltooid',
    markCompleted: 'Markeren als voltooid',
    deleteTask: 'Verwijderen',

    // Note Modal
    titlePlaceholder: 'Titel van taak of notitie...',
    tags: 'Labels:',
    addTag: 'Tag toevoegen',
    tapToDeleteTag: 'Tik om label te verwijderen',
    editorPlaceholder: 'Schrijf hier je taakdetails, checklist of dagboek...',
    saved: 'Opgeslagen',
    justNow: 'Zojuist',
    done: 'Klaar',
    close: 'Sluiten',
    downloadMarkdown: 'Downloaden als Markdown-bestand',
    words: 'woorden',
    word: 'woord',

    // Toolbar
    bold: 'Vet',
    italic: 'Cursief',
    underline: 'Onderstreept',
    strike: 'Doorgehaald',
    bulletList: 'Opsomming',
    numberList: 'Genummerde lijst',
    checklist: 'Checklist',
    quote: 'Citaat',
    divider: 'Scheidingslijn',
    undo: 'Ongedaan maken',
    redo: 'Opnieuw',
    clearAll: 'Alles wissen',

    // Data Sync Modal
    storageTitle: 'Opslag & Back-up',
    downloadBackupTitle: 'Back-up downloaden (JSON)',
    downloadBackupDesc: 'Download al je taken, markdown en labels als een JSON-back-upbestand.',
    exportJson: 'JSON exporteren',
    importTasksTitle: 'Taken importeren (JSON)',
    importTasksDesc: 'Upload een eerder geëxporteerde JSON-back-up om taken te herstellen of samen te voegen.',
    chooseJsonFile: 'Kies JSON-bestand',
    storageInfo: 'Je gegevens worden lokaal in je browser opgeslagen met automatische persistentie.',
    importSuccess: '{count} taken succesvol geïmporteerd!',
    invalidJson: 'Ongeldig JSON-bestandsformaat',
  },
} as const

export type TranslationKey = keyof (typeof translations)['en']

export function getTranslation(lang: Language, key: TranslationKey, params?: Record<string, string | number>): string {
  const dict = translations[lang] || translations.en
  let text: string = dict[key] || translations.en[key] || (key as string)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    })
  }
  return text
}

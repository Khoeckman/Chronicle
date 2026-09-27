import { Task } from '@/types/note'
import { getTodayIso, addDays, formatDateIso } from './date-utils'
import { markdownToHtml } from './markdown-convert'

const STORAGE_KEY = 'chronicle_tasks_data_v2'
const BROADCAST_CHANNEL_NAME = 'chronicle_offline_sync'

export function getInitialSeedTasks(): Task[] {
  const today = getTodayIso()
  const todayDate = new Date()
  const tomorrow = formatDateIso(addDays(todayDate, 1))
  const yesterday = formatDateIso(addDays(todayDate, -1))
  const twoDaysLater = formatDateIso(addDays(todayDate, 2))

  const task1Html = markdownToHtml(
    `# Morning Focus & Goals
Plan for high-impact deliverables today:

- [x] Review project feedback and design inspiration
- [x] Check schedule for calendar week and month views
- [ ] Try out rich formatting and custom tags
- [ ] Enjoy iced matcha latte
`,
  )

  const task2Html = markdownToHtml(
    `# Creative Design Journal
Ideas for styling and aesthetic touches:

- Palette: Soft blush rose, lavender, peach, and pastel mint
- Smooth responsive touch targets for mobile
`,
  )

  const task3Html = markdownToHtml(
    `# Weekly Errands & Self Care
Self-care and essentials:

- [x] Fresh flowers for studio desk
- [ ] Scented lavender candles
- [ ] Restock sketching stationery
`,
  )

  const task4Html = markdownToHtml(
    `# Next Week Vision & Plans
Goals to prepare for:

1. Finalize mobile calendar layouts
2. Organize task tags for the week
3. Relax and take time for coffee
`,
  )

  const seedTasks: Task[] = [
    {
      id: 'seed-task-1',
      title: 'Morning Focus & Goals',
      contentHtml: task1Html,
      contentMarkdown: '',
      date: today,
      createdAt: Date.now() - 3600000 * 4,
      updatedAt: Date.now() - 3600000 * 2,
      isCompleted: false,
      tags: [],
      color: 'rose',
    },
    {
      id: 'seed-task-2',
      title: 'Creative Design Journal',
      contentHtml: task2Html,
      contentMarkdown: '',
      date: today,
      createdAt: Date.now() - 3600000 * 6,
      updatedAt: Date.now() - 3600000 * 3,
      isCompleted: false,
      tags: [],
      color: 'pink',
    },
    {
      id: 'seed-task-3',
      title: 'Weekly Errands & Self Care',
      contentHtml: task3Html,
      contentMarkdown: '',
      date: tomorrow,
      createdAt: Date.now() - 3600000 * 20,
      updatedAt: Date.now() - 3600000 * 5,
      isCompleted: false,
      tags: [],
      color: 'peach',
    },
    {
      id: 'seed-task-4',
      title: 'Next Week Vision & Plans',
      contentHtml: task4Html,
      contentMarkdown: '',
      date: twoDaysLater,
      createdAt: Date.now() - 3600000 * 24,
      updatedAt: Date.now() - 3600000 * 12,
      isCompleted: false,
      tags: [],
      color: 'lavender',
    },
    {
      id: 'seed-task-5',
      title: 'Yesterday Reflections & Win',
      contentHtml: markdownToHtml(
        `# Daily Retrospective\nAll items resolved:\n- [x] Set up beautiful mobile notes app\n- [x] Organize thoughts for the day`,
      ),
      contentMarkdown: '',
      date: yesterday,
      createdAt: Date.now() - 3600000 * 30,
      updatedAt: Date.now() - 3600000 * 26,
      isCompleted: true,
      tags: [],
      color: 'mint',
    },
  ]

  return seedTasks
}

export function loadTasks(): Task[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = getInitialSeedTasks()
      saveTasks(initial)
      return initial
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(item => ({
        ...item,
        isCompleted: typeof item.isCompleted === 'boolean' ? item.isCompleted : false,
        tags: Array.isArray(item.tags) ? item.tags : [],
      }))
    }
    const initial = getInitialSeedTasks()
    saveTasks(initial)
    return initial
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error)
    return getInitialSeedTasks()
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      bc.postMessage({ type: 'TASKS_UPDATED', timestamp: Date.now() })
      bc.close()
    }
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error)
  }
}

// Backwards-compatible aliases
export const loadNotes = loadTasks
export const saveNotes = saveTasks
export const getInitialSeedNotes = getInitialSeedTasks

export function subscribeToSyncUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  let bc: BroadcastChannel | null = null
  if (typeof BroadcastChannel !== 'undefined') {
    bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    bc.onmessage = event => {
      if (event.data?.type === 'TASKS_UPDATED' || event.data?.type === 'NOTES_UPDATED') {
        callback()
      }
    }
  }

  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === 'chronicle_notes_data_v1') {
      callback()
    }
  }

  window.addEventListener('storage', storageHandler)

  return () => {
    if (bc) bc.close()
    window.removeEventListener('storage', storageHandler)
  }
}

export function exportTasksAsJson(tasks: Task[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2))
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute('href', dataStr)
  const dateStr = getTodayIso()
  downloadAnchor.setAttribute('download', `chronicle-tasks-backup-${dateStr}.json`)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
}

export const exportNotesAsJson = exportTasksAsJson

export function exportSingleTaskAsMarkdown(task: Task, markdownContent: string): void {
  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute('href', url)
  const safeName = (task.title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  downloadAnchor.setAttribute('download', `${safeName}-${task.date}.md`)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
  URL.revokeObjectURL(url)
}

export const exportSingleNoteAsMarkdown = exportSingleTaskAsMarkdown

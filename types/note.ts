export type TaskColor =
  | 'rose'
  | 'pink'
  | 'peach'
  | 'amber'
  | 'lemon'
  | 'mint'
  | 'emerald'
  | 'teal'
  | 'sky'
  | 'indigo'
  | 'lavender'
  | 'slate'

export interface Task {
  id: string
  title: string
  contentHtml: string
  contentMarkdown: string
  date: string // ISO Date YYYY-MM-DD
  createdAt: number
  updatedAt: number
  isCompleted: boolean
  tags: string[]
  color?: TaskColor
}

// Alias for backwards compatibility
export type Note = Task
export type NoteColor = TaskColor

export type StatusFilter = 'all' | 'active' | 'completed'
export type CalendarViewMode = 'week' | 'month'
export type DateScope = 'day' | 'range' | 'all' // 'range' dynamically adapts to week or month

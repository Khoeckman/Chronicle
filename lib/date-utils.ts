/**
 * Date utility functions for calendar navigation and task organization.
 */

export function formatDateIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1, 12, 0, 0)
}

export function getTodayIso(): string {
  return formatDateIso(new Date())
}

export function isSameDay(d1: Date | string, d2: Date | string): boolean {
  const iso1 = typeof d1 === 'string' ? d1 : formatDateIso(d1)
  const iso2 = typeof d2 === 'string' ? d2 : formatDateIso(d2)
  return iso1 === iso2
}

export function isToday(date: Date | string): boolean {
  return isSameDay(date, new Date())
}

/**
 * Returns Monday to Sunday for the week of the given date.
 */
export function getWeekDays(centerDate: Date): Date[] {
  const d = new Date(centerDate.getFullYear(), centerDate.getMonth(), centerDate.getDate(), 12)
  const day = d.getDay() // 0 is Sunday, 1 is Monday ...
  const diffToMonday = (day === 0 ? -6 : 1) - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMonday)

  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday)
    current.setDate(monday.getDate() + i)
    days.push(current)
  }
  return days
}

/**
 * Checks if targetIso date falls in the same calendar week (Monday to Sunday) as centerDate.
 */
export function isDateInWeek(targetIso: string, centerDate: Date): boolean {
  const week = getWeekDays(centerDate)
  const targetTime = parseIsoDate(targetIso).getTime()
  const start = new Date(week[0].getFullYear(), week[0].getMonth(), week[0].getDate(), 0, 0, 0).getTime()
  const end = new Date(week[6].getFullYear(), week[6].getMonth(), week[6].getDate(), 23, 59, 59).getTime()
  return targetTime >= start && targetTime <= end
}

/**
 * Checks if targetIso date is in the same month & year as centerDate.
 */
export function isDateInMonth(targetIso: string, centerDate: Date): boolean {
  const target = parseIsoDate(targetIso)
  return target.getFullYear() === centerDate.getFullYear() && target.getMonth() === centerDate.getMonth()
}

/**
 * Returns full grid of dates for the month view (starting with Monday).
 * Always returns complete weeks (35 or 42 days) so the grid is uniform.
 */
export function getMonthDays(year: number, month: number): Date[] {
  const firstDayOfMonth = new Date(year, month, 1, 12)
  const firstDayWeekday = firstDayOfMonth.getDay() // 0 is Sun, 1 is Mon
  const diffToMonday = (firstDayWeekday === 0 ? -6 : 1) - firstDayWeekday

  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(firstDayOfMonth.getDate() + diffToMonday)

  const days: Date[] = []
  const totalDays = 42
  for (let i = 0; i < totalDays; i++) {
    const current = new Date(startDate)
    current.setDate(startDate.getDate() + i)
    days.push(current)
  }

  const fifthWeekLastDay = days[34]
  if (fifthWeekLastDay.getMonth() !== month && fifthWeekLastDay.getDate() >= 7) {
    return days.slice(0, 35)
  }

  return days
}

export function getMonthName(monthIndex: number, length: 'short' | 'long' = 'long', locale: string = 'en-US'): string {
  const date = new Date(2026, monthIndex, 15)
  return date.toLocaleString(locale, { month: length })
}

export function getDayOfWeekShort(date: Date, locale: string = 'en-US'): string {
  return date.toLocaleString(locale, { weekday: 'short' })
}

export function formatDisplayDate(iso: string, locale: string = 'en-US'): string {
  const date = parseIsoDate(iso)
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function format24HourTime(timestamp: number | Date): string {
  const d = typeof timestamp === 'number' ? new Date(timestamp) : timestamp
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function formatShortDate(iso: string, locale: string = 'en-US'): string {
  const date = parseIsoDate(iso)
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

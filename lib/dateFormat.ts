const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Parse a date-only or datetime string without timezone day-shift for YYYY-MM-DD. */
const parseParts = (value: string | Date | null | undefined): { day: number; month: number; year: number; hours?: number; minutes?: number } | null => {
  if (value == null || value === '') return null
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return {
      day: value.getDate(),
      month: value.getMonth(),
      year: value.getFullYear(),
      hours: value.getHours(),
      minutes: value.getMinutes(),
    }
  }

  const raw = String(value).trim()
  if (!raw || raw === 'N/A' || raw === '-') return null

  // YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss...
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/)
  if (iso) {
    return {
      year: Number(iso[1]),
      month: Number(iso[2]) - 1,
      day: Number(iso[3]),
      hours: iso[4] != null ? Number(iso[4]) : undefined,
      minutes: iso[5] != null ? Number(iso[5]) : undefined,
    }
  }

  // Already dd-Mmm-yyyy
  const display = raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/)
  if (display) {
    const monthIdx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === display[2].toLowerCase())
    if (monthIdx >= 0) {
      return { day: Number(display[1]), month: monthIdx, year: Number(display[3]) }
    }
  }

  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return {
    day: d.getDate(),
    month: d.getMonth(),
    year: d.getFullYear(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
  }
}

/** Display dates as dd-Mmm-yyyy (e.g. 18-Jul-2026). */
export const formatDisplayDate = (value: string | Date | null | undefined, empty = ''): string => {
  const parts = parseParts(value)
  if (!parts) return empty
  return `${pad2(parts.day)}-${MONTH_NAMES[parts.month]}-${parts.year}`
}

/** Display datetimes as dd-Mmm-yyyy HH:mm when time is present. */
export const formatDisplayDateTime = (value: string | Date | null | undefined, empty = ''): string => {
  const parts = parseParts(value)
  if (!parts) return empty
  const date = `${pad2(parts.day)}-${MONTH_NAMES[parts.month]}-${parts.year}`
  if (parts.hours == null || parts.minutes == null) return date
  return `${date} ${pad2(parts.hours)}:${pad2(parts.minutes)}`
}

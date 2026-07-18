const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/** All display times use Indian Standard Time. */
export const IST_TIMEZONE = 'Asia/Kolkata'

const pad2 = (n: number) => String(n).padStart(2, '0')

type DateParts = {
  day: number
  month: number
  year: number
  hours?: number
  minutes?: number
}

const getPartsInTimeZone = (date: Date, timeZone: string): DateParts | null => {
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find((p) => p.type === type)?.value
    return value != null ? Number(value) : NaN
  }

  const year = get('year')
  const month = get('month')
  const day = get('day')
  const hours = get('hour')
  const minutes = get('minute')
  if ([year, month, day, hours, minutes].some((n) => Number.isNaN(n))) return null

  return {
    year,
    month: month - 1,
    day,
    hours,
    minutes,
  }
}

/** Today's calendar date in IST as YYYY-MM-DD (for date inputs / defaults). */
export const todayISODateIST = (): string => {
  const parts = getPartsInTimeZone(new Date(), IST_TIMEZONE)
  if (!parts) {
    // Extremely unlikely; fall back to UTC date string
    return new Date().toISOString().split('T')[0]
  }
  return `${parts.year}-${pad2(parts.month + 1)}-${pad2(parts.day)}`
}

/** Format a Date (or parseable instant) as YYYY-MM-DD in IST. */
export const toISODateIST = (value: string | Date | null | undefined): string => {
  if (value == null || value === '') return ''
  if (typeof value === 'string') {
    const dateOnly = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (dateOnly) return dateOnly[0]
  }
  const date = value instanceof Date ? value : new Date(value)
  const parts = getPartsInTimeZone(date, IST_TIMEZONE)
  if (!parts) return ''
  return `${parts.year}-${pad2(parts.month + 1)}-${pad2(parts.day)}`
}

/**
 * Parse for display.
 * - Date-only YYYY-MM-DD / dd-Mmm-yyyy: keep calendar date (no TZ shift).
 * - Date objects & datetimes: convert to IST.
 */
const parseParts = (value: string | Date | null | undefined): DateParts | null => {
  if (value == null || value === '') return null

  if (value instanceof Date) {
    return getPartsInTimeZone(value, IST_TIMEZONE)
  }

  const raw = String(value).trim()
  if (!raw || raw === 'N/A' || raw === '-') return null

  // Already dd-Mmm-yyyy (optional time)
  const display = raw.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})(?:\s+(\d{2}):(\d{2}))?/)
  if (display) {
    const monthIdx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === display[2].toLowerCase())
    if (monthIdx >= 0) {
      return {
        day: Number(display[1]),
        month: monthIdx,
        year: Number(display[3]),
        hours: display[4] != null ? Number(display[4]) : undefined,
        minutes: display[5] != null ? Number(display[5]) : undefined,
      }
    }
  }

  // Date-only YYYY-MM-DD — treat as calendar date, not UTC midnight
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnly) {
    return {
      year: Number(dateOnly[1]),
      month: Number(dateOnly[2]) - 1,
      day: Number(dateOnly[3]),
    }
  }

  // Datetime / ISO with time (with or without Z/offset) → IST
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  return getPartsInTimeZone(date, IST_TIMEZONE)
}

/** Display dates as dd-Mmm-yyyy (e.g. 18-Jul-2026). Instant values use IST. */
export const formatDisplayDate = (value: string | Date | null | undefined, empty = ''): string => {
  const parts = parseParts(value)
  if (!parts) return empty
  return `${pad2(parts.day)}-${MONTH_NAMES[parts.month]}-${parts.year}`
}

/** Display datetimes as dd-Mmm-yyyy HH:mm in IST when time is present. */
export const formatDisplayDateTime = (value: string | Date | null | undefined, empty = ''): string => {
  const parts = parseParts(value)
  if (!parts) return empty
  const date = `${pad2(parts.day)}-${MONTH_NAMES[parts.month]}-${parts.year}`
  if (parts.hours == null || parts.minutes == null) return date
  return `${date} ${pad2(parts.hours)}:${pad2(parts.minutes)} IST`
}

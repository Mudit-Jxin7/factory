import { describe, it, expect } from 'vitest'
import { formatDisplayDate, formatDisplayDateTime } from './dateFormat'

describe('formatDisplayDate', () => {
  it('formats ISO date as dd-Mmm-yyyy', () => {
    expect(formatDisplayDate('2026-07-18')).toBe('18-Jul-2026')
    expect(formatDisplayDate('2026-08-07')).toBe('07-Aug-2026')
  })

  it('formats Date objects', () => {
    expect(formatDisplayDate(new Date(2026, 6, 18))).toBe('18-Jul-2026')
  })

  it('returns empty for blank values', () => {
    expect(formatDisplayDate('')).toBe('')
    expect(formatDisplayDate(null)).toBe('')
    expect(formatDisplayDate(undefined, '—')).toBe('—')
  })

  it('passes through already formatted dates', () => {
    expect(formatDisplayDate('18-Jul-2026')).toBe('18-Jul-2026')
  })
})

describe('formatDisplayDateTime', () => {
  it('includes time when present in ISO string', () => {
    expect(formatDisplayDateTime('2026-07-18T14:05:00')).toBe('18-Jul-2026 14:05')
  })

  it('omits time for date-only values', () => {
    expect(formatDisplayDateTime('2026-07-18')).toBe('18-Jul-2026')
  })
})

import { describe, it, expect } from 'vitest'
import { formatDisplayDate, formatDisplayDateTime, todayISODateIST, toISODateIST } from './dateFormat'

describe('formatDisplayDate', () => {
  it('formats ISO date as dd-Mmm-yyyy', () => {
    expect(formatDisplayDate('2026-07-18')).toBe('18-Jul-2026')
    expect(formatDisplayDate('2026-08-07')).toBe('07-Aug-2026')
  })

  it('formats Date objects in IST', () => {
    // 2026-07-17 20:30 UTC = 2026-07-18 02:00 IST
    expect(formatDisplayDate(new Date('2026-07-17T20:30:00.000Z'))).toBe('18-Jul-2026')
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
  it('converts UTC ISO datetimes to IST', () => {
    // 14:05 UTC = 19:35 IST
    expect(formatDisplayDateTime('2026-07-18T14:05:00.000Z')).toBe('18-Jul-2026 19:35 IST')
  })

  it('omits time for date-only values', () => {
    expect(formatDisplayDateTime('2026-07-18')).toBe('18-Jul-2026')
  })

  it('keeps already-formatted display datetimes', () => {
    expect(formatDisplayDateTime('18-Jul-2026 10:15')).toBe('18-Jul-2026 10:15 IST')
  })
})

describe('todayISODateIST / toISODateIST', () => {
  it('formats an instant as YYYY-MM-DD in IST', () => {
    expect(toISODateIST('2026-07-17T20:30:00.000Z')).toBe('2026-07-18')
  })

  it('passes through date-only strings', () => {
    expect(toISODateIST('2026-07-18')).toBe('2026-07-18')
  })

  it('returns a YYYY-MM-DD string for today', () => {
    expect(todayISODateIST()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

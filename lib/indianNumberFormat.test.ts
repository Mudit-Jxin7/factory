import { describe, it, expect } from 'vitest'
import { formatIndianAmount } from './indianNumberFormat'

describe('formatIndianAmount', () => {
  it('formats with Indian grouping and 2 decimals', () => {
    expect(formatIndianAmount(30)).toBe('30.00')
    expect(formatIndianAmount(1000)).toBe('1,000.00')
    expect(formatIndianAmount(100000)).toBe('1,00,000.00')
    expect(formatIndianAmount(1234567.8)).toBe('12,34,567.80')
  })

  it('accepts string numbers', () => {
    expect(formatIndianAmount('2500.5')).toBe('2,500.50')
  })

  it('returns empty for blank/invalid', () => {
    expect(formatIndianAmount('')).toBe('')
    expect(formatIndianAmount(null, '—')).toBe('—')
    expect(formatIndianAmount('abc')).toBe('')
  })
})

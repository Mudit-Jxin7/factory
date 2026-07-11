import { describe, it, expect } from 'vitest'
import { isAdditionalInfoEmpty } from './additionalInfoExport'

describe('isAdditionalInfoEmpty', () => {
  it('returns true when flyWidth and all additional info fields are empty', () => {
    expect(isAdditionalInfoEmpty({ belt: '', bottom: '' }, '')).toBe(true)
    expect(isAdditionalInfoEmpty(null, undefined)).toBe(true)
  })

  it('returns false when flyWidth has a value', () => {
    expect(isAdditionalInfoEmpty({}, '32')).toBe(false)
  })

  it('returns false when any additional info field has a value', () => {
    expect(isAdditionalInfoEmpty({ belt: 'Leather', bottom: '' }, '')).toBe(false)
  })
})

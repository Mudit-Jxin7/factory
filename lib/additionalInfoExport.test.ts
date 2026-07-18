import { describe, it, expect } from 'vitest'
import { getAdditionalInfoExportRows, isAdditionalInfoEmpty, normalizeAdditionalInfo } from './additionalInfoExport'

describe('normalizeAdditionalInfo', () => {
  it('merges legacy top-level flyWidth when nested flyWidth is empty', () => {
    expect(normalizeAdditionalInfo({ belt: 'Leather' }, '32').flyWidth).toBe('32')
  })

  it('prefers nested flyWidth over legacy', () => {
    expect(normalizeAdditionalInfo({ flyWidth: '28' }, '32').flyWidth).toBe('28')
  })
})

describe('isAdditionalInfoEmpty', () => {
  it('returns true when flyWidth and all additional info fields are empty', () => {
    expect(isAdditionalInfoEmpty({ belt: '', bottom: '' }, '')).toBe(true)
    expect(isAdditionalInfoEmpty(null, undefined)).toBe(true)
  })

  it('returns false when flyWidth has a value', () => {
    expect(isAdditionalInfoEmpty({}, '32')).toBe(false)
    expect(isAdditionalInfoEmpty({ flyWidth: '32' })).toBe(false)
  })

  it('returns false when any additional info field has a value', () => {
    expect(isAdditionalInfoEmpty({ belt: 'Leather', bottom: '' }, '')).toBe(false)
  })
})

describe('getAdditionalInfoExportRows', () => {
  it('returns only fields that have non-empty values', () => {
    expect(getAdditionalInfoExportRows(' 32 ', {
      belt: 'Leather',
      bottom: '',
      pasting: '   ',
      bone: 'Plastic',
    })).toEqual([
      ['Fly Width', '32'],
      ['Belt', 'Leather'],
      ['Bone', 'Plastic'],
    ])
  })

  it('accepts additionalInfo-only call shape', () => {
    expect(getAdditionalInfoExportRows({ flyWidth: '30', belt: 'X' })).toEqual([
      ['Fly Width', '30'],
      ['Belt', 'X'],
    ])
  })

  it('returns an empty array when every field is blank', () => {
    expect(getAdditionalInfoExportRows('', { belt: '', bottom: '  ' })).toEqual([])
    expect(getAdditionalInfoExportRows(undefined, undefined)).toEqual([])
  })
})

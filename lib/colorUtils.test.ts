import { describe, it, expect } from 'vitest'
import { getColorForShade } from './colorUtils'

describe('getColorForShade', () => {
  it('returns neutral gray for undefined input', () => {
    expect(getColorForShade(undefined)).toBe('#e8e8e8')
  })

  it('returns neutral gray for empty string', () => {
    expect(getColorForShade('')).toBe('#e8e8e8')
  })

  it('returns neutral gray for whitespace-only string', () => {
    expect(getColorForShade('   ')).toBe('#e8e8e8')
  })

  it('returns correct hex for known colors', () => {
    expect(getColorForShade('red')).toBe('#e53935')
    expect(getColorForShade('blue')).toBe('#1e88e5')
    expect(getColorForShade('white')).toBe('#ffffff')
    expect(getColorForShade('black')).toBe('#212121')
    expect(getColorForShade('navy')).toBe('#001f3f')
    expect(getColorForShade('green')).toBe('#43a047')
  })

  it('normalizes to lowercase before lookup', () => {
    expect(getColorForShade('RED')).toBe('#e53935')
    expect(getColorForShade('Blue')).toBe('#1e88e5')
    expect(getColorForShade('NAVY')).toBe('#001f3f')
  })

  it('trims surrounding whitespace before lookup', () => {
    expect(getColorForShade('  red  ')).toBe('#e53935')
    expect(getColorForShade('\tblue\t')).toBe('#1e88e5')
  })

  it('strips internal spaces before lookup (e.g. "sky blue" → "skyblue")', () => {
    expect(getColorForShade('sky blue')).toBe('#87ceeb')
    expect(getColorForShade('light blue')).toBe('#add8e6')
    expect(getColorForShade('dark blue')).toBe('#00008b')
  })

  it('treats "grey" and "gray" as the same hex', () => {
    expect(getColorForShade('grey')).toBe(getColorForShade('gray'))
  })

  it('returns fallback gray for unknown color names', () => {
    expect(getColorForShade('unicorn')).toBe('#e0e0e0')
    expect(getColorForShade('fuschia')).toBe('#e0e0e0')
  })

  it('handles all registered color names', () => {
    const knownColors = [
      'red', 'blue', 'beige', 'white', 'black', 'navy', 'grey', 'gray',
      'green', 'yellow', 'orange', 'pink', 'purple', 'brown', 'cream',
      'maroon', 'gold', 'silver', 'lime', 'teal', 'olive', 'coral',
      'salmon', 'lavender', 'mint', 'skyblue', 'lightblue', 'darkblue',
      'peach', 'ivory', 'charcoal',
    ]
    for (const color of knownColors) {
      const result = getColorForShade(color)
      expect(result, `expected a hex for "${color}"`).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

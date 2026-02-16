/**
 * Map common color names to hex for display (e.g. shade swatch).
 * Falls back to CSS named color (lowercase) or a neutral gray.
 */
const COLOR_NAME_TO_HEX: Record<string, string> = {
  red: '#e53935',
  blue: '#1e88e5',
  beige: '#f5f5dc',
  white: '#ffffff',
  black: '#212121',
  navy: '#001f3f',
  grey: '#9e9e9e',
  gray: '#9e9e9e',
  green: '#43a047',
  yellow: '#fdd835',
  orange: '#fb8c00',
  pink: '#ec407a',
  purple: '#8e24aa',
  brown: '#6d4c41',
  cream: '#fffdd0',
  maroon: '#880e4f',
  gold: '#ffd700',
  silver: '#c0c0c0',
  lime: '#c6e048',
  teal: '#00897b',
  olive: '#808000',
  coral: '#ff7f50',
  salmon: '#fa8072',
  lavender: '#e6e6fa',
  mint: '#98ff98',
  skyblue: '#87ceeb',
  lightblue: '#add8e6',
  darkblue: '#00008b',
  peach: '#ffcba4',
  ivory: '#fffff0',
  charcoal: '#36454f',
}

/** Normalize color name for lookup (lowercase, no extra spaces). */
function normalizeColorName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '')
}

/**
 * Return a CSS background color for the given color name (for swatches).
 * Uses a small map of common names; otherwise tries the name as a CSS color; else returns a neutral gray.
 */
export function getColorForShade(colorName: string | undefined): string {
  if (!colorName || !colorName.trim()) return '#e8e8e8'
  const key = normalizeColorName(colorName)
  if (COLOR_NAME_TO_HEX[key]) return COLOR_NAME_TO_HEX[key]
  return '#e0e0e0'
}

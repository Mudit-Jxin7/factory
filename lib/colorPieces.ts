export type ColorPiecesRow = {
  color: string
  totalPieces: number
}

/** Sum pieces + tukda per color from production rows. */
export function aggregatePiecesByColor(
  productionData: Array<{ color?: string; pieces?: number | string; tukda?: number | string }> = []
): ColorPiecesRow[] {
  const map = new Map<string, number>()
  for (const row of productionData) {
    const color = (row.color || '').trim() || '—'
    const total = (Number(row.pieces) || 0) + (Number(row.tukda) || 0)
    map.set(color, (map.get(color) || 0) + total)
  }
  return Array.from(map.entries())
    .map(([color, totalPieces]) => ({ color, totalPieces }))
    .sort((a, b) => a.color.localeCompare(b.color, undefined, { sensitivity: 'base' }))
}

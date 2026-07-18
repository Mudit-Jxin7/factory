export type AnalyticsSection = 'Front' | 'Back' | 'Zip' | 'Astar' | 'Belt'

export interface AnalyticsRow {
  worker_id: number
  worker_name?: string
  worker_full_name: string
  section: AnalyticsSection | string
  date: string
  rate: number
  lotNumber: string
  layer: number
  pieces: number
  total_amount: number
}

/** One row per worker + lot + section (sums pieces/layers/amount across production rows). */
export const aggregateAnalyticsRows = (rows: AnalyticsRow[]): AnalyticsRow[] => {
  const grouped = new Map<string, AnalyticsRow>()

  rows.forEach((row) => {
    const key = `${row.worker_id}|${row.lotNumber}|${row.section}`
    const existing = grouped.get(key)
    if (!existing) {
      grouped.set(key, { ...row })
      return
    }
    existing.pieces += row.pieces
    existing.layer += row.layer
    existing.total_amount += row.total_amount
    // Keep earliest date for the combined work on this lot/section
    if (row.date && (!existing.date || row.date < existing.date)) {
      existing.date = row.date
    }
    // Prefer a non-zero rate if the first row somehow lacked one
    if (!existing.rate && row.rate) existing.rate = row.rate
  })

  return [...grouped.values()]
}

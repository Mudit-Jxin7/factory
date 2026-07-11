'use client'

interface LotSummarySectionProps {
  lot: any
}

export default function LotSummarySection({ lot }: LotSummarySectionProps) {
  const totalTukda = (lot.productionData || []).reduce((sum: number, row: any) => sum + (Number(row.tukda) || 0), 0)
  const tukdaCount = totalTukda || Number(lot.tukda?.count || 0)
  const grandTotal = Number(
    lot.totalPiecesWithTukda ?? (Number(lot.totalPieces || 0) + tukdaCount)
  ).toFixed(2)

  const summaryCards = [
    { icon: '📏', label: 'Total Meter', value: Number(lot.totalMeter || 0).toFixed(2) },
    { icon: '📄', label: 'Total Pieces', value: Number(lot.totalPieces || 0).toFixed(2) },
    { icon: '📊', label: 'Grand Total Pieces', value: grandTotal },
    { icon: '🧮', label: 'Average', value: Number(lot.average || 0).toFixed(4), extra: 'average-value' },
  ]

  return (
    <div className="card">
      <h2>Summary & Calculations</h2>
      <div className="summary-grid">
        <div className="info-item">
          <label># Tukda</label>
          <div className="info-value">{tukdaCount}</div>
        </div>
        <div className="info-item">
          <label>Tukda Size</label>
          <div className="info-value">{lot.tukda?.size || 'N/A'}</div>
        </div>
        {summaryCards.map(({ icon, label, value, extra }) => (
          <div key={label} className="summary-card">
            <div className="summary-icon">{icon}</div>
            <div className="summary-content">
              <div className="summary-label">{label}</div>
              <div className={`summary-value ${extra || ''}`}>{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

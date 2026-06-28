'use client'

const TUKDA_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42', '44']

interface SummarySectionProps {
  tukda: { count: number; size: string }
  totalMeter: number
  totalPieces: number
  totalPiecesWithTukda: number
  average: number
  onTukdaCountChange: (value: string) => void
  onTukdaCountBlur: (value: string) => void
  onTukdaSizeChange: (value: string) => void
}

export default function SummarySection({
  tukda, totalMeter, totalPieces, totalPiecesWithTukda, average,
  onTukdaCountChange, onTukdaCountBlur, onTukdaSizeChange,
}: SummarySectionProps) {
  return (
    <div className="card">
      <h2>Summary & Calculations</h2>
      <div className="tukda-inputs">
        <div className="form-group">
          <label># Tukda</label>
          <input
            type="text" value={tukda.count}
            onChange={(e) => onTukdaCountChange(e.target.value)}
            onBlur={(e) => onTukdaCountBlur(e.target.value)}
            inputMode="numeric" pattern="[0-9]*" placeholder="0"
          />
        </div>
        <div className="form-group">
          <label>Tukda Size</label>
          <select value={tukda.size} onChange={(e) => onTukdaSizeChange(e.target.value)} className="tukda-size-select">
            {TUKDA_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
      </div>
      <div className="summary-cards-row">
        {[
          { icon: '📏', label: 'Total Meter', value: totalMeter.toFixed(2), extra: '' },
          { icon: '📄', label: 'Total Pieces', value: totalPieces.toFixed(2), extra: '' },
          { icon: '📊', label: 'Grand Total Pieces', value: totalPiecesWithTukda.toFixed(2), extra: '' },
          { icon: '🧮', label: 'Average', value: average.toFixed(4), extra: 'average-value' },
        ].map(({ icon, label, value, extra }) => (
          <div key={label} className="summary-card">
            <div className="summary-icon">{icon}</div>
            <div className="summary-content">
              <div className="summary-label">{label}</div>
              <div className={`summary-value ${extra}`}>{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

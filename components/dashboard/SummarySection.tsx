'use client'

import { IconRuler, IconFile, IconChart, IconCalc } from '../Icons'

const TUKDA_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42', '44']

interface SummarySectionProps {
  tukda: { count: number; size: string }
  totalMeter: number
  totalPieces: number
  totalPiecesWithTukda: number
  average: number
  onTukdaSizeChange: (value: string) => void
}

export default function SummarySection({
  tukda, totalMeter, totalPieces, totalPiecesWithTukda, average,
  onTukdaSizeChange,
}: SummarySectionProps) {
  return (
    <div className="card">
      <h2>Summary & Calculations</h2>
      <div className="tukda-inputs">
        <div className="form-group">
          <label># Tukda</label>
          <input
            type="text" value={tukda.count}
            readOnly disabled
            style={{ background: 'var(--color-surface-muted)', cursor: 'not-allowed' }}
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
          { icon: <IconRuler size={20} />, label: 'Total Meter', value: totalMeter.toFixed(2), extra: '' },
          { icon: <IconFile size={20} />, label: 'Total Pieces', value: totalPieces.toFixed(2), extra: '' },
          { icon: <IconChart size={20} />, label: 'Grand Total Pieces', value: totalPiecesWithTukda.toFixed(2), extra: '' },
          { icon: <IconCalc size={20} />, label: 'Average', value: average.toFixed(4), extra: 'average-value' },
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

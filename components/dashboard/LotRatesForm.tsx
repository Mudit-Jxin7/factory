'use client'

import { LotWorkerRates } from '@/lib/types'

const RATE_FIELDS: { key: keyof LotWorkerRates; label: string }[] = [
  { key: 'front', label: 'Front' },
  { key: 'back', label: 'Back' },
  { key: 'zip', label: 'Zip' },
  { key: 'astar', label: 'Astar' },
  { key: 'belt', label: 'Belt' },
]

interface LotRatesFormProps {
  workerRates: LotWorkerRates
  isEditMode?: boolean
  onRateChange: (key: keyof LotWorkerRates, value: string) => void
}

export default function LotRatesForm({
  workerRates,
  isEditMode = true,
  onRateChange,
}: LotRatesFormProps) {
  return (
    <div className="card">
      <h2>Worker Rates</h2>
      <p style={{ margin: '0 0 20px', color: '#6c757d', fontSize: '14px' }}>
        Set rates for Front, Back, Zip, Astar, and Belt. All rates are required and used for workers on the job card.
      </p>
      <div className="form-grid">
        {RATE_FIELDS.map(({ key, label }) => (
          <div key={key} className="form-group">
            <label>{label} Rate *</label>
            <input
              type="number"
              value={workerRates[key]}
              onChange={(e) => onRateChange(key, e.target.value)}
              disabled={!isEditMode}
              placeholder="0.00"
              step="0.01"
              min="0"
              required={isEditMode}
              style={!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { LotWorkerRates } from '@/lib/types'
import { formatIndianAmount } from '@/lib/indianNumberFormat'

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
        Set rates for the roles you need. Only roles with a rate appear as columns on the job card.
      </p>
      <div className="form-grid">
        {RATE_FIELDS.map(({ key, label }) => (
          <div key={key} className="form-group">
            <label>{label} Rate</label>
            {isEditMode ? (
              <input
                type="number"
                value={workerRates[key]}
                onChange={(e) => onRateChange(key, e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            ) : (
              <input
                type="text"
                value={formatIndianAmount(workerRates[key], '—')}
                disabled
                style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

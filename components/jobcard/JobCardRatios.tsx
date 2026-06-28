'use client'

import { Ratios } from '@/lib/types'

interface JobCardRatiosProps {
  ratios: Ratios
  sumOfRatios: number
}

export default function JobCardRatios({ ratios, sumOfRatios }: JobCardRatiosProps) {
  return (
    <div className="card">
      <h2>Ratios</h2>
      <div className="ratios-grid">
        {Object.keys(ratios).map((ratioKey) => (
          <div key={ratioKey} className="form-group">
            <label>{ratioKey.toUpperCase()}</label>
            <input
              type="number"
              value={ratios[ratioKey as keyof Ratios]}
              disabled
              style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
              min="0" step="0.5"
            />
          </div>
        ))}
      </div>
      <div className="ratios-summary">
        <strong>Sum of Ratios: {sumOfRatios.toFixed(2)}</strong>
      </div>
    </div>
  )
}

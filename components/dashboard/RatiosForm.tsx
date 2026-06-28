'use client'

import { Ratios } from '@/lib/types'

interface RatiosFormProps {
  ratios: Ratios
  sumOfRatios: number
  onRatioChange: (key: string, value: string) => void
}

export default function RatiosForm({ ratios, sumOfRatios, onRatioChange }: RatiosFormProps) {
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
              onChange={(e) => onRatioChange(ratioKey, e.target.value)}
              min="0.5" step="0.5"
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

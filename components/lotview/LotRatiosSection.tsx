'use client'

interface LotRatiosSectionProps {
  ratios: Record<string, unknown>
}

export default function LotRatiosSection({ ratios }: LotRatiosSectionProps) {
  const sumOfRatios = Object.values(ratios).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0).toFixed(2)

  return (
    <div className="card">
      <h2>Ratios</h2>
      <div className="ratios-grid">
        {Object.entries(ratios).map(([key, value]) => (
          <div key={key} className="info-item">
            <label>{key.toUpperCase()}</label>
            <div className="info-value">{String(value)}</div>
          </div>
        ))}
      </div>
      <div className="ratios-summary">
        <strong>Sum of Ratios: {sumOfRatios}</strong>
      </div>
    </div>
  )
}

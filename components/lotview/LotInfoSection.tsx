'use client'

interface LotInfoSectionProps {
  lot: any
}

export default function LotInfoSection({ lot }: LotInfoSectionProps) {
  const fields = [
    { label: 'Lot Number', value: lot.lotNumber },
    { label: 'Date', value: lot.date },
    { label: 'Fabric', value: lot.fabric },
    { label: 'Pattern', value: lot.pattern },
    { label: 'Brand', value: lot.brand },
    ...(lot.createdAt ? [{ label: 'Created At', value: new Date(lot.createdAt).toLocaleString() }] : []),
  ]

  return (
    <div className="card">
      <h2>Lot Information</h2>
      <div className="form-grid">
        {fields.map(({ label, value }) => (
          <div key={label} className="info-item">
            <label>{label}</label>
            <div className="info-value">{value || 'N/A'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

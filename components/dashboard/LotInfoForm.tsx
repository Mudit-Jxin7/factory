'use client'

interface LotInfoFormProps {
  lotNumber: string
  date: string
  fabric: string
  pattern: string
  brand: string
  fabrics: any[]
  patterns: any[]
  brands: any[]
  lotNumberError?: string | null
  onLotNumberChange: (v: string) => void
  onLotNumberBlur?: () => void
  onDateChange: (v: string) => void
  onFabricChange: (v: string) => void
  onPatternChange: (v: string) => void
  onBrandChange: (v: string) => void
}

export default function LotInfoForm({
  lotNumber, date, fabric, pattern, brand,
  fabrics, patterns, brands,
  lotNumberError,
  onLotNumberChange, onLotNumberBlur, onDateChange, onFabricChange, onPatternChange, onBrandChange,
}: LotInfoFormProps) {
  return (
    <div className="card">
      <h2>Lot Information</h2>
      <div className="form-grid">
        <div className="form-group">
          <label>Lot Number</label>
          <input
            type="text"
            value={lotNumber}
            onChange={(e) => onLotNumberChange(e.target.value)}
            onBlur={onLotNumberBlur}
            placeholder="Enter lot number"
            style={lotNumberError ? { borderColor: '#dc3545' } : undefined}
          />
          {lotNumberError && (
            <span style={{ color: '#dc3545', fontSize: '13px', marginTop: '4px', display: 'block' }}>
              {lotNumberError}
            </span>
          )}
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Fabric</label>
          <select value={fabric} onChange={(e) => onFabricChange(e.target.value)}>
            <option value="">Select fabric</option>
            {fabrics.map((item: any) => <option key={item._id} value={item.name}>{item.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Pattern</label>
          <select value={pattern} onChange={(e) => onPatternChange(e.target.value)}>
            <option value="">Select pattern</option>
            {patterns.map((item: any) => <option key={item._id} value={item.name}>{item.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Brand</label>
          <select value={brand} onChange={(e) => onBrandChange(e.target.value)}>
            <option value="">Select brand</option>
            {brands.map((item: any) => <option key={item._id} value={item.name}>{item.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

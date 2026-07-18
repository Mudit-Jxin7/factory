'use client'

interface LotsFiltersProps {
  filterDate: string
  filterLotNumber: string
  filterFabric: string
  filterPattern: string
  filterBrand: string
  fabricOptions: string[]
  patternOptions: string[]
  brandOptions: string[]
  onDateChange: (v: string) => void
  onLotNumberChange: (v: string) => void
  onFabricChange: (v: string) => void
  onPatternChange: (v: string) => void
  onBrandChange: (v: string) => void
  onClear: () => void
}

export default function LotsFilters({
  filterDate, filterLotNumber, filterFabric, filterPattern, filterBrand,
  fabricOptions, patternOptions, brandOptions,
  onDateChange, onLotNumberChange, onFabricChange, onPatternChange, onBrandChange, onClear,
}: LotsFiltersProps) {
  return (
    <div className="card filters-card">
      <h3 className="filters-title">Filters</h3>
      <div className="filters-grid">
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={filterDate} onChange={(e) => onDateChange(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Lot Number</label>
          <input type="text" value={filterLotNumber} onChange={(e) => onLotNumberChange(e.target.value)} placeholder="Search lot number…" />
        </div>
        <div className="form-group">
          <label>Fabric</label>
          <select value={filterFabric} onChange={(e) => onFabricChange(e.target.value)}>
            <option value="">All Fabrics</option>
            {fabricOptions.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Pattern</label>
          <select value={filterPattern} onChange={(e) => onPatternChange(e.target.value)}>
            <option value="">All Patterns</option>
            {patternOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Brand</label>
          <select value={filterBrand} onChange={(e) => onBrandChange(e.target.value)}>
            <option value="">All Brands</option>
            {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="filters-actions">
          <button type="button" className="btn btn-secondary" onClick={onClear}>
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  )
}

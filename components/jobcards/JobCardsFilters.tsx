'use client'

import { JOB_CARD_FILTER_STATUSES, JOB_CARD_STATUS_LABELS } from '@/lib/jobCardStatus'

interface JobCardsFiltersProps {
  filterLotNumber: string
  filterDate: string
  filterBrand: string
  filterStatus: string
  brandOptions: string[]
  variant?: 'admin' | 'worker'
  onLotNumberChange: (v: string) => void
  onDateChange: (v: string) => void
  onBrandChange: (v: string) => void
  onStatusChange: (v: string) => void
  onClear: () => void
}

export default function JobCardsFilters({
  filterLotNumber, filterDate, filterBrand, filterStatus, brandOptions,
  onLotNumberChange, onDateChange, onBrandChange, onStatusChange, onClear,
}: JobCardsFiltersProps) {
  return (
    <div className="card filters-card">
      <h3 className="filters-title">Filters</h3>
      <div className="filters-grid">
        <div className="form-group">
          <label>Lot Number</label>
          <input type="text" value={filterLotNumber} onChange={(e) => onLotNumberChange(e.target.value)} placeholder="Search lot number…" />
        </div>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={filterDate} onChange={(e) => onDateChange(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Brand</label>
          <select value={filterBrand} onChange={(e) => onBrandChange(e.target.value)}>
            <option value="">All Brands</option>
            {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select value={filterStatus} onChange={(e) => onStatusChange(e.target.value)}>
            <option value="">All Statuses</option>
            {JOB_CARD_FILTER_STATUSES.map((status) => (
              <option key={status} value={status}>{JOB_CARD_STATUS_LABELS[status]}</option>
            ))}
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

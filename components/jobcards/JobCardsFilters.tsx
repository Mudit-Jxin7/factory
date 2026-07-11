'use client'

import { ADMIN_FILTER_STATUSES, getJobCardDisplayStatus, JOB_CARD_DISPLAY_STATUS_LABELS } from '@/lib/jobCardStatus'

const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', backgroundColor: '#fff' }
const labelStyle = { marginBottom: '8px', display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }

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
  filterLotNumber, filterDate, filterBrand, filterStatus, brandOptions, variant = 'admin',
  onLotNumberChange, onDateChange, onBrandChange, onStatusChange, onClear,
}: JobCardsFiltersProps) {
  const statusOptions = variant === 'admin'
    ? ADMIN_FILTER_STATUSES
    : ADMIN_FILTER_STATUSES.filter((status) => status !== 'rate_pending' && status !== 'pending_approval')
  return (
    <div className="card" style={{ marginBottom: '20px', padding: '20px', background: '#fff9e6' }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px', fontWeight: '600', color: '#1a1a1a' }}>Filters</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={labelStyle}>Lot Number</label>
          <input type="text" value={filterLotNumber} onChange={(e) => onLotNumberChange(e.target.value)} placeholder="Search lot number…" style={inputStyle} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={labelStyle}>Date</label>
          <input type="date" value={filterDate} onChange={(e) => onDateChange(e.target.value)} style={inputStyle} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={labelStyle}>Brand</label>
          <select value={filterBrand} onChange={(e) => onBrandChange(e.target.value)} style={inputStyle}>
            <option value="">All Brands</option>
            {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={labelStyle}>Status</label>
          <select value={filterStatus} onChange={(e) => onStatusChange(e.target.value)} style={inputStyle}>
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{JOB_CARD_DISPLAY_STATUS_LABELS[status]}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'end' }}>
          <button className="btn btn-secondary" onClick={onClear} style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}>
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  )
}

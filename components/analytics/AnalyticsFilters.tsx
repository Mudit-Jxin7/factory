'use client'

interface AnalyticsFiltersProps {
  workers: any[]
  fromDate: string
  toDate: string
  selectedWorker: string
  onFromDateChange: (v: string) => void
  onToDateChange: (v: string) => void
  onWorkerChange: (v: string) => void
  onApplyFilters: () => void
  onClearFilters: () => void
  onDateRangePreset: (days: number) => void
}

const inputStyle = {
  width: '100%', padding: '10px', border: '1px solid #ddd',
  borderRadius: '6px', fontSize: '16px', backgroundColor: '#fff',
}

export default function AnalyticsFilters({
  workers, fromDate, toDate, selectedWorker,
  onFromDateChange, onToDateChange, onWorkerChange, onApplyFilters, onClearFilters, onDateRangePreset,
}: AnalyticsFiltersProps) {
  return (
    <div className="card filters-section" style={{ marginBottom: '20px', padding: '20px', background: '#fff9e6' }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Filters</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-secondary" onClick={() => onDateRangePreset(7)} style={{ padding: '8px 16px', fontSize: '14px' }}>
          Last 7 Days
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => onDateRangePreset(30)} style={{ padding: '8px 16px', fontSize: '14px' }}>
          Last 30 Days
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', alignItems: 'end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>From Date</label>
          <input type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} style={inputStyle} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>To Date</label>
          <input type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)} style={inputStyle} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Worker</label>
          <select value={selectedWorker} onChange={(e) => onWorkerChange(e.target.value)} style={inputStyle}>
            <option value="">All Workers</option>
            {workers.map((worker: any) => (
              <option key={worker._id} value={worker._id}>
                {worker.worker_id} - {worker.worker_full_name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'end', gap: '10px' }}>
          <button className="btn btn-primary" onClick={onApplyFilters} style={{ padding: '10px 20px', fontSize: '16px', whiteSpace: 'nowrap' }}>
            Apply Filters
          </button>
          <button className="btn btn-secondary" onClick={onClearFilters} style={{ padding: '10px 20px', fontSize: '16px', whiteSpace: 'nowrap' }}>
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  )
}

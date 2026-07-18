'use client'

import { useMemo, useState } from 'react'

const ROLE_OPTIONS = ['Front', 'Back', 'Zip', 'Astar', 'Belt'] as const

interface AnalyticsFiltersProps {
  workers: any[]
  fromDate: string
  toDate: string
  selectedWorker: string
  selectedRole: string
  onFromDateChange: (v: string) => void
  onToDateChange: (v: string) => void
  onWorkerChange: (v: string) => void
  onRoleChange: (v: string) => void
  onApplyFilters: () => void
  onClearFilters: () => void
  onDateRangePreset: (days: number) => void
}

const inputStyle = {
  width: '100%', padding: '10px', border: '1px solid #ddd',
  borderRadius: '6px', fontSize: '16px', backgroundColor: '#fff',
}

export default function AnalyticsFilters({
  workers, fromDate, toDate, selectedWorker, selectedRole,
  onFromDateChange, onToDateChange, onWorkerChange, onRoleChange,
  onApplyFilters, onClearFilters, onDateRangePreset,
}: AnalyticsFiltersProps) {
  const [workerSearch, setWorkerSearch] = useState('')

  const filteredWorkers = useMemo(() => {
    const q = workerSearch.trim().toLowerCase()
    if (!q) return workers
    return workers.filter((w: any) =>
      String(w.worker_id ?? '').toLowerCase().includes(q)
      || String(w.worker_full_name ?? '').toLowerCase().includes(q)
    )
  }, [workers, workerSearch])

  const handleWorkerSearchChange = (value: string) => {
    setWorkerSearch(value)
    const q = value.trim().toLowerCase()
    if (!q) return
    const stillVisible = workers.some((w: any) => {
      if (w._id !== selectedWorker) return false
      return String(w.worker_id ?? '').toLowerCase().includes(q)
        || String(w.worker_full_name ?? '').toLowerCase().includes(q)
    })
    if (selectedWorker && !stillVisible) onWorkerChange('')
  }

  const handleWorkerSelect = (value: string) => {
    onWorkerChange(value)
  }

  const handleClear = () => {
    setWorkerSearch('')
    onClearFilters()
  }

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '15px', alignItems: 'end' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="text"
              value={workerSearch}
              onChange={(e) => handleWorkerSearchChange(e.target.value)}
              placeholder="Search name or ID…"
              style={inputStyle}
            />
            <select value={selectedWorker} onChange={(e) => handleWorkerSelect(e.target.value)} style={inputStyle}>
              <option value="">All Workers</option>
              {filteredWorkers.map((worker: any) => (
                <option key={worker._id} value={worker._id}>
                  {worker.worker_id} - {worker.worker_full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Role</label>
          <select value={selectedRole} onChange={(e) => onRoleChange(e.target.value)} style={inputStyle}>
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'end', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onApplyFilters} style={{ padding: '10px 20px', fontSize: '16px', whiteSpace: 'nowrap', flex: '1 1 auto' }}>
            Apply Filters
          </button>
          <button className="btn btn-secondary" onClick={handleClear} style={{ padding: '10px 20px', fontSize: '16px', whiteSpace: 'nowrap', flex: '1 1 auto' }}>
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  )
}

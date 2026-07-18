'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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

const workerLabel = (w: any) => `${w.worker_id} - ${w.worker_full_name}`

export default function AnalyticsFilters({
  workers, fromDate, toDate, selectedWorker, selectedRole,
  onFromDateChange, onToDateChange, onWorkerChange, onRoleChange,
  onApplyFilters, onClearFilters, onDateRangePreset,
}: AnalyticsFiltersProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(
    () => workers.find((w: any) => w._id === selectedWorker) || null,
    [workers, selectedWorker],
  )

  // Keep input text in sync when selection changes from outside (e.g. clear)
  useEffect(() => {
    if (!open) setQuery(selected ? workerLabel(selected) : '')
  }, [selected, open])

  const filteredWorkers = useMemo(() => {
    const q = query.trim().toLowerCase()
    // When a worker is already selected and the box shows their label, show full list on open
    if (selected && query === workerLabel(selected)) return workers
    if (!q) return workers
    return workers.filter((w: any) =>
      String(w.worker_id ?? '').toLowerCase().includes(q)
      || String(w.worker_full_name ?? '').toLowerCase().includes(q)
    )
  }, [workers, query, selected])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const pickWorker = (id: string) => {
    onWorkerChange(id)
    const w = workers.find((x: any) => x._id === id)
    setQuery(w ? workerLabel(w) : '')
    setOpen(false)
  }

  const pickAll = () => {
    onWorkerChange('')
    setQuery('')
    setOpen(false)
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    setOpen(true)
    if (!value.trim()) onWorkerChange('')
  }

  const handleClear = () => {
    setQuery('')
    setOpen(false)
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
        <div className="form-group" style={{ marginBottom: 0 }} ref={wrapRef}>
          <label>Worker</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder="All Workers — search name or ID…"
              style={inputStyle}
              autoComplete="off"
            />
            {open && (
              <ul
                style={{
                  position: 'absolute', left: 0, right: 0, top: '100%', margin: '4px 0 0',
                  padding: '4px 0', listStyle: 'none', background: '#fff',
                  border: '1px solid #ddd', borderRadius: '6px',
                  maxHeight: '220px', overflowY: 'auto', zIndex: 20,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                <li>
                  <button
                    type="button"
                    onClick={pickAll}
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none',
                      background: !selectedWorker ? '#fff3cd' : 'transparent',
                      cursor: 'pointer', fontSize: '15px',
                    }}
                  >
                    All Workers
                  </button>
                </li>
                {filteredWorkers.length === 0 ? (
                  <li style={{ padding: '10px 12px', color: '#6c757d', fontSize: '14px' }}>No workers found</li>
                ) : filteredWorkers.map((worker: any) => (
                  <li key={worker._id}>
                    <button
                      type="button"
                      onClick={() => pickWorker(worker._id)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none',
                        background: selectedWorker === worker._id ? '#fff3cd' : 'transparent',
                        cursor: 'pointer', fontSize: '15px',
                      }}
                    >
                      {workerLabel(worker)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
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

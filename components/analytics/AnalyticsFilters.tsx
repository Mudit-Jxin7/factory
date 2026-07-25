'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const ROLE_OPTIONS = ['Front', 'Back', 'Zip', 'Astar', 'Belt'] as const

interface AnalyticsFiltersProps {
  workers: any[]
  fromDate: string
  toDate: string
  selectedWorker: string
  selectedRole: string
  lotNumber: string
  onFromDateChange: (v: string) => void
  onToDateChange: (v: string) => void
  onWorkerChange: (v: string) => void
  onRoleChange: (v: string) => void
  onLotNumberChange: (v: string) => void
  onApplyFilters: () => void
  onClearFilters: () => void
  onDateRangePreset: (days: number) => void
}

const workerLabel = (w: any) => `${w.worker_id} - ${w.worker_full_name}`

export default function AnalyticsFilters({
  workers, fromDate, toDate, selectedWorker, selectedRole, lotNumber,
  onFromDateChange, onToDateChange, onWorkerChange, onRoleChange, onLotNumberChange,
  onApplyFilters, onClearFilters, onDateRangePreset,
}: AnalyticsFiltersProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(
    () => workers.find((w: any) => w._id === selectedWorker) || null,
    [workers, selectedWorker],
  )

  useEffect(() => {
    if (!open) setQuery(selected ? workerLabel(selected) : '')
  }, [selected, open])

  const filteredWorkers = useMemo(() => {
    const q = query.trim().toLowerCase()
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
    <div className="card filters-card filters-section">
      <h3 className="filters-title">Filters</h3>
      <div className="filters-presets">
        <button type="button" className="btn btn-secondary" onClick={() => onDateRangePreset(7)}>
          Last 7 Days
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => onDateRangePreset(30)}>
          Last 30 Days
        </button>
      </div>
      <div className="filters-grid filters-grid--wide">
        <div className="form-group">
          <label>From Date</label>
          <input type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} />
        </div>
        <div className="form-group">
          <label>To Date</label>
          <input type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)} />
        </div>
        <div className="form-group" ref={wrapRef}>
          <label>Worker</label>
          <div className="filters-dropdown">
            <input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder="All Workers — search name or ID…"
              autoComplete="off"
            />
            {open && (
              <ul className="filters-dropdown-list">
                <li>
                  <button
                    type="button"
                    className={`filters-dropdown-item${!selectedWorker ? ' active' : ''}`}
                    onClick={pickAll}
                  >
                    All Workers
                  </button>
                </li>
                {filteredWorkers.length === 0 ? (
                  <li className="filters-dropdown-empty">No workers found</li>
                ) : filteredWorkers.map((worker: any) => (
                  <li key={worker._id}>
                    <button
                      type="button"
                      className={`filters-dropdown-item${selectedWorker === worker._id ? ' active' : ''}`}
                      onClick={() => pickWorker(worker._id)}
                    >
                      {workerLabel(worker)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="form-group">
          <label>Lot Number</label>
          <input
            type="text"
            value={lotNumber}
            onChange={(e) => onLotNumberChange(e.target.value)}
            placeholder="Search lot number…"
          />
        </div>
        <div className="form-group">
          <label>Role</label>
          <select value={selectedRole} onChange={(e) => onRoleChange(e.target.value)}>
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <div className="filters-actions">
          <button type="button" className="btn btn-primary" onClick={onApplyFilters}>
            Apply Filters
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleClear}>
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  )
}

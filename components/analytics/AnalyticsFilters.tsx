'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const ROLE_OPTIONS = ['Front', 'Back', 'Zip', 'Astar', 'Belt'] as const

interface AnalyticsFiltersProps {
  workers: any[]
  lotOptions: string[]
  roleOptions?: string[]
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
  workers, lotOptions, roleOptions, fromDate, toDate, selectedWorker, selectedRole, lotNumber,
  onFromDateChange, onToDateChange, onWorkerChange, onRoleChange, onLotNumberChange,
  onApplyFilters, onClearFilters, onDateRangePreset,
}: AnalyticsFiltersProps) {
  const roles = roleOptions && roleOptions.length > 0 ? roleOptions : [...ROLE_OPTIONS]
  const [workerOpen, setWorkerOpen] = useState(false)
  const [workerQuery, setWorkerQuery] = useState('')
  const workerWrapRef = useRef<HTMLDivElement>(null)

  const [lotOpen, setLotOpen] = useState(false)
  const [lotQuery, setLotQuery] = useState('')
  const lotWrapRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(
    () => workers.find((w: any) => w._id === selectedWorker) || null,
    [workers, selectedWorker],
  )

  useEffect(() => {
    if (!workerOpen) setWorkerQuery(selected ? workerLabel(selected) : '')
  }, [selected, workerOpen])

  useEffect(() => {
    if (!lotOpen) setLotQuery(lotNumber || '')
  }, [lotNumber, lotOpen])

  const filteredWorkers = useMemo(() => {
    const q = workerQuery.trim().toLowerCase()
    if (selected && workerQuery === workerLabel(selected)) return workers
    if (!q) return workers
    return workers.filter((w: any) =>
      String(w.worker_id ?? '').toLowerCase().includes(q)
      || String(w.worker_full_name ?? '').toLowerCase().includes(q)
    )
  }, [workers, workerQuery, selected])

  const filteredLots = useMemo(() => {
    const q = lotQuery.trim().toLowerCase()
    if (lotNumber && lotQuery === lotNumber) return lotOptions
    if (!q) return lotOptions
    return lotOptions.filter((lot) => lot.toLowerCase().includes(q))
  }, [lotOptions, lotQuery, lotNumber])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!workerWrapRef.current?.contains(e.target as Node)) setWorkerOpen(false)
      if (!lotWrapRef.current?.contains(e.target as Node)) setLotOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const pickWorker = (id: string) => {
    onWorkerChange(id)
    const w = workers.find((x: any) => x._id === id)
    setWorkerQuery(w ? workerLabel(w) : '')
    setWorkerOpen(false)
  }

  const pickAllWorkers = () => {
    onWorkerChange('')
    setWorkerQuery('')
    setWorkerOpen(false)
  }

  const handleWorkerInputChange = (value: string) => {
    setWorkerQuery(value)
    setWorkerOpen(true)
    if (!value.trim()) onWorkerChange('')
  }

  const pickLot = (lot: string) => {
    onLotNumberChange(lot)
    setLotQuery(lot)
    setLotOpen(false)
  }

  const pickAllLots = () => {
    onLotNumberChange('')
    setLotQuery('')
    setLotOpen(false)
  }

  const handleLotInputChange = (value: string) => {
    setLotQuery(value)
    setLotOpen(true)
    onLotNumberChange(value)
  }

  const handleClear = () => {
    setWorkerQuery('')
    setWorkerOpen(false)
    setLotQuery('')
    setLotOpen(false)
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
        <div className="form-group" ref={workerWrapRef}>
          <label>Worker</label>
          <div className="filters-dropdown">
            <input
              type="text"
              value={workerQuery}
              onChange={(e) => handleWorkerInputChange(e.target.value)}
              onFocus={() => setWorkerOpen(true)}
              placeholder="All Workers — search name or ID…"
              autoComplete="off"
            />
            {workerOpen && (
              <ul className="filters-dropdown-list">
                <li>
                  <button
                    type="button"
                    className={`filters-dropdown-item${!selectedWorker ? ' active' : ''}`}
                    onClick={pickAllWorkers}
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
        <div className="form-group" ref={lotWrapRef}>
          <label>Lot Number</label>
          <div className="filters-dropdown">
            <input
              type="text"
              value={lotQuery}
              onChange={(e) => handleLotInputChange(e.target.value)}
              onFocus={() => setLotOpen(true)}
              placeholder="All Lots — search lot number…"
              autoComplete="off"
            />
            {lotOpen && (
              <ul className="filters-dropdown-list">
                <li>
                  <button
                    type="button"
                    className={`filters-dropdown-item${!lotNumber ? ' active' : ''}`}
                    onClick={pickAllLots}
                  >
                    All Lots
                  </button>
                </li>
                {filteredLots.length === 0 ? (
                  <li className="filters-dropdown-empty">No lots found</li>
                ) : filteredLots.map((lot) => (
                  <li key={lot}>
                    <button
                      type="button"
                      className={`filters-dropdown-item${lotNumber === lot ? ' active' : ''}`}
                      onClick={() => pickLot(lot)}
                    >
                      {lot}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="form-group">
          <label>Role</label>
          <select value={selectedRole} onChange={(e) => onRoleChange(e.target.value)}>
            <option value="">All Roles</option>
            {roles.map((role) => (
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

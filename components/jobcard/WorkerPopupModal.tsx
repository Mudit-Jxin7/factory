'use client'

import { WorkerField, FIELD_LABELS, filterWorkersForField, getWorkerRole } from './constants'
import { Worker } from '@/lib/types'

interface WorkerPopupModalProps {
  field: WorkerField
  workers: Worker[]
  popupWorker: string
  popupDate: string
  popupRate: string
  onWorkerChange: (value: string) => void
  onDateChange: (value: string) => void
  onRateChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  hideRate?: boolean
}

const inputStyle = {
  width: '100%', padding: '8px', border: '1px solid #ddd',
  borderRadius: '4px', fontSize: '16px',
}

export default function WorkerPopupModal({
  field, workers, popupWorker, popupDate, popupRate,
  onWorkerChange, onDateChange, onRateChange, onSave, onCancel, hideRate = false,
}: WorkerPopupModalProps) {
  const today = new Date().toISOString().split('T')[0]
  const eligibleWorkers = filterWorkersForField(workers, field, popupWorker)

  const handleWorkerChange = (value: string) => {
    onWorkerChange(value)
    if (value && (!popupDate || hideRate)) {
      onDateChange(today)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onCancel}
    >
      <div
        style={{ background: '#fff', padding: '24px', borderRadius: '8px', minWidth: '320px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: '20px' }}>
          {FIELD_LABELS[field]} — Worker / Date{hideRate ? '' : ' / Rate'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Worker</label>
            <select value={popupWorker} onChange={(e) => handleWorkerChange(e.target.value)} style={inputStyle}>
              <option value="">Select worker</option>
              {eligibleWorkers.map((w) => {
                const role = getWorkerRole(w)
                return (
                  <option key={w._id} value={w._id}>
                    {w.worker_id} - {w.worker_full_name}{role ? ` (${role})` : ''}
                  </option>
                )
              })}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Date</label>
            <input
              type="date"
              value={hideRate ? today : popupDate}
              onChange={(e) => onDateChange(e.target.value)}
              disabled={hideRate}
              style={{ ...inputStyle, ...(hideRate ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}) }}
            />
          </div>
          {!hideRate && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Rate</label>
              <input
                type="number" value={popupRate}
                readOnly disabled
                placeholder="Rate" step="0.01" min="0"
                style={{ ...inputStyle, background: '#f8f9fa', cursor: 'not-allowed' }}
              />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

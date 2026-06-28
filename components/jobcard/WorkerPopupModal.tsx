'use client'

import { WorkerField, FIELD_LABELS } from './constants'
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
}

const inputStyle = {
  width: '100%', padding: '8px', border: '1px solid #ddd',
  borderRadius: '4px', fontSize: '16px',
}

export default function WorkerPopupModal({
  field, workers, popupWorker, popupDate, popupRate,
  onWorkerChange, onDateChange, onRateChange, onSave, onCancel,
}: WorkerPopupModalProps) {
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
          {FIELD_LABELS[field]} — Worker / Date / Rate
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Worker</label>
            <select value={popupWorker} onChange={(e) => onWorkerChange(e.target.value)} style={inputStyle}>
              <option value="">Select worker</option>
              {workers.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.worker_id} - {w.worker_full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Date</label>
            <input type="date" value={popupDate} onChange={(e) => onDateChange(e.target.value)} style={inputStyle} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Rate</label>
            <input
              type="number" value={popupRate}
              onChange={(e) => onRateChange(e.target.value)}
              placeholder="Rate" step="0.01" min="0" style={inputStyle}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

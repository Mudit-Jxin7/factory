'use client'

import { Worker } from '@/lib/types'
import { WorkerPrices } from '@/lib/jobCardWorkerPrices'
import { getWorkerRole } from './constants'

interface JobCardWorkerPricesProps {
  workers: Worker[]
  workerPrices: WorkerPrices
  isEditMode: boolean
  saving?: boolean
  onPriceChange: (workerId: string, rate: string) => void
  onSavePrices: () => void
}

const inputStyle = {
  width: '100%', padding: '8px', border: '1px solid #ddd',
  borderRadius: '4px', fontSize: '16px',
}

export default function JobCardWorkerPrices({
  workers, workerPrices, isEditMode, saving, onPriceChange, onSavePrices,
}: JobCardWorkerPricesProps) {
  const sortedWorkers = [...workers].sort((a, b) => a.worker_id - b.worker_id)

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Worker Prices</h2>
          <p style={{ margin: '6px 0 0', color: '#6c757d', fontSize: '14px' }}>
            Set rate by worker ID. Assigned workers in production data will use these rates automatically.
          </p>
        </div>
        {isEditMode && (
          <button className="btn btn-primary" onClick={onSavePrices} disabled={saving} style={{ padding: '8px 16px' }}>
            {saving ? 'Saving…' : 'Save Prices'}
          </button>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="production-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Worker ID</th>
              <th>Worker Name</th>
              <th style={{ width: '120px' }}>Role</th>
              <th style={{ width: '160px' }}>Rate</th>
            </tr>
          </thead>
          <tbody>
            {sortedWorkers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#6c757d' }}>
                  No workers found
                </td>
              </tr>
            ) : sortedWorkers.map((worker) => {
              const workerId = String(worker.worker_id)
              const role = getWorkerRole(worker)
              return (
                <tr key={worker._id}>
                  <td style={{ fontWeight: 600 }}>{worker.worker_id}</td>
                  <td>{worker.worker_full_name}</td>
                  <td>{role || '—'}</td>
                  <td>
                    <input
                      type="number"
                      value={workerPrices[workerId] ?? ''}
                      onChange={(e) => onPriceChange(workerId, e.target.value)}
                      disabled={!isEditMode}
                      placeholder="Rate"
                      step="0.01"
                      min="0"
                      style={{ ...inputStyle, ...(!isEditMode ? { background: '#f8f9fa', cursor: 'not-allowed' } : {}) }}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { getColorForShade } from '@/lib/colorUtils'
import { JobCardProductionRow, Worker } from '@/lib/types'
import { WorkerField } from './constants'

interface JobCardProductionTableProps {
  productionData: JobCardProductionRow[]
  workers: Worker[]
  isEditMode: boolean
  onOpenWorkerPopup: (rowIndex: number, field: WorkerField) => void
}

const WORKER_FIELDS: WorkerField[] = ['front', 'back', 'zip', 'astar', 'beltProd', 'add1', 'add2']
const WORKER_COL_LABELS: Record<WorkerField, string> = {
  front: 'Front', back: 'Back', zip: 'Zip', astar: 'Astar',
  beltProd: 'Belt', add1: 'Additional 1', add2: 'Additional 2',
}

const workerBtnStyle = (isEditMode: boolean) => ({
  width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px',
  fontSize: '16px', textAlign: 'left' as const,
  background: !isEditMode ? '#f8f9fa' : '#fff',
  cursor: !isEditMode ? 'not-allowed' : 'pointer',
})

export default function JobCardProductionTable({
  productionData, workers, isEditMode, onOpenWorkerPopup,
}: JobCardProductionTableProps) {
  const getWorkerName = (workerId: string) => {
    if (!workerId) return ''
    const w = workers.find((x) => x._id === workerId)
    return w ? (w.worker_full_name || String(w.worker_id)) : ''
  }

  return (
    <div className="card">
      <div className="card-header"><h2>Production Data</h2></div>
      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table className="production-table" style={{ minWidth: '1400px' }}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>S.No</th>
              <th>Layer</th><th>Pieces</th><th>Color</th><th>Shade</th>
              {WORKER_FIELDS.map((f) => (
                <th key={f} style={{ width: '220px', minWidth: '220px' }}>{WORKER_COL_LABELS[f]}</th>
              ))}
              <th style={{ width: '100px' }}>Zip Code</th>
              <th style={{ width: '100px' }}>Thread Code</th>
            </tr>
          </thead>
          <tbody>
            {productionData.map((row, index) => (
              <tr key={index}>
                <td style={{ textAlign: 'center' }}>{row.serialNumber}</td>
                <td>
                  <input type="text" value={row.layer} disabled className="production-table input"
                    style={{ width: '60px', background: '#f8f9fa', cursor: 'not-allowed' }} />
                </td>
                <td>
                  <input type="number" value={row.pieces} disabled className="production-table input"
                    style={{ width: '80px', background: '#f8f9fa', cursor: 'not-allowed' }} />
                </td>
                <td><span style={{ fontSize: '16px', color: '#1a1a1a' }}>{row.color || '—'}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', minHeight: '36px' }}>
                    {row.color ? (
                      <div title={row.color} style={{
                        width: '24px', height: '24px', borderRadius: '4px',
                        backgroundColor: getColorForShade(row.color), border: '1px solid #ccc',
                      }} />
                    ) : <span style={{ fontSize: '16px', color: '#6c757d' }}>—</span>}
                  </div>
                </td>
                {WORKER_FIELDS.map((field) => {
                  const workerKey = `${field}Worker` as keyof JobCardProductionRow
                  return (
                    <td key={field} style={{ width: '240px', minWidth: '240px' }}>
                      <button
                        type="button"
                        onClick={() => isEditMode && onOpenWorkerPopup(index, field)}
                        disabled={!isEditMode}
                        className="tbd-input"
                        style={workerBtnStyle(isEditMode)}
                      >
                        {getWorkerName(String(row[workerKey] ?? ''))}
                      </button>
                    </td>
                  )
                })}
                <td style={{ width: '70px', minWidth: '70px' }}>
                  <input type="text" value={row.zip_code ?? ''} readOnly disabled className="tbd-input"
                    style={{ background: '#f8f9fa', cursor: 'not-allowed', width: '100%' }} placeholder="Zip Code" />
                </td>
                <td style={{ width: '70px', minWidth: '70px' }}>
                  <input type="text" value={row.thread_code ?? ''} readOnly disabled className="tbd-input"
                    style={{ background: '#f8f9fa', cursor: 'not-allowed', width: '100%' }} placeholder="Thread Code" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

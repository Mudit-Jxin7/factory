'use client'

import { getColorForShade } from '@/lib/colorUtils'
import { JobCardProductionRow, LotWorkerRates, Worker } from '@/lib/types'
import { getLotRateForField } from '@/lib/lotWorkerRates'
import { WorkerField } from './constants'

interface JobCardProductionTableProps {
  productionData: JobCardProductionRow[]
  workers: Worker[]
  isEditMode: boolean
  onOpenWorkerPopup: (rowIndex: number, field: WorkerField) => void
  hideRate?: boolean
  workerRates?: LotWorkerRates | null
  /** When true for a cell, it stays read-only even in edit mode (already saved by worker). */
  isCellLocked?: (rowIndex: number, field: WorkerField) => boolean
}

const WORKER_FIELDS: WorkerField[] = ['front', 'back', 'zip', 'astar', 'beltProd', 'add1', 'add2']
const WORKER_COL_LABELS: Record<WorkerField, string> = {
  front: 'Front', back: 'Back', zip: 'Zip', astar: 'Astar',
  beltProd: 'Belt', add1: 'Additional 1', add2: 'Additional 2',
}

const workerBtnStyle = (editable: boolean, locked: boolean) => ({
  width: '100%', padding: '8px 12px', border: `1px solid ${locked ? '#ced4da' : '#ddd'}`, borderRadius: '4px',
  fontSize: '16px', textAlign: 'left' as const,
  background: !editable || locked ? '#f1f3f5' : '#fff',
  cursor: !editable || locked ? 'not-allowed' : 'pointer',
  color: locked ? '#495057' : undefined,
})

export default function JobCardProductionTable({
  productionData, workers, isEditMode, onOpenWorkerPopup, hideRate = false, workerRates, isCellLocked,
}: JobCardProductionTableProps) {
  const getWorkerName = (workerId: string) => {
    if (!workerId) return ''
    const w = workers.find((x) => x._id === workerId)
    return w ? (w.worker_full_name || String(w.worker_id)) : ''
  }

  const getColumnLabel = (field: WorkerField) => {
    const base = WORKER_COL_LABELS[field]
    const rate = getLotRateForField(workerRates, field)
    return rate ? `${base} (Rs - ${rate})` : base
  }

  const getWorkerCellLabel = (row: JobCardProductionRow, field: WorkerField) => {
    const workerKey = `${field}Worker` as keyof JobCardProductionRow
    const rateKey = `${field}Rate` as keyof JobCardProductionRow
    const dateKey = `${field}Date` as keyof JobCardProductionRow
    const name = getWorkerName(String(row[workerKey] ?? ''))
    if (!name) return ''
    const rate = String(row[rateKey] ?? '')
    const date = String(row[dateKey] ?? '')
    const parts = [name]
    if (!hideRate && rate) parts.push(rate)
    if (date) parts.push(date)
    return parts.join(' - ')
  }

  return (
    <div className="card">
      <div className="card-header"><h2>Production Data</h2></div>
      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table className="production-table" style={{ minWidth: '1400px' }}>
          <thead>
            <tr>
              <th style={{ width: '48px', minWidth: '48px', maxWidth: '48px' }}>S.No</th>
              <th style={{ width: '56px', minWidth: '56px', maxWidth: '56px' }}>Layer</th>
              <th style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}>Pieces</th>
              <th style={{ width: '72px', minWidth: '72px', maxWidth: '90px' }}>Color</th>
              <th style={{ width: '48px', minWidth: '48px', maxWidth: '48px' }}>Shade</th>
              {WORKER_FIELDS.map((f) => (
                <th key={f} style={{ width: '220px', minWidth: '220px' }}>{getColumnLabel(f)}</th>
              ))}
              <th style={{ width: '80px', minWidth: '80px' }}>Zip Code</th>
              <th style={{ width: '80px', minWidth: '80px' }}>Thread Code</th>
            </tr>
          </thead>
          <tbody>
            {productionData.map((row, index) => (
              <tr key={index}>
                <td style={{ textAlign: 'center', width: '48px', maxWidth: '48px' }}>{row.serialNumber}</td>
                <td style={{ width: '56px', maxWidth: '56px', padding: '6px 4px' }}>
                  <input type="text" value={row.layer} disabled className="production-table input"
                    style={{ width: '100%', maxWidth: '48px', padding: '6px 4px', background: '#f8f9fa', cursor: 'not-allowed', textAlign: 'center' }} />
                </td>
                <td style={{ width: '64px', maxWidth: '64px', padding: '6px 4px' }}>
                  <input type="number" value={row.pieces} disabled className="production-table input"
                    style={{ width: '100%', maxWidth: '56px', padding: '6px 4px', background: '#f8f9fa', cursor: 'not-allowed', textAlign: 'center' }} />
                </td>
                <td style={{ width: '72px', maxWidth: '90px', fontSize: '14px' }}>
                  <span style={{ color: '#1a1a1a' }}>{row.color || '—'}</span>
                </td>
                <td style={{ width: '48px', maxWidth: '48px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '36px' }}>
                    {row.color ? (
                      <div title={row.color} style={{
                        width: '24px', height: '24px', borderRadius: '4px',
                        backgroundColor: getColorForShade(row.color), border: '1px solid #ccc',
                      }} />
                    ) : <span style={{ fontSize: '14px', color: '#6c757d' }}>—</span>}
                  </div>
                </td>
                {WORKER_FIELDS.map((field) => {
                  const locked = !!isCellLocked?.(index, field)
                  const editable = isEditMode && !locked
                  return (
                    <td key={field} style={{ width: '240px', minWidth: '240px' }}>
                      <button
                        type="button"
                        onClick={() => editable && onOpenWorkerPopup(index, field)}
                        disabled={!editable}
                        className="tbd-input"
                        title={locked ? 'Already saved — read only' : undefined}
                        style={workerBtnStyle(isEditMode, locked)}
                      >
                        {getWorkerCellLabel(row, field) || <span style={{ color: '#aaa' }}>—</span>}
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

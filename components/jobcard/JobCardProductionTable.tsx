'use client'

import { CSSProperties } from 'react'
import { getColorForShade } from '@/lib/colorUtils'
import { JobCardProductionRow, LotWorkerRates, Worker } from '@/lib/types'
import { getLotRateForField } from '@/lib/lotWorkerRates'
import { formatDisplayDate } from '@/lib/dateFormat'
import { formatIndianAmount } from '@/lib/indianNumberFormat'
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

const COL = {
  sno: 56,
  layer: 90,
  pieces: 180,
  color: 120,
  shade: 72,
  worker: 240,
  zip: 100,
  thread: 110,
} as const

const stickyLeft = {
  sno: 0,
  layer: COL.sno,
  pieces: COL.sno + COL.layer,
  color: COL.sno + COL.layer + COL.pieces,
  shade: COL.sno + COL.layer + COL.pieces + COL.color,
} as const

const stickyStyle = (left: number, width: number, isHeader = false): CSSProperties => ({
  position: 'sticky',
  left,
  width,
  minWidth: width,
  maxWidth: width,
  zIndex: isHeader ? 4 : 2,
  background: isHeader ? '#f8f9fa' : '#fff',
})

const workerBtnStyle = (editable: boolean, locked: boolean) => ({
  width: '100%', padding: '8px 12px', border: `1px solid ${locked ? '#ced4da' : '#ddd'}`, borderRadius: '4px',
  fontSize: '16px', textAlign: 'left' as const,
  background: !editable || locked ? '#f1f3f5' : '#fff',
  cursor: !editable || locked ? 'not-allowed' : 'pointer',
  color: locked ? '#495057' : undefined,
})

export default function JobCardProductionTable({
  productionData, workers, isEditMode, onOpenWorkerPopup, workerRates, isCellLocked,
}: JobCardProductionTableProps) {
  const getWorkerName = (workerId: string) => {
    if (!workerId) return ''
    const w = workers.find((x) => x._id === workerId)
    return w ? (w.worker_full_name || String(w.worker_id)) : ''
  }

  const getColumnLabel = (field: WorkerField) => {
    const base = WORKER_COL_LABELS[field]
    const rate = getLotRateForField(workerRates, field)
    if (!rate) return base
    return `${base} (Rs ${formatIndianAmount(rate)})`
  }

  const formatTotalPieces = (row: JobCardProductionRow) => {
    const pieces = Number(row.pieces) || 0
    const tukda = Number(row.tukda) || 0
    return `${pieces + tukda} (${pieces} + ${tukda})`
  }

  const getWorkerCellLabel = (row: JobCardProductionRow, field: WorkerField) => {
    const workerKey = `${field}Worker` as keyof JobCardProductionRow
    const dateKey = `${field}Date` as keyof JobCardProductionRow
    const name = getWorkerName(String(row[workerKey] ?? ''))
    if (!name) return ''
    const date = String(row[dateKey] ?? '')
    const parts = [name]
    if (date) parts.push(formatDisplayDate(date))
    return parts.join(' - ')
  }

  const tableMinWidth =
    COL.sno + COL.layer + COL.pieces + COL.color + COL.shade
    + WORKER_FIELDS.length * COL.worker
    + COL.zip + COL.thread

  return (
    <div className="card">
      <div className="card-header"><h2>Production Data</h2></div>
      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table
          className="production-table job-card-production-table"
          style={{ width: tableMinWidth, minWidth: tableMinWidth, tableLayout: 'fixed', borderCollapse: 'separate' }}
        >
          <thead>
            <tr>
              <th className="job-card-sticky-col" style={stickyStyle(stickyLeft.sno, COL.sno, true)}>S.No</th>
              <th className="job-card-sticky-col" style={stickyStyle(stickyLeft.layer, COL.layer, true)}>Layer</th>
              <th className="job-card-sticky-col" style={stickyStyle(stickyLeft.pieces, COL.pieces, true)}>Total Pieces</th>
              <th className="job-card-sticky-col" style={stickyStyle(stickyLeft.color, COL.color, true)}>Color</th>
              <th
                className="job-card-sticky-col"
                style={{ ...stickyStyle(stickyLeft.shade, COL.shade, true), boxShadow: '2px 0 4px rgba(0,0,0,0.06)' }}
              >
                Shade
              </th>
              {WORKER_FIELDS.map((f) => (
                <th key={f} style={{ width: COL.worker, minWidth: COL.worker }}>{getColumnLabel(f)}</th>
              ))}
              <th style={{ width: COL.zip, minWidth: COL.zip }}>Zip Code</th>
              <th style={{ width: COL.thread, minWidth: COL.thread }}>Thread Code</th>
            </tr>
          </thead>
          <tbody>
            {productionData.map((row, index) => (
              <tr key={index}>
                <td className="job-card-sticky-col" style={{ ...stickyStyle(stickyLeft.sno, COL.sno), textAlign: 'center' }}>
                  {row.serialNumber}
                </td>
                <td className="job-card-sticky-col" style={{ ...stickyStyle(stickyLeft.layer, COL.layer), textAlign: 'center', fontWeight: 600, color: '#1a1a1a' }}>
                  {row.layer !== undefined && row.layer !== null && String(row.layer) !== '' ? String(row.layer) : '—'}
                </td>
                <td className="job-card-sticky-col" style={{ ...stickyStyle(stickyLeft.pieces, COL.pieces), textAlign: 'center', fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap' }}>
                  {formatTotalPieces(row)}
                </td>
                <td className="job-card-sticky-col" style={{ ...stickyStyle(stickyLeft.color, COL.color), fontWeight: 600, color: '#1a1a1a' }}>
                  {row.color || '—'}
                </td>
                <td
                  className="job-card-sticky-col"
                  style={{ ...stickyStyle(stickyLeft.shade, COL.shade), boxShadow: '2px 0 4px rgba(0,0,0,0.06)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 36 }}>
                    {row.color ? (
                      <div
                        title={row.color}
                        style={{
                          width: 24, height: 24, borderRadius: 4, flexShrink: 0,
                          backgroundColor: getColorForShade(row.color), border: '1px solid #ccc',
                        }}
                      />
                    ) : (
                      <span style={{ color: '#6c757d' }}>—</span>
                    )}
                  </div>
                </td>
                {WORKER_FIELDS.map((field) => {
                  const locked = !!isCellLocked?.(index, field)
                  const editable = isEditMode && !locked
                  return (
                    <td key={field} style={{ width: COL.worker, minWidth: COL.worker }}>
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
                <td style={{ width: COL.zip, minWidth: COL.zip }}>
                  <input type="text" value={row.zip_code ?? ''} readOnly disabled className="tbd-input"
                    style={{ background: '#f8f9fa', cursor: 'not-allowed', width: '100%' }} placeholder="Zip Code" />
                </td>
                <td style={{ width: COL.thread, minWidth: COL.thread }}>
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

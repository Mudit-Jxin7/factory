'use client'

import { getColorForShade } from '@/lib/colorUtils'
import { IconPlus, IconTrash } from '../Icons'

interface ProductionRow {
  serialNumber: number
  meter: string
  layer: string
  pieces: number
  color: string
  shade: string
  tukda?: string
  zip_code?: string
  thread_code?: string
}

interface ProductionTableProps {
  productionData: ProductionRow[]
  colors: any[]
  onUpdate: (index: number, field: string, value: string) => void
  onBlurMeter: (index: number, value: string) => void
  onBlurLayer: (index: number, value: string) => void
  onBlurTukda: (index: number, value: string) => void
  onAddRow: () => void
  onDeleteRow: (index: number) => void
}

export default function ProductionTable({
  productionData, colors, onUpdate, onBlurMeter, onBlurLayer, onBlurTukda, onAddRow, onDeleteRow,
}: ProductionTableProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Production Data</h2>
        <button className="btn btn-secondary" onClick={onAddRow}>
          <span className="btn-icon"><IconPlus size={16} /></span> Add Row
        </button>
      </div>
      <div className="table-container">
        <table className="production-table">
          <thead>
            <tr>
              <th>Serial Number</th><th>Meter</th><th>Layer</th><th>Pieces</th><th>Tukda</th><th>Total Pieces</th>
              <th>Color</th><th>Shade</th><th>Zip Code</th><th>Thread Code</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {productionData.map((row, index) => (
              <tr key={index}>
                <td>{row.serialNumber}</td>
                <td>
                  <input
                    type="text" value={row.meter}
                    onChange={(e) => onUpdate(index, 'meter', e.target.value)}
                    onBlur={(e) => onBlurMeter(index, e.target.value)}
                    inputMode="decimal" pattern="[0-9]*\.?[0-9]*" placeholder="0"
                  />
                </td>
                <td>
                  <input
                    type="text" value={row.layer}
                    onChange={(e) => onUpdate(index, 'layer', e.target.value)}
                    onBlur={(e) => onBlurLayer(index, e.target.value)}
                    inputMode="numeric" pattern="[1-9][0-9]*" placeholder="1"
                  />
                </td>
                <td className="pieces-cell">{row.pieces.toFixed(2)}</td>
                <td>
                  <input
                    type="text" value={row.tukda ?? ''}
                    onChange={(e) => onUpdate(index, 'tukda', e.target.value)}
                    onBlur={(e) => onBlurTukda(index, e.target.value)}
                    inputMode="numeric" pattern="[0-9]*" placeholder="0"
                  />
                </td>
                <td className="pieces-cell">
                  {((Number(row.pieces) || 0) + (Number(row.tukda) || 0)).toFixed(2)}
                </td>
                <td>
                  <select
                    value={row.color || ''}
                    onChange={(e) => onUpdate(index, 'color', e.target.value)}
                    className="color-input"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Select color</option>
                    {colors.map((color: any) => <option key={color._id} value={color.name}>{color.name}</option>)}
                  </select>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', minHeight: '36px' }}>
                    {row.color
                      ? <div title={row.color} style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: getColorForShade(row.color), border: '1px solid #ccc' }} />
                      : <span style={{ fontSize: '16px', color: '#6c757d' }}>—</span>}
                  </div>
                </td>
                <td>
                  <input type="text" value={row.zip_code || ''} onChange={(e) => onUpdate(index, 'zip_code', e.target.value)} placeholder="Zip Code" className="tbd-input" />
                </td>
                <td>
                  <input type="text" value={row.thread_code || ''} onChange={(e) => onUpdate(index, 'thread_code', e.target.value)} placeholder="Thread Code" className="tbd-input" />
                </td>
                <td>
                  <button className="btn-delete" onClick={() => onDeleteRow(index)} disabled={productionData.length === 1} aria-label="Delete row"><IconTrash size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

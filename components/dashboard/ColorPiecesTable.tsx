'use client'

import { ColorPiecesRow } from '@/lib/colorPieces'

interface ColorPiecesTableProps {
  rows: ColorPiecesRow[]
}

export default function ColorPiecesTable({ rows }: ColorPiecesTableProps) {
  return (
    <div className="color-pieces-table-wrap">
      <h3 className="color-pieces-heading">Pieces by Color</h3>
      <div className="table-container">
        <table className="production-table color-pieces-table">
          <thead>
            <tr>
              <th>Color</th>
              <th>Total Pieces</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
                  No production data
                </td>
              </tr>
            ) : (
              rows.map(({ color, totalPieces }) => (
                <tr key={color}>
                  <td>{color}</td>
                  <td>{totalPieces.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

interface LotProductionTableProps {
  productionData: any[]
}

export default function LotProductionTable({ productionData }: LotProductionTableProps) {
  return (
    <div className="card">
      <h2>Production Data</h2>
      <div className="table-container">
        <table className="production-table">
          <thead>
            <tr>
              <th>Serial Number</th><th>Meter</th><th>Layer</th><th>Pieces</th>
              <th>Color</th><th>Shade</th><th>TBD2</th><th>TBD3</th>
            </tr>
          </thead>
          <tbody>
            {productionData.length > 0 ? (
              productionData.map((row: any, index: number) => (
                <tr key={index}>
                  <td>{row.serialNumber}</td>
                  <td>{Number(row.meter) || 0}</td>
                  <td>{Number(row.layer) || 1}</td>
                  <td className="pieces-cell">{Number(row.pieces || 0).toFixed(2)}</td>
                  <td>{row.color || 'N/A'}</td>
                  <td>{row.shade || 'N/A'}</td>
                  <td>{row.tbd2 || 'N/A'}</td>
                  <td>{row.tbd3 || 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#6c757d', padding: '40px' }}>
                  No production data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

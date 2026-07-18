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
              <th>Serial Number</th><th>Meter</th><th>Layer</th><th>Pieces</th><th>Tukda</th><th>Total Pieces</th>
              <th>Color</th><th>Shade</th><th>Zip Code</th><th>Thread Code</th>
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
                  <td>{Number(row.tukda || 0)}</td>
                  <td className="pieces-cell">
                    {(Number(row.pieces || 0) + Number(row.tukda || 0)).toFixed(2)}
                  </td>
                  <td>{row.color || 'N/A'}</td>
                  <td>{row.shade || 'N/A'}</td>
                  <td>{row.zip_code || 'N/A'}</td>
                  <td>{row.thread_code || 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', color: '#6c757d', padding: '40px' }}>
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

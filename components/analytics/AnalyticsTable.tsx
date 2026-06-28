'use client'

interface AnalyticsRow {
  worker_id: number
  worker_full_name: string
  section: string
  date: string
  rate: number
  lotNumber: string
  layer: number
  pieces: number
  total_amount: number
}

interface AnalyticsTableProps {
  loading: boolean
  filteredData: AnalyticsRow[]
  allCount: number
  totals: { totalPieces: number; totalAmount: number }
}

const SKELETON_COLS = 9

export default function AnalyticsTable({ loading, filteredData, allCount, totals }: AnalyticsTableProps) {
  const headers = ['Worker ID', 'Worker Name', 'Front / Back / Zip', 'Date', 'Rate', 'Lot Number', 'Layer', 'Pieces', 'Total Amount']

  if (loading) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>Worker Analytics</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="production-table" style={{ width: '100%' }}>
            <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {Array.from({ length: 7 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  {Array.from({ length: SKELETON_COLS }).map((__, j) => (
                    <td key={j}><div className="skeleton-cell" style={{ width: `${50 + (j * 7) % 40}%` }} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>Worker Analytics ({filteredData.length} records)</h2>
      </div>
      {filteredData.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>No data found matching the filters</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="production-table" style={{ width: '100%' }}>
            <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: '600', color: '#1a1a1a' }}>{row.worker_id}</td>
                  <td>{row.worker_full_name}</td>
                  <td>{row.section}</td>
                  <td>{row.date}</td>
                  <td>{row.rate.toFixed(2)}</td>
                  <td style={{ fontWeight: '600', color: '#1a1a1a' }}>{row.lotNumber}</td>
                  <td>{row.layer}</td>
                  <td>{row.pieces.toFixed(2)}</td>
                  <td style={{ fontWeight: '600', color: '#1a1a1a' }}>{row.total_amount.toFixed(2)}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#fff9e6', fontWeight: '600' }}>
                <td colSpan={7} style={{ textAlign: 'right', padding: '12px' }}>TOTAL:</td>
                <td style={{ padding: '12px' }}>{totals.totalPieces.toFixed(2)}</td>
                <td style={{ padding: '12px', color: '#1a1a1a' }}>{totals.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

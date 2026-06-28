'use client'

import { useRouter } from 'next/navigation'

interface LotsTableProps {
  lots: any[]
  allCount: number
  loading: boolean
  deletingLot: string | null
  onView: (lotNumber: string) => void
  onDelete: (lotNumber: string) => void
}

export default function LotsTable({ lots, allCount, loading, deletingLot, onView, onDelete }: LotsTableProps) {
  const router = useRouter()

  if (loading) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>All Lots</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="production-table" style={{ width: '100%' }}>
            <thead>
              <tr><th>Lot Number</th><th>Date</th><th>Fabric</th><th>Pattern</th><th>Brand</th><th style={{ textAlign: 'center' }}>Actions</th></tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-cell" style={{ width: '80%' }} /></td>
                  <td><div className="skeleton-cell" style={{ width: '70%' }} /></td>
                  <td><div className="skeleton-cell" style={{ width: '60%' }} /></td>
                  <td><div className="skeleton-cell" style={{ width: '65%' }} /></td>
                  <td><div className="skeleton-cell" style={{ width: '55%' }} /></td>
                  <td><div className="skeleton-cell" style={{ width: '90%', margin: '0 auto' }} /></td>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
        <h2>All Lots ({lots.length} of {allCount})</h2>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="production-table" style={{ width: '100%' }}>
          <thead>
            <tr><th>Lot Number</th><th>Date</th><th>Fabric</th><th>Pattern</th><th>Brand</th><th style={{ textAlign: 'center' }}>Actions</th></tr>
          </thead>
          <tbody>
            {lots.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6c757d', fontSize: '18px' }}>
                {allCount === 0 ? 'No lots found' : 'No lots match the filters'}
              </td></tr>
            ) : lots.map((lot: any) => (
              <tr key={lot._id || lot.lotNumber}>
                <td style={{ fontWeight: '600', color: '#1a1a1a' }}>{lot.lotNumber || '-'}</td>
                <td>{lot.date || '-'}</td><td>{lot.fabric || '-'}</td>
                <td>{lot.pattern || '-'}</td><td>{lot.brand || '-'}</td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => onView(lot.lotNumber)} style={{ padding: '8px 16px', fontSize: '14px' }}>View</button>
                    <button className="btn btn-primary" onClick={() => router.push(`/dashboard?edit=${encodeURIComponent(lot.lotNumber)}`)} style={{ padding: '8px 16px', fontSize: '14px' }}>Edit</button>
                    <button className="btn btn-secondary" onClick={() => router.push(`/jobcard/${encodeURIComponent(lot.lotNumber)}?edit=true`)} style={{ padding: '8px 16px', fontSize: '14px' }}>Job Card</button>
                    <button className="btn btn-logout" onClick={() => onDelete(lot.lotNumber)} disabled={deletingLot === lot.lotNumber} style={{ padding: '8px 16px', fontSize: '14px' }}>
                      {deletingLot === lot.lotNumber ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

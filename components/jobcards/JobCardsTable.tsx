'use client'

import { useRouter } from 'next/navigation'

interface JobCardsTableProps {
  jobCards: any[]
  allCount: number
  loading: boolean
  deletingJobCard: string | null
  onView: (lotNumber: string) => void
  onDelete: (lotNumber: string) => void
}

export default function JobCardsTable({ jobCards, allCount, loading, deletingJobCard, onView, onDelete }: JobCardsTableProps) {
  const router = useRouter()

  if (loading) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>All Job Cards</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="production-table" style={{ width: '100%' }}>
            <thead><tr><th>Lot Number</th><th>Date</th><th>Brand</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-cell" style={{ width: '75%' }} /></td>
                  <td><div className="skeleton-cell" style={{ width: '65%' }} /></td>
                  <td><div className="skeleton-cell" style={{ width: '55%' }} /></td>
                  <td><div className="skeleton-cell" style={{ width: '85%', margin: '0 auto' }} /></td>
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
        <h2>All Job Cards ({jobCards.length} of {allCount})</h2>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="production-table" style={{ width: '100%' }}>
          <thead><tr><th>Lot Number</th><th>Date</th><th>Brand</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
          <tbody>
            {jobCards.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#6c757d', fontSize: '18px' }}>
                {allCount === 0 ? 'No job cards found' : 'No job cards match the filters'}
              </td></tr>
            ) : jobCards.map((jobCard: any) => (
              <tr key={jobCard._id || jobCard.lotNumber}>
                <td style={{ fontWeight: '600', color: '#1a1a1a' }}>{jobCard.lotNumber || '-'}</td>
                <td>{jobCard.date || '-'}</td>
                <td>{jobCard.brand || '-'}</td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" onClick={() => onView(jobCard.lotNumber)} style={{ padding: '8px 16px', fontSize: '14px' }}>View</button>
                    <button className="btn btn-primary" onClick={() => router.push(`/jobcard/${encodeURIComponent(jobCard.lotNumber)}?edit=true`)} style={{ padding: '8px 16px', fontSize: '14px' }}>Edit</button>
                    <button className="btn btn-logout" onClick={() => onDelete(jobCard.lotNumber)} disabled={deletingJobCard === jobCard.lotNumber} style={{ padding: '8px 16px', fontSize: '14px' }}>
                      {deletingJobCard === jobCard.lotNumber ? 'Deleting...' : 'Delete'}
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

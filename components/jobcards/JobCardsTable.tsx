'use client'

import { useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface JobCardsTableProps {
  jobCards: any[]
  allCount: number
  loading: boolean
  deletingJobCard: string | null
  selectedIds: Set<string>
  onSelectId: (id: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onView: (lotNumber: string) => void
  onDelete: (lotNumber: string) => void
}

export default function JobCardsTable({ jobCards, allCount, loading, deletingJobCard, selectedIds, onSelectId, onSelectAll, onView, onDelete }: JobCardsTableProps) {
  const router = useRouter()
  const selectAllRef = useRef<HTMLInputElement>(null)

  const allSelected = jobCards.length > 0 && jobCards.every(j => selectedIds.has(j._id))
  const someSelected = jobCards.some(j => selectedIds.has(j._id))

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected
    }
  }, [someSelected, allSelected])

  if (loading) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>All Job Cards</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="production-table" style={{ width: '100%' }}>
            <thead><tr><th style={{ width: '40px' }}></th><th>Lot Number</th><th>Date</th><th>Brand</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-cell" style={{ width: '20px', height: '20px' }} /></td>
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
        {someSelected && (
          <span style={{ fontSize: '14px', color: '#495057', fontWeight: 500 }}>
            {selectedIds.size} selected
          </span>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="production-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => onSelectAll(e.target.checked)}
                  disabled={jobCards.length === 0}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  title="Select all visible job cards"
                />
              </th>
              <th>Lot Number</th><th>Date</th><th>Brand</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobCards.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#6c757d', fontSize: '18px' }}>
                {allCount === 0 ? 'No job cards found' : 'No job cards match the filters'}
              </td></tr>
            ) : jobCards.map((jobCard: any) => {
              const id = jobCard._id
              const isSelected = selectedIds.has(id)
              return (
                <tr key={id} style={isSelected ? { background: '#eef4ff' } : undefined}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => onSelectId(id, e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </td>
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
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

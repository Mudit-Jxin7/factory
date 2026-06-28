'use client'

import { useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface LotsTableProps {
  lots: any[]
  allCount: number
  loading: boolean
  deletingLot: string | null
  bulkDeleting?: boolean
  selectedIds: Set<string>
  onSelectId: (id: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onDeleteSelected?: () => void
  onView: (lotNumber: string) => void
  onDelete: (lotNumber: string) => void
}

export default function LotsTable({ lots, allCount, loading, deletingLot, bulkDeleting, selectedIds, onSelectId, onSelectAll, onDeleteSelected, onView, onDelete }: LotsTableProps) {
  const router = useRouter()
  const selectAllRef = useRef<HTMLInputElement>(null)

  const allSelected = lots.length > 0 && lots.every(l => selectedIds.has(l._id))
  const someSelected = lots.some(l => selectedIds.has(l._id))

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected
    }
  }, [someSelected, allSelected])

  if (loading) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>All Lots</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="production-table" style={{ width: '100%' }}>
            <thead>
              <tr><th style={{ width: '40px' }}></th><th>Lot Number</th><th>Date</th><th>Fabric</th><th>Pattern</th><th>Brand</th><th style={{ textAlign: 'center' }}>Actions</th></tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td><div className="skeleton-cell" style={{ width: '20px', height: '20px' }} /></td>
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
        {someSelected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: '#495057', fontWeight: 500 }}>
              {selectedIds.size} selected
            </span>
            {onDeleteSelected && (
              <button
                className="btn btn-logout"
                onClick={onDeleteSelected}
                disabled={bulkDeleting}
                style={{ padding: '6px 14px', fontSize: '14px' }}
              >
                {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
              </button>
            )}
          </div>
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
                  disabled={lots.length === 0}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  title="Select all visible lots"
                />
              </th>
              <th>Lot Number</th><th>Date</th><th>Fabric</th><th>Pattern</th><th>Brand</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lots.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#6c757d', fontSize: '18px' }}>
                {allCount === 0 ? 'No lots found' : 'No lots match the filters'}
              </td></tr>
            ) : lots.map((lot: any) => {
              const id = lot._id
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
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Pagination from '@/components/Pagination'
import { formatDisplayDate } from '@/lib/dateFormat'

const PAGE_SIZE = 15

interface LotsTableProps {
  lots: any[]
  allCount: number
  loading: boolean
  deletingLot: string | null
  bulkDeleting?: boolean
  selectedIds: Set<string>
  onSelectId: (id: string, checked: boolean) => void
  onSelectAll: (pageIds: string[], checked: boolean) => void
  onDeleteSelected?: () => void
  onView: (lotNumber: string) => void
  onDelete: (lotNumber: string) => void
}

export default function LotsTable({ lots, allCount, loading, deletingLot, bulkDeleting, selectedIds, onSelectId, onSelectAll, onDeleteSelected, onView, onDelete }: LotsTableProps) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const selectAllRef = useRef<HTMLInputElement>(null)

  // Reset to page 1 when the filtered list changes
  useEffect(() => { setPage(1) }, [lots.length])

  const totalPages = Math.max(1, Math.ceil(lots.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageLots = lots.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const pageIds = pageLots.map(l => l._id)

  const allPageSelected = pageLots.length > 0 && pageLots.every(l => selectedIds.has(l._id))
  const somePageSelected = pageLots.some(l => selectedIds.has(l._id))
  const totalSelected = lots.filter(l => selectedIds.has(l._id)).length

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected
    }
  }, [somePageSelected, allPageSelected])

  if (loading) {
    return (
      <>
        <div className="table-toolbar">
          <h2>All Lots</h2>
        </div>
        <div className="table-container">
          <table className="production-table">
            <thead>
              <tr>
                <th className="cell-check"></th>
                <th>Lot Number</th>
                <th>Date</th>
                <th>Fabric</th>
                <th>Pattern</th>
                <th>Brand</th>
                <th className="cell-center">Actions</th>
              </tr>
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
      <div className="table-toolbar">
        <h2>All Lots ({lots.length} of {allCount})</h2>
        {totalSelected > 0 && (
          <div className="table-toolbar-actions">
            <span className="table-selection-count">
              {totalSelected} selected
            </span>
            {onDeleteSelected && (
              <button
                className="btn btn-logout btn-sm"
                onClick={onDeleteSelected}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="table-container">
        <table className="production-table">
          <thead>
            <tr>
              <th className="cell-check">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  className="table-checkbox"
                  checked={allPageSelected}
                  onChange={e => onSelectAll(pageIds, e.target.checked)}
                  disabled={pageLots.length === 0}
                  title="Select all on this page"
                />
              </th>
              <th>Lot Number</th>
              <th>Date</th>
              <th>Fabric</th>
              <th>Pattern</th>
              <th>Brand</th>
              <th className="cell-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageLots.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  {allCount === 0 ? 'No lots found' : 'No lots match the filters'}
                </td>
              </tr>
            ) : pageLots.map((lot: any) => {
              const id = lot._id
              const isSelected = selectedIds.has(id)
              return (
                <tr key={id} className={isSelected ? 'is-selected' : undefined}>
                  <td className="cell-center">
                    <input
                      type="checkbox"
                      className="table-checkbox"
                      checked={isSelected}
                      onChange={e => onSelectId(id, e.target.checked)}
                    />
                  </td>
                  <td className="cell-strong">{lot.lotNumber || '-'}</td>
                  <td>{formatDisplayDate(lot.date, '-')}</td>
                  <td>{lot.fabric || '-'}</td>
                  <td>{lot.pattern || '-'}</td>
                  <td>{lot.brand || '-'}</td>
                  <td className="cell-center">
                    <div className="row-actions">
                      <button className="btn btn-secondary" onClick={() => onView(lot.lotNumber)}>View</button>
                      <button className="btn btn-primary" onClick={() => router.push(`/dashboard?edit=${encodeURIComponent(lot.lotNumber)}`)}>Edit</button>
                      <button className="btn btn-secondary" onClick={() => router.push(`/jobcard/${encodeURIComponent(lot.lotNumber)}?edit=true`)}>Job Card</button>
                      <button className="btn btn-logout" onClick={() => onDelete(lot.lotNumber)} disabled={deletingLot === lot.lotNumber}>
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
      <Pagination page={safePage} totalPages={totalPages} totalItems={lots.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </>
  )
}

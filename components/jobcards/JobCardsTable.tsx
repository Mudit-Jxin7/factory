'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Pagination from '@/components/Pagination'
import JobCardStatusBadge from './JobCardStatusBadge'
import { canAdminEditJobCard, canWorkerEditJobCard } from '@/lib/jobCardStatus'
import { formatDisplayDate } from '@/lib/dateFormat'
import { IconRefresh } from '../Icons'

const PAGE_SIZE = 15

interface JobCardsTableProps {
  jobCards: any[]
  allCount: number
  loading: boolean
  deletingJobCard?: string | null
  bulkDeleting?: boolean
  selectedIds?: Set<string>
  onSelectId?: (id: string, checked: boolean) => void
  onSelectAll?: (pageIds: string[], checked: boolean) => void
  onDeleteSelected?: () => void
  onView: (lotNumber: string) => void
  onDelete?: (lotNumber: string) => void
  onRefresh?: () => void
  refreshing?: boolean
  variant?: 'admin' | 'worker'
}

export default function JobCardsTable({
  jobCards, allCount, loading, deletingJobCard, bulkDeleting,
  selectedIds = new Set(), onSelectId, onSelectAll, onDeleteSelected, onView, onDelete,
  onRefresh, refreshing = false,
  variant = 'admin',
}: JobCardsTableProps) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const selectAllRef = useRef<HTMLInputElement>(null)
  const isWorker = variant === 'worker'
  const jobCardBasePath = isWorker ? '/worker/jobcard' : '/jobcard'
  const colSpan = isWorker ? 5 : 6

  useEffect(() => { setPage(1) }, [jobCards.length])

  const totalPages = Math.max(1, Math.ceil(jobCards.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageCards = jobCards.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const pageIds = pageCards.map(j => j._id)

  const allPageSelected = !isWorker && pageCards.length > 0 && pageCards.every(j => selectedIds.has(j._id))
  const somePageSelected = !isWorker && pageCards.some(j => selectedIds.has(j._id))
  const totalSelected = isWorker ? 0 : jobCards.filter(j => selectedIds.has(j._id)).length

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected
    }
  }, [somePageSelected, allPageSelected])

  const tableTitle = isWorker ? 'Job Cards' : 'All Job Cards'

  const renderTableHeading = (countLabel?: string) => (
    <div className="table-title-group">
      <h2>{countLabel ? `${tableTitle} (${countLabel})` : tableTitle}</h2>
      {onRefresh && (
        <button
          type="button"
          className="btn btn-secondary btn-icon-only"
          onClick={onRefresh}
          disabled={refreshing || loading}
          title="Refresh job cards"
          aria-label="Refresh job cards"
        >
          <span className={`btn-icon${refreshing ? ' spinning' : ''}`}><IconRefresh size={16} /></span>
        </button>
      )}
    </div>
  )

  if (loading) {
    return (
      <>
        <div className="table-toolbar">
          {renderTableHeading()}
        </div>
        <div className="table-container">
          <table className="production-table">
            <thead>
              <tr>
                {!isWorker && <th className="cell-check"></th>}
                <th>Lot Number</th>
                <th>Date</th>
                <th>Brand</th>
                <th>Status</th>
                <th className="cell-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  {!isWorker && <td><div className="skeleton-cell" style={{ width: '20px', height: '20px' }} /></td>}
                  <td><div className="skeleton-cell" style={{ width: '75%' }} /></td>
                  <td><div className="skeleton-cell" style={{ width: '65%' }} /></td>
                  <td><div className="skeleton-cell" style={{ width: '55%' }} /></td>
                  <td><div className="skeleton-cell" style={{ width: '70%' }} /></td>
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
      <div className="table-toolbar">
        {renderTableHeading(`${jobCards.length} of ${allCount}`)}
        {!isWorker && totalSelected > 0 && (
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
              {!isWorker && (
                <th className="cell-check">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="table-checkbox"
                    checked={allPageSelected}
                    onChange={e => onSelectAll?.(pageIds, e.target.checked)}
                    disabled={pageCards.length === 0}
                    title="Select all on this page"
                  />
                </th>
              )}
              <th>Lot Number</th>
              <th>Date</th>
              <th>Brand</th>
              <th>Status</th>
              <th className="cell-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageCards.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="table-empty">
                  {allCount === 0 ? 'No job cards found' : 'No job cards match the filters'}
                </td>
              </tr>
            ) : pageCards.map((jobCard: any) => {
              const id = jobCard._id
              const isSelected = !isWorker && selectedIds.has(id)
              const showWorkerEdit = isWorker && canWorkerEditJobCard(jobCard.status)
              const showAdminEdit = !isWorker && canAdminEditJobCard(jobCard.status)
              return (
                <tr key={id} className={isSelected ? 'is-selected' : undefined}>
                  {!isWorker && (
                    <td className="cell-center">
                      <input
                        type="checkbox"
                        className="table-checkbox"
                        checked={isSelected}
                        onChange={e => onSelectId?.(id, e.target.checked)}
                      />
                    </td>
                  )}
                  <td className="cell-strong">{jobCard.lotNumber || '-'}</td>
                  <td>{formatDisplayDate(jobCard.date, '-')}</td>
                  <td>{jobCard.brand || '-'}</td>
                  <td><JobCardStatusBadge status={jobCard.status} jobCard={{ productionData: jobCard.productionData }} variant={variant} /></td>
                  <td className="cell-center">
                    <div className="row-actions">
                      <button className="btn btn-secondary" onClick={() => onView(jobCard.lotNumber)}>View</button>
                      {(showWorkerEdit || showAdminEdit) && (
                        <button className="btn btn-primary" onClick={() => router.push(`${jobCardBasePath}/${encodeURIComponent(jobCard.lotNumber)}?edit=true`)}>Edit</button>
                      )}
                      {!isWorker && onDelete && (
                        <button className="btn btn-logout" onClick={() => onDelete(jobCard.lotNumber)} disabled={deletingJobCard === jobCard.lotNumber}>
                          {deletingJobCard === jobCard.lotNumber ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={safePage} totalPages={totalPages} totalItems={jobCards.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Pagination from '@/components/Pagination'

const PAGE_SIZE = 30

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
  const [page, setPage] = useState(1)

  useEffect(() => { setPage(1) }, [filteredData.length])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageData = filteredData.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

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
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="production-table" style={{ width: '100%' }}>
              <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {pageData.map((row, index) => (
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
              </tbody>
            </table>
          </div>
          <Pagination page={safePage} totalPages={totalPages} totalItems={filteredData.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          <div style={{ marginTop: '16px', padding: '12px 16px', background: '#fff9e6', borderRadius: '8px', display: 'flex', gap: '32px', fontWeight: 600, fontSize: '15px' }}>
            <span>Total Pieces: {totals.totalPieces.toFixed(2)}</span>
            <span>Total Amount: {totals.totalAmount.toFixed(2)}</span>
          </div>
        </>
      )}
    </>
  )
}

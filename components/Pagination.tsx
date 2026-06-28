'use client'

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  const pages: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
  }

  const btn: React.CSSProperties = {
    minWidth: '36px', height: '36px', padding: '0 10px',
    border: '1px solid #dee2e6', borderRadius: '6px',
    background: '#fff', color: '#495057',
    cursor: 'pointer', fontSize: '14px', fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  }
  const activeBtn: React.CSSProperties = { ...btn, background: '#0d6efd', color: '#fff', borderColor: '#0d6efd' }
  const disabledBtn: React.CSSProperties = { ...btn, opacity: 0.4, cursor: 'not-allowed' }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
      <span style={{ fontSize: '14px', color: '#6c757d' }}>
        Showing {from}–{to} of {totalItems}
      </span>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <button
          style={page === 1 ? disabledBtn : btn}
          onClick={() => page > 1 && onPageChange(page - 1)}
          disabled={page === 1}
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: '#6c757d', fontSize: '14px' }}>…</span>
            : <button key={p} style={p === page ? activeBtn : btn} onClick={() => onPageChange(p as number)}>{p}</button>
        )}
        <button
          style={page === totalPages ? disabledBtn : btn}
          onClick={() => page < totalPages && onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          ›
        </button>
      </div>
    </div>
  )
}

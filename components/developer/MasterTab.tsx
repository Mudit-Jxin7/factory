'use client'

import { useState, useEffect } from 'react'
import { useToast } from '../ToastProvider'
import { useConfirm } from '../ConfirmProvider'
import { MasterTab, MasterItem, MASTER_TAB_CONFIG } from './types'
import Pagination from '../Pagination'

const PAGE_SIZE = 15

interface MasterTabProps {
  tab: MasterTab
  items: MasterItem[]
  loading: boolean
  newValue: string
  editingId: string | null
  editValue: string
  deletingId: string | null
  onNewValueChange: (v: string) => void
  onEditValueChange: (v: string) => void
  onSetEditingId: (id: string | null) => void
  onRefresh: () => void
  onSetDeletingId: (id: string | null) => void
}

export default function MasterTabComponent({
  tab, items, loading, newValue, editingId, editValue, deletingId,
  onNewValueChange, onEditValueChange, onSetEditingId, onRefresh, onSetDeletingId,
}: MasterTabProps) {
  const toast = useToast()
  const { confirm: showConfirm } = useConfirm()
  const config = MASTER_TAB_CONFIG[tab]
  const [page, setPage] = useState(1)

  useEffect(() => { setPage(1) }, [tab, items.length])

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleCreate = async () => {
    if (!newValue.trim()) { toast.showToast(`Please enter a ${config.singular.toLowerCase()} name`, 'warning'); return }
    const result = await config.api.create({ name: newValue.trim() })
    if (result.success) { onNewValueChange(''); onRefresh(); toast.showToast(`${config.singular} created successfully!`, 'success') }
    else toast.showToast(`Error: ${result.error}`, 'error')
  }

  const handleUpdate = async (id: string) => {
    if (!editValue.trim()) { toast.showToast(`Please enter a ${config.singular.toLowerCase()} name`, 'warning'); return }
    const result = await config.api.update(id, { name: editValue.trim() })
    if (result.success) { onSetEditingId(null); onRefresh(); toast.showToast(`${config.singular} updated successfully!`, 'success') }
    else toast.showToast(`Error: ${result.error}`, 'error')
  }

  const handleDelete = async (id: string) => {
    const ok = await showConfirm({ title: `Delete ${config.singular}`, message: `Are you sure you want to delete this ${config.singular.toLowerCase()}?`, confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' })
    if (!ok) return
    onSetDeletingId(id)
    const result = await config.api.remove(id)
    if (result.success) { onRefresh(); toast.showToast(`${config.singular} deleted successfully!`, 'success') }
    else toast.showToast(`Error: ${result.error}`, 'error')
    onSetDeletingId(null)
  }

  return (
    <div className="card">
      <h2>{config.title} Management</h2>
      <div className="card" style={{ marginBottom: '20px', padding: '20px', background: '#fff9e6' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Add New {config.singular}</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>{config.singular} Name</label>
            <input type="text" value={newValue} onChange={(e) => onNewValueChange(e.target.value)} placeholder={`Enter ${config.singular.toLowerCase()} name`} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
          </div>
          <button className="btn btn-primary" onClick={handleCreate}>Add {config.singular}</button>
        </div>
      </div>
      {loading ? (
        <div className="card-loading"><div className="spinner" /><p>Loading {config.title.toLowerCase()}&hellip;</p></div>
      ) : (
        <>
        <div style={{ overflowX: 'auto' }}>
          <table className="production-table" style={{ width: '100%' }}>
            <thead><tr><th>{config.singular} Name</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
            <tbody>
              {pageItems.length === 0
                ? <tr><td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>No {config.title.toLowerCase()} found</td></tr>
                : pageItems.map((item) => (
                  <tr key={item._id}>
                    <td>
                      {editingId === item._id
                        ? <input type="text" value={editValue} onChange={(e) => onEditValueChange(e.target.value)} style={{ width: '100%', padding: '8px' }} onKeyDown={(e) => e.key === 'Enter' && handleUpdate(item._id)} />
                        : <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{item.name}</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {editingId === item._id ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="btn btn-primary" onClick={() => handleUpdate(item._id)} style={{ padding: '6px 12px', fontSize: '14px' }}>Save</button>
                          <button className="btn btn-secondary" onClick={() => onSetEditingId(null)} style={{ padding: '6px 12px', fontSize: '14px' }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="btn btn-primary" onClick={() => { onSetEditingId(item._id); onEditValueChange(item.name) }} style={{ padding: '6px 12px', fontSize: '14px' }}>Edit</button>
                          <button className="btn btn-logout" onClick={() => handleDelete(item._id)} disabled={deletingId === item._id} style={{ padding: '6px 12px', fontSize: '14px' }}>
                            {deletingId === item._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} totalPages={totalPages} totalItems={items.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}

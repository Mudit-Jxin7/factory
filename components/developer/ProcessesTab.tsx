'use client'

import { useEffect, useState } from 'react'
import { workerProcessesAPI } from '@/lib/api'
import { useToast } from '../ToastProvider'
import { useConfirm } from '../ConfirmProvider'
import Pagination from '../Pagination'

const PAGE_SIZE = 15

interface ProcessItem {
  _id: string
  key: string
  productionKey: string
  label: string
  roleCode: string
  sortOrder: number
  active: boolean
}

interface ProcessesTabProps {
  processes: ProcessItem[]
  loading: boolean
  onRefresh: () => void
}

export default function ProcessesTab({ processes, loading, onRefresh }: ProcessesTabProps) {
  const toast = useToast()
  const { confirm: showConfirm } = useConfirm()
  const [page, setPage] = useState(1)
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editRoleCode, setEditRoleCode] = useState('')
  const [editSortOrder, setEditSortOrder] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => { setPage(1) }, [processes.length])

  const totalPages = Math.max(1, Math.ceil(processes.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = processes.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleCreate = async () => {
    if (!newLabel.trim()) { toast.showToast('Please enter a process name', 'warning'); return }
    setSaving(true)
    const result = await workerProcessesAPI.createProcess({ label: newLabel.trim() })
    setSaving(false)
    if (result.success) {
      setNewLabel('')
      onRefresh()
      toast.showToast('Process created — it will appear on lot worker rates', 'success')
    } else {
      toast.showToast('Error creating process: ' + result.error, 'error')
    }
  }

  const startEdit = (item: ProcessItem) => {
    setEditingId(item._id)
    setEditLabel(item.label)
    setEditRoleCode(item.roleCode)
    setEditSortOrder(String(item.sortOrder))
  }

  const handleUpdate = async (id: string) => {
    if (!editLabel.trim()) { toast.showToast('Please enter a process name', 'warning'); return }
    const result = await workerProcessesAPI.updateProcess(id, {
      label: editLabel.trim(),
      roleCode: editRoleCode.trim().toUpperCase(),
      sortOrder: Number(editSortOrder) || 1,
    })
    if (result.success) {
      setEditingId(null)
      onRefresh()
      toast.showToast('Process updated', 'success')
    } else {
      toast.showToast('Error updating process: ' + result.error, 'error')
    }
  }

  const handleDelete = async (item: ProcessItem) => {
    const ok = await showConfirm({
      title: 'Delete Process',
      message: `Delete process "${item.label}"? Existing lots that already have a rate for it will keep their data, but new lots will not show this role.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    })
    if (!ok) return
    setDeletingId(item._id)
    const result = await workerProcessesAPI.deleteProcess(item._id)
    setDeletingId(null)
    if (result.success) {
      onRefresh()
      toast.showToast('Process deleted', 'success')
    } else {
      toast.showToast('Error deleting process: ' + result.error, 'error')
    }
  }

  const handleToggleActive = async (item: ProcessItem) => {
    const result = await workerProcessesAPI.updateProcess(item._id, { active: !item.active })
    if (result.success) {
      onRefresh()
      toast.showToast(item.active ? 'Process deactivated' : 'Process activated', 'success')
    } else {
      toast.showToast('Error updating process: ' + result.error, 'error')
    }
  }

  return (
    <div className="card">
      <h2>Worker Processes</h2>
      <p style={{ margin: '0 0 16px', color: '#6c757d', fontSize: 14 }}>
        These roles appear on the lot Worker Rates form. If a rate is set for a process, that column shows on the job card.
      </p>
      <div className="card" style={{ marginBottom: 20, padding: 20, background: '#fff9e6' }}>
        <h3 style={{ marginTop: 0, marginBottom: 15, fontSize: 18, fontWeight: 600 }}>Add Process</h3>
        <div className="form-grid" style={{ alignItems: 'end' }}>
          <div className="form-group">
            <label>Process Name *</label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Pocket, Side Seam…"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="form-group">
            <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Adding…' : 'Add Process'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /><p>Loading processes&hellip;</p></div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="production-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Label</th>
                  <th>Key</th>
                  <th>Role Code</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#6c757d' }}>No processes</td></tr>
                ) : pageItems.map((item) => (
                  <tr key={item._id} style={!item.active ? { opacity: 0.55 } : undefined}>
                    {editingId === item._id ? (
                      <>
                        <td>
                          <input type="number" value={editSortOrder} onChange={(e) => setEditSortOrder(e.target.value)} style={{ width: 70 }} />
                        </td>
                        <td>
                          <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{item.key}</td>
                        <td>
                          <input type="text" value={editRoleCode} onChange={(e) => setEditRoleCode(e.target.value.toUpperCase())} />
                        </td>
                        <td>{item.active ? 'Active' : 'Inactive'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button type="button" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => handleUpdate(item._id)}>Save</button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setEditingId(null)}>Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{item.sortOrder}</td>
                        <td style={{ fontWeight: 600 }}>{item.label}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{item.key}</td>
                        <td>{item.roleCode}</td>
                        <td>{item.active ? 'Active' : 'Inactive'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => startEdit(item)}>Edit</button>
                            <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => handleToggleActive(item)}>
                              {item.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-logout"
                              style={{ padding: '6px 12px', fontSize: 13 }}
                              disabled={deletingId === item._id}
                              onClick={() => handleDelete(item)}
                            >
                              {deletingId === item._id ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={safePage} totalPages={totalPages} totalItems={processes.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}

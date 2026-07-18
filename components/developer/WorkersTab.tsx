'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { workersAPI } from '@/lib/api'
import { WORKER_ROLES } from '@/lib/types'
import { useToast } from '../ToastProvider'
import { useConfirm } from '../ConfirmProvider'
import Pagination from '../Pagination'

const PAGE_SIZE = 15

type WorkerForm = { worker_full_name: string; role: string; tbd2: string; tbd3: string }

interface WorkersTabProps {
  workers: any[]
  loading: boolean
  newWorker: WorkerForm
  editingWorker: string | null
  editWorker: WorkerForm
  deletingWorker: string | null
  onNewWorkerChange: (form: WorkerForm) => void
  onEditWorkerChange: (form: WorkerForm) => void
  onSetEditingWorker: (id: string | null) => void
  onRefresh: () => void
  onSetDeletingWorker: (id: string | null) => void
}

const BLANK_FORM: WorkerForm = { worker_full_name: '', role: '', tbd2: '', tbd3: '' }

const getWorkerRole = (worker: { role?: string; tbd1?: string }) => worker.role || worker.tbd1 || ''

export default function WorkersTab({
  workers, loading, newWorker, editingWorker, editWorker, deletingWorker,
  onNewWorkerChange, onEditWorkerChange, onSetEditingWorker, onRefresh, onSetDeletingWorker,
}: WorkersTabProps) {
  const toast = useToast()
  const { confirm: showConfirm } = useConfirm()
  const [page, setPage] = useState(1)

  useEffect(() => { setPage(1) }, [workers.length])

  const totalPages = Math.max(1, Math.ceil(workers.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageWorkers = workers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleCreate = async () => {
    if (!newWorker.worker_full_name.trim()) { toast.showToast('Please enter worker full name', 'warning'); return }
    if (!newWorker.role) { toast.showToast('Please select a role', 'warning'); return }
    const result = await workersAPI.createWorker(newWorker)
    if (result.success) { onNewWorkerChange(BLANK_FORM); onRefresh(); toast.showToast('Worker created successfully!', 'success') }
    else toast.showToast('Error creating worker: ' + result.error, 'error')
  }

  const handleUpdate = async (id: string) => {
    if (!editWorker.worker_full_name.trim()) { toast.showToast('Please enter worker full name', 'warning'); return }
    const result = await workersAPI.updateWorker(id, {
      worker_full_name: editWorker.worker_full_name,
      tbd2: editWorker.tbd2,
      tbd3: editWorker.tbd3,
    })
    if (result.success) { onSetEditingWorker(null); onRefresh(); toast.showToast('Worker updated successfully!', 'success') }
    else toast.showToast('Error updating worker: ' + result.error, 'error')
  }

  const handleDelete = async (id: string) => {
    const ok = await showConfirm({ title: 'Delete Worker', message: 'Are you sure you want to delete this worker?', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' })
    if (!ok) return
    onSetDeletingWorker(id)
    const result = await workersAPI.deleteWorker(id)
    if (result.success) { onRefresh(); toast.showToast('Worker deleted successfully!', 'success') }
    else toast.showToast('Error deleting worker: ' + result.error, 'error')
    onSetDeletingWorker(null)
  }

  const tbdFields: { key: 'tbd2' | 'tbd3'; label: string }[] = [
    { key: 'tbd2', label: 'Phone Number' },
    { key: 'tbd3', label: 'Additional Information 1' },
  ]

  const renderRoleSelect = (value: string, onChange: (role: string) => void, style?: CSSProperties) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={style}>
      <option value="">Select role</option>
      {WORKER_ROLES.map((role) => (
        <option key={role} value={role}>{role}</option>
      ))}
    </select>
  )

  return (
    <div className="card">
      <h2>Worker Management</h2>
      <div className="card" style={{ marginBottom: '20px', padding: '20px', background: '#fff9e6' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Add New Worker</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Worker Full Name *</label>
            <input type="text" value={newWorker.worker_full_name} onChange={(e) => onNewWorkerChange({ ...newWorker, worker_full_name: e.target.value })} placeholder="Worker Full Name" />
          </div>
          <div className="form-group">
            <label>Role *</label>
            {renderRoleSelect(newWorker.role, (role) => onNewWorkerChange({ ...newWorker, role }))}
          </div>
          {tbdFields.map(({ key, label }) => (
            <div key={key} className="form-group">
              <label>{label}</label>
              <input type="text" value={newWorker[key]} onChange={(e) => onNewWorkerChange({ ...newWorker, [key]: e.target.value })} placeholder={label.replace(' *', '')} />
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={handleCreate} style={{ marginTop: '10px' }}>Add Worker</button>
      </div>
      {loading ? (
        <div className="card-loading"><div className="spinner" /><p>Loading workers&hellip;</p></div>
      ) : (
        <>
        <div style={{ overflowX: 'auto' }}>
          <table className="production-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Worker ID</th><th>Worker Full Name</th><th>Role</th><th>Phone Number</th><th>Additional Information 1</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageWorkers.length === 0
                ? <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>No workers found</td></tr>
                : pageWorkers.map((worker: any) => (
                  <tr key={worker._id}>
                    <td style={{ fontWeight: '600', color: '#1a1a1a' }}>{worker.worker_id}</td>
                    <td>
                      {editingWorker === worker._id
                        ? <input type="text" value={editWorker.worker_full_name} onChange={(e) => onEditWorkerChange({ ...editWorker, worker_full_name: e.target.value })} style={{ width: '100%', padding: '8px' }} />
                        : <span>{worker.worker_full_name || '-'}</span>}
                    </td>
                    <td>
                      {editingWorker === worker._id
                        ? <span style={{ display: 'inline-block', padding: '8px', color: '#495057', background: '#f8f9fa', borderRadius: '4px', width: '100%' }} title="Role cannot be changed after creation">{editWorker.role || '—'}</span>
                        : <span>{getWorkerRole(worker) || '-'}</span>}
                    </td>
                    {(['tbd2', 'tbd3'] as const).map((key) => (
                      <td key={key}>
                        {editingWorker === worker._id
                          ? <input type="text" value={editWorker[key]} onChange={(e) => onEditWorkerChange({ ...editWorker, [key]: e.target.value })} style={{ width: '100%', padding: '8px' }} />
                          : <span>{worker[key] || '-'}</span>}
                      </td>
                    ))}
                    <td style={{ textAlign: 'center' }}>
                      {editingWorker === worker._id ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="btn btn-primary" onClick={() => handleUpdate(worker._id)} style={{ padding: '6px 12px', fontSize: '14px' }}>Save</button>
                          <button className="btn btn-secondary" onClick={() => onSetEditingWorker(null)} style={{ padding: '6px 12px', fontSize: '14px' }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="btn btn-primary" onClick={() => { onSetEditingWorker(worker._id); onEditWorkerChange({ worker_full_name: worker.worker_full_name || '', role: getWorkerRole(worker), tbd2: worker.tbd2 || '', tbd3: worker.tbd3 || '' }) }} style={{ padding: '6px 12px', fontSize: '14px' }}>Edit</button>
                          <button className="btn btn-logout" onClick={() => handleDelete(worker._id)} disabled={deletingWorker === worker._id} style={{ padding: '6px 12px', fontSize: '14px' }}>
                            {deletingWorker === worker._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} totalPages={totalPages} totalItems={workers.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}

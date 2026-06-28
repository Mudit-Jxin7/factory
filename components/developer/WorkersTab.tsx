'use client'

import { workersAPI } from '@/lib/api'
import { useToast } from '../ToastProvider'
import { useConfirm } from '../ConfirmProvider'

type WorkerForm = { worker_full_name: string; tbd1: string; tbd2: string; tbd3: string }

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

const BLANK_FORM: WorkerForm = { worker_full_name: '', tbd1: '', tbd2: '', tbd3: '' }

export default function WorkersTab({
  workers, loading, newWorker, editingWorker, editWorker, deletingWorker,
  onNewWorkerChange, onEditWorkerChange, onSetEditingWorker, onRefresh, onSetDeletingWorker,
}: WorkersTabProps) {
  const toast = useToast()
  const { confirm: showConfirm } = useConfirm()

  const handleCreate = async () => {
    if (!newWorker.worker_full_name.trim()) { toast.showToast('Please enter worker full name', 'warning'); return }
    const result = await workersAPI.createWorker(newWorker)
    if (result.success) { onNewWorkerChange(BLANK_FORM); onRefresh(); toast.showToast('Worker created successfully!', 'success') }
    else toast.showToast('Error creating worker: ' + result.error, 'error')
  }

  const handleUpdate = async (id: string) => {
    if (!editWorker.worker_full_name.trim()) { toast.showToast('Please enter worker full name', 'warning'); return }
    const result = await workersAPI.updateWorker(id, editWorker)
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

  const workerFields: { key: keyof WorkerForm; label: string; required?: boolean }[] = [
    { key: 'worker_full_name', label: 'Worker Full Name *', required: true },
    { key: 'tbd1', label: 'TBD 1' }, { key: 'tbd2', label: 'TBD 2' }, { key: 'tbd3', label: 'TBD 3' },
  ]

  return (
    <div className="card">
      <h2>Worker Management</h2>
      <div className="card" style={{ marginBottom: '20px', padding: '20px', background: '#fff9e6' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Add New Worker</h3>
        <div className="form-grid">
          {workerFields.map(({ key, label }) => (
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
        <div style={{ overflowX: 'auto' }}>
          <table className="production-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Worker ID</th><th>Worker Full Name</th><th>TBD 1</th><th>TBD 2</th><th>TBD 3</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.length === 0
                ? <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>No workers found</td></tr>
                : workers.map((worker: any) => (
                  <tr key={worker._id}>
                    <td style={{ fontWeight: '600', color: '#1a1a1a' }}>{worker.worker_id}</td>
                    {(['worker_full_name', 'tbd1', 'tbd2', 'tbd3'] as const).map((key) => (
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
                          <button className="btn btn-primary" onClick={() => { onSetEditingWorker(worker._id); onEditWorkerChange({ worker_full_name: worker.worker_full_name || '', tbd1: worker.tbd1 || '', tbd2: worker.tbd2 || '', tbd3: worker.tbd3 || '' }) }} style={{ padding: '6px 12px', fontSize: '14px' }}>Edit</button>
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
      )}
    </div>
  )
}

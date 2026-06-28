'use client'

import { colorsAPI } from '@/lib/api'
import { useToast } from '../ToastProvider'
import { useConfirm } from '../ConfirmProvider'

interface ColorsTabProps {
  colors: any[]
  loading: boolean
  newColorName: string
  editingColor: string | null
  editColorName: string
  deletingColor: string | null
  onNewColorNameChange: (v: string) => void
  onEditColorNameChange: (v: string) => void
  onSetEditingColor: (id: string | null) => void
  onRefresh: () => void
  onSetDeletingColor: (id: string | null) => void
}

export default function ColorsTab({
  colors, loading, newColorName, editingColor, editColorName, deletingColor,
  onNewColorNameChange, onEditColorNameChange, onSetEditingColor, onRefresh, onSetDeletingColor,
}: ColorsTabProps) {
  const toast = useToast()
  const { confirm: showConfirm } = useConfirm()

  const handleCreate = async () => {
    if (!newColorName.trim()) { toast.showToast('Please enter a color name', 'warning'); return }
    const result = await colorsAPI.createColor({ name: newColorName.trim() })
    if (result.success) { onNewColorNameChange(''); onRefresh(); toast.showToast('Color created successfully!', 'success') }
    else toast.showToast('Error creating color: ' + result.error, 'error')
  }

  const handleUpdate = async (id: string) => {
    if (!editColorName.trim()) { toast.showToast('Please enter a color name', 'warning'); return }
    const result = await colorsAPI.updateColor(id, { name: editColorName.trim() })
    if (result.success) { onSetEditingColor(null); onRefresh(); toast.showToast('Color updated successfully!', 'success') }
    else toast.showToast('Error updating color: ' + result.error, 'error')
  }

  const handleDelete = async (id: string) => {
    const ok = await showConfirm({ title: 'Delete Color', message: 'Are you sure you want to delete this color?', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' })
    if (!ok) return
    onSetDeletingColor(id)
    const result = await colorsAPI.deleteColor(id)
    if (result.success) { onRefresh(); toast.showToast('Color deleted successfully!', 'success') }
    else toast.showToast('Error deleting color: ' + result.error, 'error')
    onSetDeletingColor(null)
  }

  return (
    <div className="card">
      <h2>Color Management</h2>
      <div className="card" style={{ marginBottom: '20px', padding: '20px', background: '#fff9e6' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>Add New Color</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Color Name</label>
            <input type="text" value={newColorName} onChange={(e) => onNewColorNameChange(e.target.value)} placeholder="Enter color name" onKeyPress={(e) => e.key === 'Enter' && handleCreate()} />
          </div>
          <button className="btn btn-primary" onClick={handleCreate}>Add Color</button>
        </div>
      </div>
      {loading ? (
        <div className="card-loading"><div className="spinner" /><p>Loading colors&hellip;</p></div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="production-table" style={{ width: '100%' }}>
            <thead><tr><th>Color Name</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
            <tbody>
              {colors.length === 0
                ? <tr><td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>No colors found</td></tr>
                : colors.map((color: any) => (
                  <tr key={color._id}>
                    <td>
                      {editingColor === color._id
                        ? <input type="text" value={editColorName} onChange={(e) => onEditColorNameChange(e.target.value)} style={{ width: '100%', padding: '8px' }} onKeyPress={(e) => e.key === 'Enter' && handleUpdate(color._id)} />
                        : <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{color.name}</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {editingColor === color._id ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="btn btn-primary" onClick={() => handleUpdate(color._id)} style={{ padding: '6px 12px', fontSize: '14px' }}>Save</button>
                          <button className="btn btn-secondary" onClick={() => onSetEditingColor(null)} style={{ padding: '6px 12px', fontSize: '14px' }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="btn btn-primary" onClick={() => { onSetEditingColor(color._id); onEditColorNameChange(color.name) }} style={{ padding: '6px 12px', fontSize: '14px' }}>Edit</button>
                          <button className="btn btn-logout" onClick={() => handleDelete(color._id)} disabled={deletingColor === color._id} style={{ padding: '6px 12px', fontSize: '14px' }}>
                            {deletingColor === color._id ? 'Deleting...' : 'Delete'}
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

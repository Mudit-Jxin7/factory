'use client'

import { useState, useEffect, useCallback } from 'react'
import { colorsAPI, workersAPI, brandsAPI, patternsAPI, fabricsAPI } from '@/lib/api'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import { useConfirm } from './ConfirmProvider'
import './dashboard.css'

type TabType = 'colors' | 'workers' | 'brands' | 'patterns' | 'fabrics'

type MasterTab = 'brands' | 'patterns' | 'fabrics'
type MasterItem = { _id: string; name: string }
type MasterApi = {
  getAll: () => Promise<{ success: boolean; error?: string; [key: string]: unknown }>
  create: (payload: { name: string }) => Promise<{ success: boolean; error?: string }>
  update: (id: string, payload: { name: string }) => Promise<{ success: boolean; error?: string }>
  remove: (id: string) => Promise<{ success: boolean; error?: string }>
}
const MASTER_TAB_CONFIG: Record<MasterTab, { title: string; singular: string; listKey: string; api: MasterApi }> = {
  brands: { title: 'Brands', singular: 'Brand', listKey: 'brands', api: { getAll: brandsAPI.getAllBrands, create: brandsAPI.createBrand, update: brandsAPI.updateBrand, remove: brandsAPI.deleteBrand } },
  patterns: { title: 'Patterns', singular: 'Pattern', listKey: 'patterns', api: { getAll: patternsAPI.getAllPatterns, create: patternsAPI.createPattern, update: patternsAPI.updatePattern, remove: patternsAPI.deletePattern } },
  fabrics: { title: 'Fabrics', singular: 'Fabric', listKey: 'fabrics', api: { getAll: fabricsAPI.getAllFabrics, create: fabricsAPI.createFabric, update: fabricsAPI.updateFabric, remove: fabricsAPI.deleteFabric } },
}

export default function DeveloperContent() {
  const toast = useToast()
  const { confirm: showConfirm } = useConfirm()
  const [activeTab, setActiveTab] = useState<TabType>('colors')
  
  // Colors state
  const [colors, setColors] = useState<any[]>([])
  const [loadingColors, setLoadingColors] = useState(true)
  const [newColorName, setNewColorName] = useState('')
  const [editingColor, setEditingColor] = useState<string | null>(null)
  const [editColorName, setEditColorName] = useState('')
  const [deletingColor, setDeletingColor] = useState<string | null>(null)

  // Workers state
  const [workers, setWorkers] = useState<any[]>([])
  const [loadingWorkers, setLoadingWorkers] = useState(true)
  const [newWorker, setNewWorker] = useState({
    worker_full_name: '',
    tbd1: '',
    tbd2: '',
    tbd3: '',
  })
  const [editingWorker, setEditingWorker] = useState<string | null>(null)
  const [editWorker, setEditWorker] = useState({
    worker_full_name: '',
    tbd1: '',
    tbd2: '',
    tbd3: '',
  })
  const [deletingWorker, setDeletingWorker] = useState<string | null>(null)

  // Master tabs (brands, patterns, fabrics) state
  const [itemsByTab, setItemsByTab] = useState<Record<MasterTab, MasterItem[]>>({ brands: [], patterns: [], fabrics: [] })
  const [loadingByTab, setLoadingByTab] = useState<Record<MasterTab, boolean>>({ brands: true, patterns: true, fabrics: true })
  const [newValueByTab, setNewValueByTab] = useState<Record<MasterTab, string>>({ brands: '', patterns: '', fabrics: '' })
  const [editingIdByTab, setEditingIdByTab] = useState<Record<MasterTab, string | null>>({ brands: null, patterns: null, fabrics: null })
  const [editValueByTab, setEditValueByTab] = useState<Record<MasterTab, string>>({ brands: '', patterns: '', fabrics: '' })
  const [deletingIdByTab, setDeletingIdByTab] = useState<Record<MasterTab, string | null>>({ brands: null, patterns: null, fabrics: null })

  const fetchMasterTabItems = useCallback(async (tab: MasterTab) => {
    setLoadingByTab((prev) => ({ ...prev, [tab]: true }))
    const config = MASTER_TAB_CONFIG[tab]
    try {
      const result = await config.api.getAll()
      if (result.success) {
        const raw = result[config.listKey]
        setItemsByTab((prev) => ({ ...prev, [tab]: Array.isArray(raw) ? (raw as MasterItem[]) : [] }))
      } else {
        toast.showToast(`Error fetching ${config.title.toLowerCase()}: ${result.error}`, 'error')
      }
    } catch (err: unknown) {
      toast.showToast(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setLoadingByTab((prev) => ({ ...prev, [tab]: false }))
    }
  }, [toast])

  useEffect(() => {
    if (activeTab === 'colors') {
      fetchColors()
    } else if (activeTab === 'workers') {
      fetchWorkers()
    } else if (activeTab === 'brands' || activeTab === 'patterns' || activeTab === 'fabrics') {
      fetchMasterTabItems(activeTab)
    }
  }, [activeTab, fetchMasterTabItems])

  // Colors functions
  const fetchColors = async () => {
    setLoadingColors(true)
    try {
      const result = await colorsAPI.getAllColors()
      if (result.success) {
        setColors(result.colors || [])
      } else {
        toast.showToast('Error fetching colors: ' + result.error, 'error')
      }
    } catch (error: any) {
      console.error('Error fetching colors:', error)
      toast.showToast('Error fetching colors: ' + error.message, 'error')
    } finally {
      setLoadingColors(false)
    }
  }

  const handleCreateColor = async () => {
    if (!newColorName.trim()) {
      toast.showToast('Please enter a color name', 'warning')
      return
    }

    try {
      const result = await colorsAPI.createColor({ name: newColorName.trim() })
      if (result.success) {
        setNewColorName('')
        fetchColors()
        toast.showToast('Color created successfully!', 'success')
      } else {
        toast.showToast('Error creating color: ' + result.error, 'error')
      }
    } catch (error: any) {
      console.error('Error creating color:', error)
      toast.showToast('Error creating color: ' + error.message, 'error')
    }
  }

  const handleEditColor = (color: any) => {
    setEditingColor(color._id)
    setEditColorName(color.name)
  }

  const handleUpdateColor = async (id: string) => {
    if (!editColorName.trim()) {
      toast.showToast('Please enter a color name', 'warning')
      return
    }

    try {
      const result = await colorsAPI.updateColor(id, { name: editColorName.trim() })
      if (result.success) {
        setEditingColor(null)
        fetchColors()
        toast.showToast('Color updated successfully!', 'success')
      } else {
        toast.showToast('Error updating color: ' + result.error, 'error')
      }
    } catch (error: any) {
      console.error('Error updating color:', error)
      toast.showToast('Error updating color: ' + error.message, 'error')
    }
  }

  const handleDeleteColor = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Color',
      message: 'Are you sure you want to delete this color?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    })

    if (!confirmed) {
      return
    }

    setDeletingColor(id)
    try {
      const result = await colorsAPI.deleteColor(id)
      if (result.success) {
        fetchColors()
        toast.showToast('Color deleted successfully!', 'success')
      } else {
        toast.showToast('Error deleting color: ' + result.error, 'error')
      }
    } catch (error: any) {
      console.error('Error deleting color:', error)
      toast.showToast('Error deleting color: ' + error.message, 'error')
    } finally {
      setDeletingColor(null)
    }
  }

  // Workers functions
  const fetchWorkers = async () => {
    setLoadingWorkers(true)
    try {
      const result = await workersAPI.getAllWorkers()
      if (result.success) {
        setWorkers(result.workers || [])
      } else {
        toast.showToast('Error fetching workers: ' + result.error, 'error')
      }
    } catch (error: any) {
      console.error('Error fetching workers:', error)
      toast.showToast('Error fetching workers: ' + error.message, 'error')
    } finally {
      setLoadingWorkers(false)
    }
  }

  const handleCreateWorker = async () => {
    if (!newWorker.worker_full_name.trim()) {
      toast.showToast('Please enter worker full name', 'warning')
      return
    }

    try {
      const result = await workersAPI.createWorker(newWorker)
      if (result.success) {
        setNewWorker({ worker_full_name: '', tbd1: '', tbd2: '', tbd3: '' })
        fetchWorkers()
        toast.showToast('Worker created successfully!', 'success')
      } else {
        toast.showToast('Error creating worker: ' + result.error, 'error')
      }
    } catch (error: any) {
      console.error('Error creating worker:', error)
      toast.showToast('Error creating worker: ' + error.message, 'error')
    }
  }

  const handleEditWorker = (worker: any) => {
    setEditingWorker(worker._id)
    setEditWorker({
      worker_full_name: worker.worker_full_name || '',
      tbd1: worker.tbd1 || '',
      tbd2: worker.tbd2 || '',
      tbd3: worker.tbd3 || '',
    })
  }

  const handleUpdateWorker = async (id: string) => {
    if (!editWorker.worker_full_name.trim()) {
      toast.showToast('Please enter worker full name', 'warning')
      return
    }

    try {
      const result = await workersAPI.updateWorker(id, editWorker)
      if (result.success) {
        setEditingWorker(null)
        fetchWorkers()
        toast.showToast('Worker updated successfully!', 'success')
      } else {
        toast.showToast('Error updating worker: ' + result.error, 'error')
      }
    } catch (error: any) {
      console.error('Error updating worker:', error)
      toast.showToast('Error updating worker: ' + error.message, 'error')
    }
  }

  const handleDeleteWorker = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Worker',
      message: 'Are you sure you want to delete this worker?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    })

    if (!confirmed) {
      return
    }

    setDeletingWorker(id)
    try {
      const result = await workersAPI.deleteWorker(id)
      if (result.success) {
        fetchWorkers()
        toast.showToast('Worker deleted successfully!', 'success')
      } else {
        toast.showToast('Error deleting worker: ' + result.error, 'error')
      }
    } catch (error: any) {
      console.error('Error deleting worker:', error)
      toast.showToast('Error deleting worker: ' + error.message, 'error')
    } finally {
      setDeletingWorker(null)
    }
  }

  // Master tab handlers (brands, patterns, fabrics)
  const handleCreateMasterItem = async (tab: MasterTab) => {
    const config = MASTER_TAB_CONFIG[tab]
    const name = newValueByTab[tab].trim()
    if (!name) {
      toast.showToast(`Please enter a ${config.singular.toLowerCase()} name`, 'warning')
      return
    }
    try {
      const result = await config.api.create({ name })
      if (result.success) {
        setNewValueByTab((prev) => ({ ...prev, [tab]: '' }))
        await fetchMasterTabItems(tab)
        toast.showToast(`${config.singular} created successfully!`, 'success')
      } else {
        toast.showToast(`Error: ${result.error}`, 'error')
      }
    } catch (err: unknown) {
      toast.showToast(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    }
  }
  const handleStartEditMaster = (tab: MasterTab, item: MasterItem) => {
    setEditingIdByTab((prev) => ({ ...prev, [tab]: item._id }))
    setEditValueByTab((prev) => ({ ...prev, [tab]: item.name }))
  }
  const handleUpdateMasterItem = async (tab: MasterTab, id: string) => {
    const config = MASTER_TAB_CONFIG[tab]
    const name = editValueByTab[tab].trim()
    if (!name) {
      toast.showToast(`Please enter a ${config.singular.toLowerCase()} name`, 'warning')
      return
    }
    try {
      const result = await config.api.update(id, { name })
      if (result.success) {
        setEditingIdByTab((prev) => ({ ...prev, [tab]: null }))
        await fetchMasterTabItems(tab)
        toast.showToast(`${config.singular} updated successfully!`, 'success')
      } else {
        toast.showToast(`Error: ${result.error}`, 'error')
      }
    } catch (err: unknown) {
      toast.showToast(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    }
  }
  const handleDeleteMasterItem = async (tab: MasterTab, id: string) => {
    const config = MASTER_TAB_CONFIG[tab]
    const confirmed = await showConfirm({
      title: `Delete ${config.singular}`,
      message: `Are you sure you want to delete this ${config.singular.toLowerCase()}?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    })
    if (!confirmed) return
    setDeletingIdByTab((prev) => ({ ...prev, [tab]: id }))
    try {
      const result = await config.api.remove(id)
      if (result.success) {
        await fetchMasterTabItems(tab)
        toast.showToast(`${config.singular} deleted successfully!`, 'success')
      } else {
        toast.showToast(`Error: ${result.error}`, 'error')
      }
    } catch (err: unknown) {
      toast.showToast(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setDeletingIdByTab((prev) => ({ ...prev, [tab]: null }))
    }
  }

  return (
    <>
      <NavigationBar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-title">
            <h1>Developer Settings</h1>
            <p>Manage colors, workers, brand, pattern, and fabric</p>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Tabs */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderBottom: '2px solid #e9ecef' }}>
              <button
                className={`btn ${activeTab === 'colors' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('colors')}
                style={{ borderRadius: '6px 6px 0 0', marginBottom: '-2px' }}
              >
                Colors
              </button>
              <button
                className={`btn ${activeTab === 'workers' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('workers')}
                style={{ borderRadius: '6px 6px 0 0', marginBottom: '-2px' }}
              >
                Workers
              </button>
              <button
                className={`btn ${activeTab === 'brands' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('brands')}
                style={{ borderRadius: '6px 6px 0 0', marginBottom: '-2px' }}
              >
                Brands
              </button>
              <button
                className={`btn ${activeTab === 'patterns' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('patterns')}
                style={{ borderRadius: '6px 6px 0 0', marginBottom: '-2px' }}
              >
                Patterns
              </button>
              <button
                className={`btn ${activeTab === 'fabrics' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('fabrics')}
                style={{ borderRadius: '6px 6px 0 0', marginBottom: '-2px' }}
              >
                Fabrics
              </button>
            </div>
          </div>

          {/* Colors Tab */}
          {activeTab === 'colors' && (
            <div className="card">
              <h2>Color Management</h2>
              
              {/* Add Color Form */}
              <div className="card" style={{ marginBottom: '20px', padding: '20px', background: '#fff9e6' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>Add New Color</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Color Name</label>
                    <input
                      type="text"
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      placeholder="Enter color name"
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateColor()}
                    />
                  </div>
                  <button className="btn btn-primary" onClick={handleCreateColor}>
                    Add Color
                  </button>
                </div>
              </div>

              {/* Colors List */}
              {loadingColors ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <p>Loading colors...</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="production-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Color Name</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colors.length === 0 ? (
                        <tr>
                          <td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                            No colors found
                          </td>
                        </tr>
                      ) : (
                        colors.map((color: any) => (
                          <tr key={color._id}>
                            <td>
                              {editingColor === color._id ? (
                                <input
                                  type="text"
                                  value={editColorName}
                                  onChange={(e) => setEditColorName(e.target.value)}
                                  style={{ width: '100%', padding: '8px' }}
                                  onKeyPress={(e) => e.key === 'Enter' && handleUpdateColor(color._id)}
                                />
                              ) : (
                                <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{color.name}</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {editingColor === color._id ? (
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button
                                    className="btn btn-primary"
                                    onClick={() => handleUpdateColor(color._id)}
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="btn btn-secondary"
                                    onClick={() => setEditingColor(null)}
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button
                                    className="btn btn-primary"
                                    onClick={() => handleEditColor(color)}
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-logout"
                                    onClick={() => handleDeleteColor(color._id)}
                                    disabled={deletingColor === color._id}
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                  >
                                    {deletingColor === color._id ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Workers Tab */}
          {activeTab === 'workers' && (
            <div className="card">
              <h2>Worker Management</h2>
              
              {/* Add Worker Form */}
              <div className="card" style={{ marginBottom: '20px', padding: '20px', background: '#fff9e6' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>Add New Worker</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Worker Full Name *</label>
                    <input
                      type="text"
                      value={newWorker.worker_full_name}
                      onChange={(e) => setNewWorker({ ...newWorker, worker_full_name: e.target.value })}
                      placeholder="Enter worker full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>TBD 1</label>
                    <input
                      type="text"
                      value={newWorker.tbd1}
                      onChange={(e) => setNewWorker({ ...newWorker, tbd1: e.target.value })}
                      placeholder="TBD 1"
                    />
                  </div>
                  <div className="form-group">
                    <label>TBD 2</label>
                    <input
                      type="text"
                      value={newWorker.tbd2}
                      onChange={(e) => setNewWorker({ ...newWorker, tbd2: e.target.value })}
                      placeholder="TBD 2"
                    />
                  </div>
                  <div className="form-group">
                    <label>TBD 3</label>
                    <input
                      type="text"
                      value={newWorker.tbd3}
                      onChange={(e) => setNewWorker({ ...newWorker, tbd3: e.target.value })}
                      placeholder="TBD 3"
                    />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleCreateWorker} style={{ marginTop: '10px' }}>
                  Add Worker
                </button>
              </div>

              {/* Workers List */}
              {loadingWorkers ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <p>Loading workers...</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="production-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Worker ID</th>
                        <th>Worker Full Name</th>
                        <th>TBD 1</th>
                        <th>TBD 2</th>
                        <th>TBD 3</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workers.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                            No workers found
                          </td>
                        </tr>
                      ) : (
                        workers.map((worker: any) => (
                          <tr key={worker._id}>
                            <td style={{ fontWeight: '600', color: '#1a1a1a' }}>{worker.worker_id}</td>
                            <td>
                              {editingWorker === worker._id ? (
                                <input
                                  type="text"
                                  value={editWorker.worker_full_name}
                                  onChange={(e) => setEditWorker({ ...editWorker, worker_full_name: e.target.value })}
                                  style={{ width: '100%', padding: '8px' }}
                                />
                              ) : (
                                <span>{worker.worker_full_name || '-'}</span>
                              )}
                            </td>
                            <td>
                              {editingWorker === worker._id ? (
                                <input
                                  type="text"
                                  value={editWorker.tbd1}
                                  onChange={(e) => setEditWorker({ ...editWorker, tbd1: e.target.value })}
                                  style={{ width: '100%', padding: '8px' }}
                                />
                              ) : (
                                <span>{worker.tbd1 || '-'}</span>
                              )}
                            </td>
                            <td>
                              {editingWorker === worker._id ? (
                                <input
                                  type="text"
                                  value={editWorker.tbd2}
                                  onChange={(e) => setEditWorker({ ...editWorker, tbd2: e.target.value })}
                                  style={{ width: '100%', padding: '8px' }}
                                />
                              ) : (
                                <span>{worker.tbd2 || '-'}</span>
                              )}
                            </td>
                            <td>
                              {editingWorker === worker._id ? (
                                <input
                                  type="text"
                                  value={editWorker.tbd3}
                                  onChange={(e) => setEditWorker({ ...editWorker, tbd3: e.target.value })}
                                  style={{ width: '100%', padding: '8px' }}
                                />
                              ) : (
                                <span>{worker.tbd3 || '-'}</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {editingWorker === worker._id ? (
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button
                                    className="btn btn-primary"
                                    onClick={() => handleUpdateWorker(worker._id)}
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="btn btn-secondary"
                                    onClick={() => setEditingWorker(null)}
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button
                                    className="btn btn-primary"
                                    onClick={() => handleEditWorker(worker)}
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-logout"
                                    onClick={() => handleDeleteWorker(worker._id)}
                                    disabled={deletingWorker === worker._id}
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                  >
                                    {deletingWorker === worker._id ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Brands / Patterns / Fabrics tabs */}
          {(activeTab === 'brands' || activeTab === 'patterns' || activeTab === 'fabrics') && (() => {
            const tab = activeTab
            const config = MASTER_TAB_CONFIG[tab]
            const items = itemsByTab[tab]
            const loading = loadingByTab[tab]
            const editingId = editingIdByTab[tab]
            const deletingId = deletingIdByTab[tab]
            return (
              <div className="card">
                <h2>{config.title} Management</h2>
                <div className="card" style={{ marginBottom: '20px', padding: '20px', background: '#fff9e6' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>Add New {config.singular}</h3>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label>{config.singular} Name</label>
                      <input
                        type="text"
                        value={newValueByTab[tab]}
                        onChange={(e) => setNewValueByTab((prev) => ({ ...prev, [tab]: e.target.value }))}
                        placeholder={`Enter ${config.singular.toLowerCase()} name`}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateMasterItem(tab)}
                      />
                    </div>
                    <button className="btn btn-primary" onClick={() => handleCreateMasterItem(tab)}>Add {config.singular}</button>
                  </div>
                </div>
                {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}><p>Loading {config.title.toLowerCase()}...</p></div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="production-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>{config.singular} Name</th>
                          <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>No {config.title.toLowerCase()} found</td>
                          </tr>
                        ) : (
                          items.map((item) => (
                            <tr key={item._id}>
                              <td>
                                {editingId === item._id ? (
                                  <input
                                    type="text"
                                    value={editValueByTab[tab]}
                                    onChange={(e) => setEditValueByTab((prev) => ({ ...prev, [tab]: e.target.value }))}
                                    style={{ width: '100%', padding: '8px' }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateMasterItem(tab, item._id)}
                                  />
                                ) : (
                                  <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{item.name}</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {editingId === item._id ? (
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button className="btn btn-primary" onClick={() => handleUpdateMasterItem(tab, item._id)} style={{ padding: '6px 12px', fontSize: '12px' }}>Save</button>
                                    <button className="btn btn-secondary" onClick={() => setEditingIdByTab((prev) => ({ ...prev, [tab]: null }))} style={{ padding: '6px 12px', fontSize: '12px' }}>Cancel</button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button className="btn btn-primary" onClick={() => handleStartEditMaster(tab, item)} style={{ padding: '6px 12px', fontSize: '12px' }}>Edit</button>
                                    <button className="btn btn-logout" onClick={() => handleDeleteMasterItem(tab, item._id)} disabled={deletingId === item._id} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                      {deletingId === item._id ? 'Deleting...' : 'Delete'}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { colorsAPI, workersAPI } from '@/lib/api'
import NavigationBar from './NavigationBar'
import './dashboard.css'

type TabType = 'colors' | 'workers'

export default function DeveloperContent() {
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

  useEffect(() => {
    if (activeTab === 'colors') {
      fetchColors()
    } else {
      fetchWorkers()
    }
  }, [activeTab])

  // Colors functions
  const fetchColors = async () => {
    setLoadingColors(true)
    try {
      const result = await colorsAPI.getAllColors()
      if (result.success) {
        setColors(result.colors || [])
      } else {
        alert('Error fetching colors: ' + result.error)
      }
    } catch (error: any) {
      console.error('Error fetching colors:', error)
      alert('Error fetching colors: ' + error.message)
    } finally {
      setLoadingColors(false)
    }
  }

  const handleCreateColor = async () => {
    if (!newColorName.trim()) {
      alert('Please enter a color name')
      return
    }

    try {
      const result = await colorsAPI.createColor({ name: newColorName.trim() })
      if (result.success) {
        setNewColorName('')
        fetchColors()
        alert('Color created successfully!')
      } else {
        alert('Error creating color: ' + result.error)
      }
    } catch (error: any) {
      console.error('Error creating color:', error)
      alert('Error creating color: ' + error.message)
    }
  }

  const handleEditColor = (color: any) => {
    setEditingColor(color._id)
    setEditColorName(color.name)
  }

  const handleUpdateColor = async (id: string) => {
    if (!editColorName.trim()) {
      alert('Please enter a color name')
      return
    }

    try {
      const result = await colorsAPI.updateColor(id, { name: editColorName.trim() })
      if (result.success) {
        setEditingColor(null)
        fetchColors()
        alert('Color updated successfully!')
      } else {
        alert('Error updating color: ' + result.error)
      }
    } catch (error: any) {
      console.error('Error updating color:', error)
      alert('Error updating color: ' + error.message)
    }
  }

  const handleDeleteColor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this color?')) {
      return
    }

    setDeletingColor(id)
    try {
      const result = await colorsAPI.deleteColor(id)
      if (result.success) {
        fetchColors()
        alert('Color deleted successfully!')
      } else {
        alert('Error deleting color: ' + result.error)
      }
    } catch (error: any) {
      console.error('Error deleting color:', error)
      alert('Error deleting color: ' + error.message)
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
        alert('Error fetching workers: ' + result.error)
      }
    } catch (error: any) {
      console.error('Error fetching workers:', error)
      alert('Error fetching workers: ' + error.message)
    } finally {
      setLoadingWorkers(false)
    }
  }

  const handleCreateWorker = async () => {
    if (!newWorker.worker_full_name.trim()) {
      alert('Please enter worker full name')
      return
    }

    try {
      const result = await workersAPI.createWorker(newWorker)
      if (result.success) {
        setNewWorker({ worker_full_name: '', tbd1: '', tbd2: '', tbd3: '' })
        fetchWorkers()
        alert('Worker created successfully!')
      } else {
        alert('Error creating worker: ' + result.error)
      }
    } catch (error: any) {
      console.error('Error creating worker:', error)
      alert('Error creating worker: ' + error.message)
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
      alert('Please enter worker full name')
      return
    }

    try {
      const result = await workersAPI.updateWorker(id, editWorker)
      if (result.success) {
        setEditingWorker(null)
        fetchWorkers()
        alert('Worker updated successfully!')
      } else {
        alert('Error updating worker: ' + result.error)
      }
    } catch (error: any) {
      console.error('Error updating worker:', error)
      alert('Error updating worker: ' + error.message)
    }
  }

  const handleDeleteWorker = async (id: string) => {
    if (!confirm('Are you sure you want to delete this worker?')) {
      return
    }

    setDeletingWorker(id)
    try {
      const result = await workersAPI.deleteWorker(id)
      if (result.success) {
        fetchWorkers()
        alert('Worker deleted successfully!')
      } else {
        alert('Error deleting worker: ' + result.error)
      }
    } catch (error: any) {
      console.error('Error deleting worker:', error)
      alert('Error deleting worker: ' + error.message)
    } finally {
      setDeletingWorker(null)
    }
  }

  return (
    <>
      <NavigationBar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-title">
            <h1>Developer Settings</h1>
            <p>Manage colors and workers</p>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Tabs */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e9ecef' }}>
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
        </div>
      </div>
    </>
  )
}

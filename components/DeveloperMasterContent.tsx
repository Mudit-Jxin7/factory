'use client'

import { useCallback, useEffect, useState } from 'react'
import { brandsAPI, patternsAPI, fabricsAPI } from '@/lib/api'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import { useConfirm } from './ConfirmProvider'
import './dashboard.css'

type MasterTab = 'brands' | 'patterns' | 'fabrics'

type MasterItem = {
  _id: string
  name: string
}

type MasterApiResponse = {
  success: boolean
  error?: string
  [key: string]: unknown
}

type MasterApi = {
  getAll: () => Promise<MasterApiResponse>
  create: (payload: { name: string }) => Promise<MasterApiResponse>
  update: (id: string, payload: { name: string }) => Promise<MasterApiResponse>
  remove: (id: string) => Promise<MasterApiResponse>
}

const TAB_CONFIG: Record<
  MasterTab,
  { title: string; singular: string; listKey: string; api: MasterApi }
> = {
  brands: {
    title: 'Brands',
    singular: 'Brand',
    listKey: 'brands',
    api: {
      getAll: brandsAPI.getAllBrands,
      create: brandsAPI.createBrand,
      update: brandsAPI.updateBrand,
      remove: brandsAPI.deleteBrand,
    },
  },
  patterns: {
    title: 'Patterns',
    singular: 'Pattern',
    listKey: 'patterns',
    api: {
      getAll: patternsAPI.getAllPatterns,
      create: patternsAPI.createPattern,
      update: patternsAPI.updatePattern,
      remove: patternsAPI.deletePattern,
    },
  },
  fabrics: {
    title: 'Fabrics',
    singular: 'Fabric',
    listKey: 'fabrics',
    api: {
      getAll: fabricsAPI.getAllFabrics,
      create: fabricsAPI.createFabric,
      update: fabricsAPI.updateFabric,
      remove: fabricsAPI.deleteFabric,
    },
  },
}

export default function DeveloperMasterContent() {
  const toast = useToast()
  const { confirm: showConfirm } = useConfirm()
  const [activeTab, setActiveTab] = useState<MasterTab>('brands')

  const [itemsByTab, setItemsByTab] = useState<Record<MasterTab, MasterItem[]>>({
    brands: [],
    patterns: [],
    fabrics: [],
  })
  const [loadingByTab, setLoadingByTab] = useState<Record<MasterTab, boolean>>({
    brands: true,
    patterns: true,
    fabrics: true,
  })
  const [newValueByTab, setNewValueByTab] = useState<Record<MasterTab, string>>({
    brands: '',
    patterns: '',
    fabrics: '',
  })
  const [editingIdByTab, setEditingIdByTab] = useState<Record<MasterTab, string | null>>({
    brands: null,
    patterns: null,
    fabrics: null,
  })
  const [editValueByTab, setEditValueByTab] = useState<Record<MasterTab, string>>({
    brands: '',
    patterns: '',
    fabrics: '',
  })
  const [deletingIdByTab, setDeletingIdByTab] = useState<Record<MasterTab, string | null>>({
    brands: null,
    patterns: null,
    fabrics: null,
  })

  const fetchTabItems = useCallback(async (tab: MasterTab) => {
    setLoadingByTab((prev) => ({ ...prev, [tab]: true }))
    const config = TAB_CONFIG[tab]

    try {
      const result = await config.api.getAll()
      if (result.success) {
        const rawItems = result[config.listKey]
        const normalizedItems = Array.isArray(rawItems) ? (rawItems as MasterItem[]) : []
        setItemsByTab((prev) => ({ ...prev, [tab]: normalizedItems }))
      } else {
        toast.showToast(`Error fetching ${config.title.toLowerCase()}: ${result.error}`, 'error')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.showToast(`Error fetching ${config.title.toLowerCase()}: ${errorMessage}`, 'error')
    } finally {
      setLoadingByTab((prev) => ({ ...prev, [tab]: false }))
    }
  }, [toast])

  useEffect(() => {
    fetchTabItems(activeTab)
  }, [activeTab, fetchTabItems])

  const handleCreateItem = async (tab: MasterTab) => {
    const config = TAB_CONFIG[tab]
    const name = newValueByTab[tab].trim()

    if (!name) {
      toast.showToast(`Please enter a ${config.singular.toLowerCase()} name`, 'warning')
      return
    }

    try {
      const result = await config.api.create({ name })
      if (result.success) {
        setNewValueByTab((prev) => ({ ...prev, [tab]: '' }))
        await fetchTabItems(tab)
        toast.showToast(`${config.singular} created successfully!`, 'success')
      } else {
        toast.showToast(`Error creating ${config.singular.toLowerCase()}: ${result.error}`, 'error')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.showToast(`Error creating ${config.singular.toLowerCase()}: ${errorMessage}`, 'error')
    }
  }

  const handleStartEdit = (tab: MasterTab, item: MasterItem) => {
    setEditingIdByTab((prev) => ({ ...prev, [tab]: item._id }))
    setEditValueByTab((prev) => ({ ...prev, [tab]: item.name }))
  }

  const handleUpdateItem = async (tab: MasterTab, id: string) => {
    const config = TAB_CONFIG[tab]
    const name = editValueByTab[tab].trim()

    if (!name) {
      toast.showToast(`Please enter a ${config.singular.toLowerCase()} name`, 'warning')
      return
    }

    try {
      const result = await config.api.update(id, { name })
      if (result.success) {
        setEditingIdByTab((prev) => ({ ...prev, [tab]: null }))
        await fetchTabItems(tab)
        toast.showToast(`${config.singular} updated successfully!`, 'success')
      } else {
        toast.showToast(`Error updating ${config.singular.toLowerCase()}: ${result.error}`, 'error')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.showToast(`Error updating ${config.singular.toLowerCase()}: ${errorMessage}`, 'error')
    }
  }

  const handleDeleteItem = async (tab: MasterTab, id: string) => {
    const config = TAB_CONFIG[tab]
    const confirmed = await showConfirm({
      title: `Delete ${config.singular}`,
      message: `Are you sure you want to delete this ${config.singular.toLowerCase()}?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    })

    if (!confirmed) {
      return
    }

    setDeletingIdByTab((prev) => ({ ...prev, [tab]: id }))
    try {
      const result = await config.api.remove(id)
      if (result.success) {
        await fetchTabItems(tab)
        toast.showToast(`${config.singular} deleted successfully!`, 'success')
      } else {
        toast.showToast(`Error deleting ${config.singular.toLowerCase()}: ${result.error}`, 'error')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.showToast(`Error deleting ${config.singular.toLowerCase()}: ${errorMessage}`, 'error')
    } finally {
      setDeletingIdByTab((prev) => ({ ...prev, [tab]: null }))
    }
  }

  const currentConfig = TAB_CONFIG[activeTab]
  const currentItems = itemsByTab[activeTab]
  const isLoading = loadingByTab[activeTab]
  const editingId = editingIdByTab[activeTab]
  const deletingId = deletingIdByTab[activeTab]

  return (
    <>
      <NavigationBar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-title">
            <h1>Developer Settings</h1>
            <p>Manage brand, pattern, and fabric</p>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e9ecef' }}>
              {(['brands', 'patterns', 'fabrics'] as MasterTab[]).map((tab) => (
                <button
                  key={tab}
                  className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab(tab)}
                  style={{ borderRadius: '6px 6px 0 0', marginBottom: '-2px' }}
                >
                  {TAB_CONFIG[tab].title}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>{currentConfig.title} Management</h2>

            <div className="card" style={{ marginBottom: '20px', padding: '20px', background: '#fff9e6' }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>
                Add New {currentConfig.singular}
              </h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>{currentConfig.singular} Name</label>
                  <input
                    type="text"
                    value={newValueByTab[activeTab]}
                    onChange={(e) => setNewValueByTab((prev) => ({ ...prev, [activeTab]: e.target.value }))}
                    placeholder={`Enter ${currentConfig.singular.toLowerCase()} name`}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateItem(activeTab)}
                  />
                </div>
                <button className="btn btn-primary" onClick={() => handleCreateItem(activeTab)}>
                  Add {currentConfig.singular}
                </button>
              </div>
            </div>

            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>Loading {currentConfig.title.toLowerCase()}...</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="production-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>{currentConfig.singular} Name</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                          No {currentConfig.title.toLowerCase()} found
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => (
                        <tr key={item._id}>
                          <td>
                            {editingId === item._id ? (
                              <input
                                type="text"
                                value={editValueByTab[activeTab]}
                                onChange={(e) => setEditValueByTab((prev) => ({ ...prev, [activeTab]: e.target.value }))}
                                style={{ width: '100%', padding: '8px' }}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateItem(activeTab, item._id)}
                              />
                            ) : (
                              <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{item.name}</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {editingId === item._id ? (
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button
                                  className="btn btn-primary"
                                  onClick={() => handleUpdateItem(activeTab, item._id)}
                                  style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                  Save
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => setEditingIdByTab((prev) => ({ ...prev, [activeTab]: null }))}
                                  style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button
                                  className="btn btn-primary"
                                  onClick={() => handleStartEdit(activeTab, item)}
                                  style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-logout"
                                  onClick={() => handleDeleteItem(activeTab, item._id)}
                                  disabled={deletingId === item._id}
                                  style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
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
        </div>
      </div>
    </>
  )
}

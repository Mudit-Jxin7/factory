'use client'

import { useState, useEffect, useCallback } from 'react'
import { colorsAPI, workersAPI } from '@/lib/api'
import NavigationBar from './NavigationBar'
import { useToast } from './ToastProvider'
import ColorsTab from './developer/ColorsTab'
import WorkersTab from './developer/WorkersTab'
import MasterTabComponent from './developer/MasterTab'
import { TabType, MasterTab, MasterItem, MASTER_TAB_CONFIG } from './developer/types'
import './dashboard.css'

const TAB_LABELS: { key: TabType; label: string }[] = [
  { key: 'colors', label: 'Colors' }, { key: 'workers', label: 'Workers' },
  { key: 'brands', label: 'Brands' }, { key: 'patterns', label: 'Patterns' }, { key: 'fabrics', label: 'Fabrics' },
]

export default function DeveloperContent() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('colors')

  const [colors, setColors] = useState<any[]>([])
  const [loadingColors, setLoadingColors] = useState(true)
  const [newColorName, setNewColorName] = useState('')
  const [editingColor, setEditingColor] = useState<string | null>(null)
  const [editColorName, setEditColorName] = useState('')
  const [deletingColor, setDeletingColor] = useState<string | null>(null)

  const [workers, setWorkers] = useState<any[]>([])
  const [loadingWorkers, setLoadingWorkers] = useState(true)
  const [newWorker, setNewWorker] = useState({ worker_full_name: '', tbd1: '', tbd2: '', tbd3: '' })
  const [editingWorker, setEditingWorker] = useState<string | null>(null)
  const [editWorker, setEditWorker] = useState({ worker_full_name: '', tbd1: '', tbd2: '', tbd3: '' })
  const [deletingWorker, setDeletingWorker] = useState<string | null>(null)

  const [itemsByTab, setItemsByTab] = useState<Record<MasterTab, MasterItem[]>>({ brands: [], patterns: [], fabrics: [] })
  const [loadingByTab, setLoadingByTab] = useState<Record<MasterTab, boolean>>({ brands: true, patterns: true, fabrics: true })
  const [newValueByTab, setNewValueByTab] = useState<Record<MasterTab, string>>({ brands: '', patterns: '', fabrics: '' })
  const [editingIdByTab, setEditingIdByTab] = useState<Record<MasterTab, string | null>>({ brands: null, patterns: null, fabrics: null })
  const [editValueByTab, setEditValueByTab] = useState<Record<MasterTab, string>>({ brands: '', patterns: '', fabrics: '' })
  const [deletingIdByTab, setDeletingIdByTab] = useState<Record<MasterTab, string | null>>({ brands: null, patterns: null, fabrics: null })

  const fetchColors = useCallback(async () => {
    setLoadingColors(true)
    const result = await colorsAPI.getAllColors()
    if (result.success) setColors(result.colors || [])
    else toast.showToast('Error fetching colors: ' + result.error, 'error')
    setLoadingColors(false)
  }, [toast])

  const fetchWorkers = useCallback(async () => {
    setLoadingWorkers(true)
    const result = await workersAPI.getAllWorkers()
    if (result.success) setWorkers(result.workers || [])
    else toast.showToast('Error fetching workers: ' + result.error, 'error')
    setLoadingWorkers(false)
  }, [toast])

  const fetchMasterTabItems = useCallback(async (tab: MasterTab) => {
    setLoadingByTab((prev) => ({ ...prev, [tab]: true }))
    const config = MASTER_TAB_CONFIG[tab]
    const result = await config.api.getAll()
    if (result.success) setItemsByTab((prev) => ({ ...prev, [tab]: Array.isArray(result[config.listKey]) ? (result[config.listKey] as MasterItem[]) : [] }))
    else toast.showToast(`Error fetching ${config.title.toLowerCase()}: ${result.error}`, 'error')
    setLoadingByTab((prev) => ({ ...prev, [tab]: false }))
  }, [toast])

  useEffect(() => {
    if (activeTab === 'colors') fetchColors()
    else if (activeTab === 'workers') fetchWorkers()
    else fetchMasterTabItems(activeTab as MasterTab)
  }, [activeTab, fetchColors, fetchWorkers, fetchMasterTabItems])

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
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderBottom: '2px solid #e9ecef' }}>
              {TAB_LABELS.map(({ key, label }) => (
                <button key={key} className={`btn ${activeTab === key ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab(key)} style={{ borderRadius: '6px 6px 0 0', marginBottom: '-2px' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'colors' && (
            <ColorsTab
              colors={colors} loading={loadingColors} newColorName={newColorName}
              editingColor={editingColor} editColorName={editColorName} deletingColor={deletingColor}
              onNewColorNameChange={setNewColorName} onEditColorNameChange={setEditColorName}
              onSetEditingColor={setEditingColor} onRefresh={fetchColors} onSetDeletingColor={setDeletingColor}
            />
          )}
          {activeTab === 'workers' && (
            <WorkersTab
              workers={workers} loading={loadingWorkers} newWorker={newWorker}
              editingWorker={editingWorker} editWorker={editWorker} deletingWorker={deletingWorker}
              onNewWorkerChange={setNewWorker} onEditWorkerChange={setEditWorker}
              onSetEditingWorker={setEditingWorker} onRefresh={fetchWorkers} onSetDeletingWorker={setDeletingWorker}
            />
          )}
          {(activeTab === 'brands' || activeTab === 'patterns' || activeTab === 'fabrics') && (
            <MasterTabComponent
              tab={activeTab as MasterTab}
              items={itemsByTab[activeTab as MasterTab]} loading={loadingByTab[activeTab as MasterTab]}
              newValue={newValueByTab[activeTab as MasterTab]} editingId={editingIdByTab[activeTab as MasterTab]}
              editValue={editValueByTab[activeTab as MasterTab]} deletingId={deletingIdByTab[activeTab as MasterTab]}
              onNewValueChange={(v) => setNewValueByTab((p) => ({ ...p, [activeTab]: v }))}
              onEditValueChange={(v) => setEditValueByTab((p) => ({ ...p, [activeTab]: v }))}
              onSetEditingId={(id) => setEditingIdByTab((p) => ({ ...p, [activeTab]: id }))}
              onRefresh={() => fetchMasterTabItems(activeTab as MasterTab)}
              onSetDeletingId={(id) => setDeletingIdByTab((p) => ({ ...p, [activeTab]: id }))}
            />
          )}
        </div>
      </div>
    </>
  )
}

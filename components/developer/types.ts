import { brandsAPI } from '@/lib/api/brands'
import { patternsAPI } from '@/lib/api/patterns'
import { fabricsAPI } from '@/lib/api/fabrics'

export type TabType = 'colors' | 'workers' | 'brands' | 'patterns' | 'fabrics'
export type MasterTab = 'brands' | 'patterns' | 'fabrics'
export type MasterItem = { _id: string; name: string }

export type MasterApi = {
  getAll: () => Promise<{ success: boolean; error?: string; [key: string]: unknown }>
  create: (payload: { name: string }) => Promise<{ success: boolean; error?: string }>
  update: (id: string, payload: { name: string }) => Promise<{ success: boolean; error?: string }>
  remove: (id: string) => Promise<{ success: boolean; error?: string }>
}

export const MASTER_TAB_CONFIG: Record<MasterTab, { title: string; singular: string; listKey: string; api: MasterApi }> = {
  brands:   { title: 'Brands',   singular: 'Brand',   listKey: 'brands',   api: { getAll: brandsAPI.getAllBrands,   create: brandsAPI.createBrand,   update: brandsAPI.updateBrand,   remove: brandsAPI.deleteBrand   } },
  patterns: { title: 'Patterns', singular: 'Pattern', listKey: 'patterns', api: { getAll: patternsAPI.getAllPatterns, create: patternsAPI.createPattern, update: patternsAPI.updatePattern, remove: patternsAPI.deletePattern } },
  fabrics:  { title: 'Fabrics',  singular: 'Fabric',  listKey: 'fabrics',  api: { getAll: fabricsAPI.getAllFabrics,  create: fabricsAPI.createFabric,  update: fabricsAPI.updateFabric,  remove: fabricsAPI.deleteFabric  } },
}

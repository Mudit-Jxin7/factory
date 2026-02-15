'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import LotViewContent from '@/components/LotViewContent'
import { useParams } from 'next/navigation'

export default function LotViewPage() {
  const params = useParams<{ lotNumber: string }>()
  const rawLotNumber = params?.lotNumber as string || ''
  const lotNumber = rawLotNumber ? decodeURIComponent(rawLotNumber) : ''
  
  return (
    <ProtectedRoute>
      <LotViewContent lotNumber={lotNumber} />
    </ProtectedRoute>
  )
}

'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import LotViewContent from '@/components/LotViewContent'
import { useParams } from 'next/navigation'

export default function LotViewPage() {
  const params = useParams<{ lotNumber: string }>()
  const lotNumber = params?.lotNumber as string || ''
  
  return (
    <ProtectedRoute>
      <LotViewContent lotNumber={lotNumber} />
    </ProtectedRoute>
  )
}

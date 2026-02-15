'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import JobCardContent from '@/components/JobCardContent'
import { useParams, useSearchParams } from 'next/navigation'

export default function JobCardPage() {
  const params = useParams<{ lotNumber: string }>()
  const searchParams = useSearchParams()
  const rawLotNumber = params?.lotNumber as string || ''
  const lotNumber = rawLotNumber ? decodeURIComponent(rawLotNumber) : ''
  const isEdit = searchParams?.get('edit') === 'true'
  
  return (
    <ProtectedRoute>
      <JobCardContent lotNumber={lotNumber} isEdit={isEdit} />
    </ProtectedRoute>
  )
}

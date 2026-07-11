'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import WorkerJobCardContent from '@/components/WorkerJobCardContent'
import { useParams, useSearchParams } from 'next/navigation'

export default function WorkerJobCardPage() {
  const params = useParams<{ lotNumber: string }>()
  const searchParams = useSearchParams()
  const rawLotNumber = params?.lotNumber as string || ''
  const lotNumber = rawLotNumber ? decodeURIComponent(rawLotNumber) : ''
  const isEdit = searchParams?.get('edit') === 'true'

  return (
    <ProtectedRoute>
      <WorkerJobCardContent lotNumber={lotNumber} isEdit={isEdit} />
    </ProtectedRoute>
  )
}

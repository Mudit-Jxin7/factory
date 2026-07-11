'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import WorkerJobCardsContent from '@/components/WorkerJobCardsContent'

export default function WorkerPage() {
  return (
    <ProtectedRoute>
      <WorkerJobCardsContent />
    </ProtectedRoute>
  )
}

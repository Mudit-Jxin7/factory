'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import WorkerAnalyticsContent from '@/components/WorkerAnalyticsContent'

export default function WorkerAnalyticsPage() {
  return (
    <ProtectedRoute>
      <WorkerAnalyticsContent />
    </ProtectedRoute>
  )
}

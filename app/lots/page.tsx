'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import AllLotsContent from '@/components/AllLotsContent'

export default function AllLotsPage() {
  return (
    <ProtectedRoute>
      <AllLotsContent />
    </ProtectedRoute>
  )
}

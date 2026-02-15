'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import AllJobCardsContent from '@/components/AllJobCardsContent'

export default function AllJobCardsPage() {
  return (
    <ProtectedRoute>
      <AllJobCardsContent />
    </ProtectedRoute>
  )
}

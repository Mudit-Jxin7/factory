'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import DeveloperContent from '@/components/DeveloperContent'

export default function DeveloperPage() {
  return (
    <ProtectedRoute>
      <DeveloperContent />
    </ProtectedRoute>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import './dashboard.css'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (isAuthenticated !== 'true') {
      router.push('/login')
    } else {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

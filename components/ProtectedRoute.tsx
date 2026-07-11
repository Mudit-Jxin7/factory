'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getUserRole, isStaffOnlyPath, isWorkerAllowedPath } from '@/lib/auth'
import './dashboard.css'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (isAuthenticated !== 'true') {
      router.push('/login')
      return
    }

    const role = getUserRole()
    if (role === 'worker' && !isWorkerAllowedPath(pathname)) {
      router.push('/worker')
      return
    }

    if (role === 'admin' && isStaffOnlyPath(pathname)) {
      router.push('/dashboard')
      return
    }

    setLoading(false)
  }, [router, pathname])

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

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import '@/components/dashboard.css'

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (isAuthenticated === 'true') {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router, mounted])

  return (
    <div className="dashboard-container">
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    </div>
  )
}

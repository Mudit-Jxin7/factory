'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageSkeleton } from '@/components/Skeleton'
import '@/components/dashboard.css'

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (isAuthenticated === 'true') {
      const role = localStorage.getItem('userRole')
      router.push(role === 'worker' ? '/worker' : '/dashboard')
    } else {
      router.push('/login')
    }
  }, [router, mounted])

  return (
    <div className="dashboard-container px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10">
      <PageSkeleton cards={2} variant="form" />
    </div>
  )
}

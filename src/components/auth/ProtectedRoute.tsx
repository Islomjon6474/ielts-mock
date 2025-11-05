'use client'

import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode, useState } from 'react'
import { Spin, Result, Button } from 'antd'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

export const ProtectedRoute = observer(({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { authStore } = useStore()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // Wait a bit for auth state to initialize
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // If not authenticated, redirect to signin
      if (!authStore.isAuthenticated) {
        console.log('❌ User not authenticated, redirecting to signin')
        router.push('/auth/signin')
        return
      }

      // If admin required but user is not admin, redirect to signin
      if (requireAdmin && !authStore.isAdmin) {
        console.log('❌ User is not admin, redirecting to signin. User role:', authStore.user?.role)
        router.push('/auth/signin')
        return
      }

      setIsChecking(false)
    }

    checkAuth()
  }, [authStore.isAuthenticated, authStore.isAdmin, authStore.user, requireAdmin, router])

  // Show loading while checking auth
  if (isChecking || !authStore.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Checking authentication..." />
      </div>
    )
  }

  // Show access denied if admin required but user is not admin
  if (requireAdmin && !authStore.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Result
          status="403"
          title="Access Denied"
          subTitle="Sorry, you don't have permission to access this page. Admin access required."
          extra={
            <Button type="primary" onClick={() => router.push('/auth/signin')}>
              Sign In
            </Button>
          }
        />
      </div>
    )
  }

  return <>{children}</>
})

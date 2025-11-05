'use client'

import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { useRouter } from 'next/navigation'
import { useEffect, ComponentType, useState } from 'react'
import { Spin, Result, Button } from 'antd'

export interface WithAuthOptions {
  requireAdmin?: boolean
  redirectTo?: string
}

/**
 * Higher-order component for protecting pages
 * Usage:
 * export default withAuth(MyPage)
 * export default withAuth(AdminPage, { requireAdmin: true })
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { requireAdmin = false, redirectTo = '/auth/signin' } = options

  const ProtectedComponent = observer((props: P) => {
    const { authStore } = useStore()
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
      const checkAuth = async () => {
        // Wait a bit for auth state to initialize
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // If authenticated but no user data, wait for it to load
        if (authStore.isAuthenticated && !authStore.user) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // If not authenticated, redirect to signin
        if (!authStore.isAuthenticated) {
          console.log('❌ User not authenticated, redirecting to:', redirectTo)
          router.push(redirectTo)
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
    }, [authStore.isAuthenticated, authStore.isAdmin, authStore.user, router])

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

    return <Component {...props} />
  })

  ProtectedComponent.displayName = `withAuth(${Component.displayName || Component.name})`

  return ProtectedComponent
}

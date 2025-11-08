# Protecting Admin Routes - Example

## How to Add Authentication to Existing Admin Pages

### Option 1: Using `withAuth` HOC (Recommended)

Simply wrap your page component with `withAuth` and specify `requireAdmin: true`:

**Before:**
```tsx
'use client'

import { useState } from 'react'

const AdminPage = () => {
  return <div>Admin content</div>
}

export default AdminPage
```

**After:**
```tsx
'use client'

import { useState } from 'react'
import { withAuth } from '@/components/auth/withAuth'

const AdminPage = () => {
  return <div>Admin content</div>
}

export default withAuth(AdminPage, { requireAdmin: true })
```

That's it! The page is now:
- ✅ Protected from unauthenticated users
- ✅ Protected from non-admin users
- ✅ Auto-redirects to signin if needed

### Option 2: Using `ProtectedRoute` Component

Wrap your JSX with `ProtectedRoute`:

```tsx
'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

const AdminPage = () => {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div>Admin content</div>
    </ProtectedRoute>
  )
}

export default AdminPage
```

## Real Example: Protecting Part Editor Page

### Current Code Structure
```tsx
'use client'

import { useState, useEffect } from 'react'
import { Layout, Typography, Tabs, Button } from 'antd'
import { useRouter, useParams } from 'next/navigation'
import { testManagementApi } from '@/services/testManagementApi'

const PartEditorPage = () => {
  const router = useRouter()
  const params = useParams()
  
  // ... your existing code
  
  return (
    <Layout>
      {/* ... your existing JSX */}
    </Layout>
  )
}

export default PartEditorPage
```

### Add Protection (Just 2 lines!)

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Layout, Typography, Tabs, Button } from 'antd'
import { useRouter, useParams } from 'next/navigation'
import { testManagementApi } from '@/services/testManagementApi'
import { withAuth } from '@/components/auth/withAuth' // ADD THIS

const PartEditorPage = () => {
  const router = useRouter()
  const params = useParams()
  
  // ... your existing code
  
  return (
    <Layout>
      {/* ... your existing JSX */}
    </Layout>
  )
}

export default withAuth(PartEditorPage, { requireAdmin: true }) // ADD THIS
```

## Protecting All Admin Pages at Once

You can also protect an entire section by adding a layout:

**File:** `src/app/admin/layout.tsx`
```tsx
'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAdmin={true}>
      {children}
    </ProtectedRoute>
  )
}
```

Now ALL pages under `/admin/*` are automatically protected!

## Checking Auth in Components

If you need to conditionally show/hide elements based on auth:

```tsx
'use client'

import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'

const MyComponent = observer(() => {
  const { authStore } = useStore()
  
  return (
    <div>
      {/* Show to all authenticated users */}
      {authStore.isAuthenticated && (
        <div>Welcome, {authStore.user?.firstName}!</div>
      )}
      
      {/* Show only to admins */}
      {authStore.isAdmin && (
        <Button>Admin Action</Button>
      )}
      
      {/* Show to non-authenticated users */}
      {!authStore.isAuthenticated && (
        <div>Please sign in</div>
      )}
    </div>
  )
})
```

## Pages That Need Protection

### Admin Pages (Require Admin Role)
- [ ] `/admin` - Admin dashboard
- [ ] `/admin/test/*` - Test management pages
- [ ] `/admin/test/[testId]/section/*` - Section editor pages
- [ ] `/admin/test/[testId]/section/[sectionType]/part/*` - Part editor pages

### User Pages (Require Authentication)
- [ ] `/test/[testId]` - Test taking page
- [ ] `/results/*` - Results pages
- [ ] `/profile` - User profile page

### Public Pages (No Protection)
- ✅ `/auth/signin` - Sign in page
- ✅ `/auth/signup` - Sign up page
- ✅ `/` - Home page (can show content based on auth state)

## Quick Protection Script

Here's what to add to each admin page file:

1. **Add import at the top:**
```tsx
import { withAuth } from '@/components/auth/withAuth'
```

2. **Change export at the bottom:**
```tsx
// Before:
export default MyPage

// After:
export default withAuth(MyPage, { requireAdmin: true })
```

## Testing Protection

1. **Test unauthenticated access:**
   - Open incognito/private window
   - Try to access `/admin`
   - Should redirect to `/auth/signin`

2. **Test regular user access:**
   - Sign in as regular user (role: USER)
   - Try to access `/admin`
   - Should redirect to `/` (home)

3. **Test admin access:**
   - Sign in as admin (role: ADMIN)
   - Access `/admin`
   - Should work normally

## Adding User Menu to Admin Layout

Update your admin layout to include the user menu:

```tsx
'use client'

import { Layout } from 'antd'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { UserMenu } from '@/components/auth/UserMenu'

const { Header, Content } = Layout

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireAdmin={true}>
      <Layout>
        <Header className="flex justify-between items-center">
          <div className="text-white text-xl font-bold">Admin Dashboard</div>
          <UserMenu />
        </Header>
        <Content className="p-6">
          {children}
        </Content>
      </Layout>
    </ProtectedRoute>
  )
}
```

Now all admin pages will have:
- ✅ Authentication protection
- ✅ Admin role requirement
- ✅ User menu with sign out
- ✅ Consistent header

## API Calls Are Already Protected

Good news! All API calls in `testManagementApi.ts` are already configured to:
- ✅ Automatically include the auth token
- ✅ Automatically redirect to signin on 401 errors
- ✅ Work seamlessly with the auth system

No changes needed to your existing API calls!

## Summary

To protect admin pages:
1. Add one import line
2. Change the export to use `withAuth`
3. Done! ✅

The auth system handles:
- Token storage
- Token injection in API calls
- Automatic redirects
- Role validation
- Error handling
- User menu
- Sign out

You just focus on building features! 🚀

# Logout Button Guide

## Where to Find the Logout Button

The logout button is located in the **User Menu** in the top-right corner of the application.

### Visual Location

```
┌─────────────────────────────────────────────────────────┐
│  IELTS Mock Platform              [Avatar] User Name ▼  │ ← Click here
└─────────────────────────────────────────────────────────┘
                                            │
                                            ▼
                              ┌──────────────────────────┐
                              │  John Doe                │
                              │  @johndoe                │
                              │  Role: ADMIN             │
                              ├──────────────────────────┤
                              │  🏢 Admin Dashboard      │ ← Only for admins
                              │  ⚙️  Profile Settings     │
                              ├──────────────────────────┤
                              │  🚪 Sign Out             │ ← Logout button (RED)
                              └──────────────────────────┘
```

## How to Use

### Step-by-Step

1. **Look at the top-right corner** of the page
2. **Click on your avatar** or name (shows user icon and name)
3. **Dropdown menu appears** with user info and options
4. **Click "Sign Out"** (red button at bottom with logout icon)
5. **Automatically redirected** to sign-in page
6. **Token deleted** from browser storage

### What Happens When You Logout

```
User clicks "Sign Out"
         ↓
AuthStore.signOut() called
         ↓
┌─────────────────────────────────┐
│  Clear MobX State:              │
│  - user = null                  │
│  - isAuthenticated = false      │
│  - error = null                 │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  Clear Browser Storage:         │
│  - Remove authToken             │
│  - Remove user data             │
└─────────────────────────────────┘
         ↓
Redirect to /auth/signin
         ↓
User can sign in again
```

## Adding User Menu to Your Layout

If you need to add the UserMenu to a page that doesn't have it:

### Example: Add to Layout

```tsx
// src/app/layout.tsx or any page
import { UserMenu } from '@/components/auth/UserMenu'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <header className="flex justify-between items-center p-4 bg-white shadow">
          <div className="text-xl font-bold">IELTS Mock</div>
          <UserMenu />  {/* ← Add this */}
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
```

### Example: Add to Admin Layout

```tsx
// src/app/admin/layout.tsx
'use client'

import { Layout } from 'antd'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { UserMenu } from '@/components/auth/UserMenu'

const { Header, Content } = Layout

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute requireAdmin={true}>
      <Layout className="min-h-screen">
        <Header className="flex justify-between items-center px-6">
          <div className="text-white text-xl font-bold">
            Admin Dashboard
          </div>
          <UserMenu />  {/* ← Logout button appears here */}
        </Header>
        <Content className="p-6">
          {children}
        </Content>
      </Layout>
    </ProtectedRoute>
  )
}
```

## User Menu Features

### For All Users
- ✅ User avatar (default icon)
- ✅ User full name
- ✅ Username
- ✅ Role display
- ✅ Profile Settings link (goes to `/profile`)
- ✅ **Sign Out button** (red, with logout icon)

### For Admin Users Only
- ✅ All above features
- ✅ **Admin badge** (blue badge next to name)
- ✅ **Admin Dashboard link** (goes to `/admin`)

## Logout Button Details

### Visual Appearance
- **Color:** Red (danger style)
- **Icon:** 🚪 Logout icon (LogoutOutlined from Ant Design)
- **Text:** "Sign Out"
- **Position:** Last item in dropdown menu

### Code Reference

```tsx
// From UserMenu.tsx
{
  key: 'signout',
  label: 'Sign Out',
  icon: <LogoutOutlined />,
  danger: true,  // Makes it red
  onClick: () => authStore.signOut(),  // Triggers logout
}
```

## Testing Logout

### Manual Test
```bash
1. Sign in to the app
2. Open Browser DevTools (F12)
3. Go to Application → Local Storage
4. Verify authToken and user exist
5. Click user avatar → Click "Sign Out"
6. Check:
   ✅ Redirected to /auth/signin
   ✅ authToken removed from storage
   ✅ user removed from storage
```

### Console Test
```javascript
// Before logout
console.log(localStorage.getItem('authToken'))  // Shows JWT token

// After logout
console.log(localStorage.getItem('authToken'))  // Returns null
```

## Troubleshooting

### Logout Button Not Visible
- **Check:** Is user authenticated? Menu only shows when signed in
- **Check:** Is UserMenu component added to your layout?
- **Fix:** Add `<UserMenu />` to your header

### Logout Doesn't Redirect
- **Check:** Console for errors
- **Check:** `window.location.href` is being set
- **Fix:** Ensure browser allows redirects

### Token Still Exists After Logout
- **Check:** localStorage in DevTools
- **Check:** Console errors
- **Fix:** Verify `localStorage.removeItem()` is called

### Can Still Access Protected Pages After Logout
- **Issue:** Browser cache
- **Fix:** Hard refresh (Ctrl+F5) or clear browser cache

## Alternative Logout Methods

### Programmatic Logout

```tsx
import { useStore } from '@/stores/StoreContext'

const MyComponent = () => {
  const { authStore } = useStore()
  
  const handleLogout = () => {
    authStore.signOut()  // Same as clicking button
  }
  
  return <button onClick={handleLogout}>Logout</button>
}
```

### Direct API Call

```tsx
import { auth } from '@/services/authApi'

const handleLogout = () => {
  auth.signOut()  // Directly call service
}
```

### Both Methods Do the Same Thing
1. Clear tokens from localStorage
2. Clear auth state in MobX
3. Redirect to `/auth/signin`

## Summary

✅ **Logout button is in the User Menu** (top-right corner)  
✅ **Click avatar → Click "Sign Out"** to logout  
✅ **Automatically clears tokens** from localStorage  
✅ **Automatically redirects** to sign-in page  
✅ **Works for all users** (both admin and regular)  

The logout functionality is **fully implemented and ready to use**! 🎉

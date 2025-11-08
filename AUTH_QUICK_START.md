# Authentication Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Test the API with cURL

Open your terminal and test sign up:

```bash
# Sign Up
curl -X POST "https://mock.fleetoneld.com/ielts-mock-main/auth/sign-up" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "username": "testuser",
    "password": "test123"
  }'

# Sign In
curl -X POST "https://mock.fleetoneld.com/ielts-mock-main/auth/sign-in" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123"
  }'

# Save the token from the response, then test /me endpoint:
curl -X GET "https://mock.fleetoneld.com/ielts-mock-main/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 2: Run the Application

```bash
npm run dev
```

Navigate to:
- Sign Up: http://localhost:3000/auth/signup
- Sign In: http://localhost:3000/auth/signin

### Step 3: Protect Your Pages

#### Option A: Using Component Wrapper
```tsx
'use client'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>Your protected content</div>
    </ProtectedRoute>
  )
}
```

#### Option B: Using HOC (Recommended)
```tsx
'use client'
import { withAuth } from '@/components/auth/withAuth'

function MyPage() {
  return <div>Your protected content</div>
}

export default withAuth(MyPage)
```

#### Option C: Admin-Only Page
```tsx
'use client'
import { withAuth } from '@/components/auth/withAuth'

function AdminPage() {
  return <div>Admin only content</div>
}

export default withAuth(AdminPage, { requireAdmin: true })
```

### Step 4: Add User Menu to Your Layout

```tsx
// src/app/layout.tsx
import { UserMenu } from '@/components/auth/UserMenu'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <header>
          <nav className="flex justify-between items-center p-4">
            <div>IELTS Mock</div>
            <UserMenu />
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
```

### Step 5: Use Auth in Components

```tsx
'use client'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'

const MyComponent = observer(() => {
  const { authStore } = useStore()

  return (
    <div>
      {authStore.isAuthenticated ? (
        <div>
          <h1>Welcome {authStore.user?.firstName}!</h1>
          {authStore.isAdmin && <p>🔐 Admin Access</p>}
        </div>
      ) : (
        <div>Please sign in</div>
      )}
    </div>
  )
})
```

## 📋 Common Tasks

### Check if User is Authenticated
```tsx
const { authStore } = useStore()
if (authStore.isAuthenticated) {
  // User is signed in
}
```

### Check if User is Admin
```tsx
const { authStore } = useStore()
if (authStore.isAdmin) {
  // User has admin role
}
```

### Get Current User Info
```tsx
const { authStore } = useStore()
const user = authStore.user // { id, firstName, lastName, username, role }
```

### Sign Out Programmatically
```tsx
const { authStore } = useStore()
authStore.signOut() // Clears auth and redirects
```

### Handle Auth Errors
```tsx
try {
  await authStore.signIn({ username, password })
} catch (error) {
  console.error(authStore.error) // User-friendly error message
}
```

## 🔧 Debugging Tips

### 1. Check Token in Browser
Open DevTools → Application → Local Storage → Check for `authToken`

### 2. Check API Requests
Open DevTools → Network → Look for requests with `Authorization: Bearer ...`

### 3. Check Auth State
```tsx
console.log('Auth State:', {
  isAuthenticated: authStore.isAuthenticated,
  user: authStore.user,
  isAdmin: authStore.isAdmin
})
```

### 4. Clear Auth State (for testing)
```javascript
localStorage.removeItem('authToken')
localStorage.removeItem('user')
window.location.reload()
```

## 🎯 Key Files Reference

| File | Purpose |
|------|---------|
| `src/services/authApi.ts` | Auth API calls & token utils |
| `src/stores/AuthStore.ts` | Auth state management |
| `src/app/auth/signin/page.tsx` | Sign in page |
| `src/app/auth/signup/page.tsx` | Sign up page |
| `src/components/auth/ProtectedRoute.tsx` | Route protection component |
| `src/components/auth/withAuth.tsx` | HOC for protection |
| `src/components/auth/UserMenu.tsx` | User menu with sign out |

## 🔐 Security Notes

1. **Token Storage**: Currently using localStorage (consider httpOnly cookies for production)
2. **Auto Logout**: Token expiration (401) automatically signs user out
3. **Role Validation**: Always validate roles on the server side
4. **HTTPS**: Use HTTPS in production
5. **Token in Headers**: Token automatically added to all API requests

## 📱 API Response Examples

### Sign Up Success
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "role": "USER"
  }
}
```

### Sign In Success
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "role": "ADMIN"
  }
}
```

### Get Me Success
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "role": "USER"
}
```

## 🚨 Common Issues

### "Token not found" Error
- Sign in again
- Check localStorage has `authToken`
- Verify API is returning token

### Redirect Loop
- Clear localStorage
- Check auth pages don't have protection
- Verify redirect paths

### Role Check Not Working
- Verify API returns `role` field
- Check `authStore.user.role` value
- Ensure role is stored in localStorage

### API Returns 401
- Token expired - sign in again
- Token invalid - clear and sign in
- Check token format in headers

## 📞 Need Help?

See `AUTH_IMPLEMENTATION.md` for detailed documentation including:
- Complete API reference
- Advanced usage patterns
- TypeScript types
- Security best practices
- Troubleshooting guide

## ✅ Checklist for Production

- [ ] Switch to httpOnly cookies for token storage
- [ ] Implement token refresh mechanism
- [ ] Add password strength requirements
- [ ] Implement rate limiting on auth endpoints
- [ ] Add email verification
- [ ] Add password reset flow
- [ ] Implement session timeout warnings
- [ ] Add audit logging for admin actions
- [ ] Set up monitoring for failed auth attempts
- [ ] Configure CORS properly
- [ ] Use environment variables for API URLs
- [ ] Add 2FA for admin accounts

# Authentication Implementation Guide

## Overview

This document describes the complete authentication system implemented for the IELTS Mock platform, including user/admin roles, token management, and protected routes.

## Architecture

### Components

1. **Auth API Service** (`src/services/authApi.ts`)
   - HTTP client for authentication endpoints
   - Token management utilities
   - Role checking helpers

2. **Auth Store** (`src/stores/AuthStore.ts`)
   - MobX store for authentication state
   - User session management
   - Auth persistence with localStorage

3. **Protected Routes** (`src/components/auth/`)
   - `ProtectedRoute.tsx` - Component wrapper for protected pages
   - `withAuth.tsx` - HOC for protecting pages
   - `UserMenu.tsx` - User menu with profile and sign out

4. **Auth Pages** (`src/app/auth/`)
   - `signin/page.tsx` - Sign in page
   - `signup/page.tsx` - Sign up page

## API Endpoints

Base URL: `https://mock.fleetoneld.com/ielts-mock-main`

### 1. Sign Up
**Endpoint:** `POST /auth/sign-up`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "role": "USER"
  }
}
```

**cURL:**
```bash
curl -X POST "https://mock.fleetoneld.com/ielts-mock-main/auth/sign-up" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "password": "password123"
  }'
```

### 2. Sign In
**Endpoint:** `POST /auth/sign-in`

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "role": "USER"
  }
}
```

**cURL:**
```bash
curl -X POST "https://mock.fleetoneld.com/ielts-mock-main/auth/sign-in" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

### 3. Get Current User
**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response:**
```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "role": "USER"
}
```

**cURL:**
```bash
curl -X GET "https://mock.fleetoneld.com/ielts-mock-main/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Swagger Sign In
**Endpoint:** `POST /auth/swagger/sign-in`

Used for authenticating in Swagger UI. Same request/response as regular sign in.

**cURL:**
```bash
curl -X POST "https://mock.fleetoneld.com/ielts-mock-main/auth/swagger/sign-in" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

## User Roles

The system supports two roles:

1. **USER** - Regular users who can:
   - Take IELTS mock tests
   - View their results
   - Access user-facing features

2. **ADMIN** - Administrators who can:
   - All USER permissions
   - Access admin dashboard
   - Manage tests and content
   - View all user submissions

## Token Management

### Storage
- Tokens are stored in `localStorage` under the key `authToken`
- User data is stored in `localStorage` under the key `user`

### Automatic Injection
Both API services automatically inject the token:
- `authApi.ts` - Auth endpoints
- `testManagementApi.ts` - Test management endpoints

### Token Expiration Handling
- 401 responses automatically clear auth state
- Users are redirected to `/auth/signin`
- Implemented in both API interceptors

## Usage Examples

### 1. Protecting a Page with Component Wrapper

```tsx
'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>Protected content here</div>
    </ProtectedRoute>
  )
}
```

### 2. Protecting a Page with HOC

```tsx
'use client'

import { withAuth } from '@/components/auth/withAuth'

function MyPage() {
  return <div>Protected content here</div>
}

export default withAuth(MyPage)
```

### 3. Admin-Only Page

```tsx
'use client'

import { withAuth } from '@/components/auth/withAuth'

function AdminPage() {
  return <div>Admin content here</div>
}

export default withAuth(AdminPage, { requireAdmin: true })
```

### 4. Using Auth Store in Components

```tsx
'use client'

import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'

const MyComponent = observer(() => {
  const { authStore } = useStore()

  if (!authStore.isAuthenticated) {
    return <div>Please sign in</div>
  }

  return (
    <div>
      <h1>Welcome, {authStore.user?.firstName}!</h1>
      {authStore.isAdmin && <p>You are an admin</p>}
      <button onClick={() => authStore.signOut()}>Sign Out</button>
    </div>
  )
})
```

### 5. Programmatic Sign In

```tsx
const { authStore } = useStore()

try {
  await authStore.signIn({
    username: 'johndoe',
    password: 'password123'
  })
  
  // Redirect based on role
  if (authStore.isAdmin) {
    router.push('/admin')
  } else {
    router.push('/')
  }
} catch (error) {
  console.error('Sign in failed:', error)
}
```

### 6. Programmatic Sign Up

```tsx
const { authStore } = useStore()

try {
  await authStore.signUp({
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    password: 'password123'
  })
  
  router.push('/')
} catch (error) {
  console.error('Sign up failed:', error)
}
```

### 7. Adding User Menu to Layout

```tsx
import { UserMenu } from '@/components/auth/UserMenu'

export default function Layout({ children }) {
  return (
    <div>
      <header>
        <nav>
          <div>Logo</div>
          <UserMenu />
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
```

## Auth Store API

### Properties
- `user: UserDto | null` - Current user data
- `isAuthenticated: boolean` - Authentication status
- `isLoading: boolean` - Loading state for auth operations
- `error: string | null` - Error message if auth fails
- `isAdmin: boolean` (getter) - Check if user is admin

### Methods
- `signUp(data: SignUpDto): Promise<AuthResponse>` - Register new user
- `signIn(data: SignInDto): Promise<AuthResponse>` - Sign in existing user
- `signOut(): void` - Sign out and clear session
- `verifyAuth(): Promise<void>` - Verify current token is valid
- `hasRole(role: 'USER' | 'ADMIN'): boolean` - Check user role
- `clearError(): void` - Clear error message

## Auth Service API

### Methods
- `auth.signUp(data)` - Register new user
- `auth.signIn(data)` - Sign in user
- `auth.getMe()` - Get current user
- `auth.signOut()` - Clear auth state and redirect
- `auth.isAuthenticated()` - Check if user is authenticated
- `auth.getToken()` - Get stored token
- `auth.getUser()` - Get stored user
- `auth.storeAuth(token, user)` - Store auth data
- `auth.isAdmin()` - Check if user is admin
- `auth.hasRole(role)` - Check specific role

## Security Best Practices

1. **Token Storage**: Tokens are stored in localStorage (consider httpOnly cookies for production)
2. **Auto-redirect**: Expired tokens automatically redirect to sign in
3. **Role Validation**: Server-side role validation is required
4. **HTTPS**: Always use HTTPS in production
5. **Token Refresh**: Consider implementing token refresh mechanism

## Testing Authentication

### Test User Flow
1. Navigate to `/auth/signup`
2. Create a new account
3. Verify redirect to home or admin based on role
4. Check that token is stored in localStorage
5. Refresh page - should remain authenticated
6. Navigate to protected routes - should work
7. Sign out - should clear auth and redirect

### Test Admin Flow
1. Sign in as admin user
2. Verify admin badge in user menu
3. Access admin-only routes
4. Check that regular users cannot access admin routes

### Test Token Expiration
1. Sign in
2. Manually clear token from localStorage
3. Make an API request
4. Should redirect to signin page

## Troubleshooting

### Token Not Being Sent
- Check `authToken` exists in localStorage
- Verify axios interceptor is configured
- Check browser console for API requests

### Infinite Redirect Loop
- Clear localStorage
- Check that signin/signup pages don't require auth
- Verify redirect paths are correct

### Role-Based Access Not Working
- Verify user role in localStorage
- Check server returns correct role in response
- Ensure `authStore.user.role` is set correctly

## Next Steps

1. **Add profile page** at `/profile` for users to edit their info
2. **Implement password reset** flow
3. **Add token refresh** mechanism
4. **Add email verification** for new accounts
5. **Implement remember me** functionality
6. **Add session timeout** warning
7. **Add audit logging** for admin actions
8. **Implement 2FA** for admin accounts

## File Structure

```
src/
├── app/
│   └── auth/
│       ├── signin/
│       │   └── page.tsx          # Sign in page
│       └── signup/
│           └── page.tsx          # Sign up page
├── components/
│   └── auth/
│       ├── ProtectedRoute.tsx   # Protected route wrapper
│       ├── withAuth.tsx         # HOC for protected pages
│       └── UserMenu.tsx         # User menu component
├── services/
│   ├── authApi.ts              # Auth API service
│   └── testManagementApi.ts    # Test API (with auth)
└── stores/
    ├── AuthStore.ts            # Auth state management
    └── RootStore.ts            # Root store (includes AuthStore)
```

## API Response Types

All API responses follow this structure:

```typescript
interface ResponseDto<T> {
  success: boolean
  reason: string | null
  count: number
  totalCount: number
  data: T
}
```

For auth endpoints, the data structure is implementation-specific and may return:
- Token as string
- User object
- Combined auth response

Check the actual API responses for exact format.

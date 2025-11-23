import axios from 'axios'

const BASE_URL = 'https://mock.fleetoneld.com/ielts-mock-main'

// Configure axios instance for auth
const authApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for authentication token
authApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      const fullUrl = `${config.baseURL}${config.url || ''}`
      console.log('🔐 Auth API Request:', fullUrl)
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for handling auth errors
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth state (only in browser)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        window.location.href = '/auth/signin'
      }
    }
    return Promise.reject(error)
  }
)

// Types
export interface SignUpDto {
  firstName: string
  lastName: string
  username: string
  password: string
}

export interface SignInDto {
  username: string
  password: string
}

export interface AuthResponse {
  success: boolean
  reason?: string
  data?: any
  token?: string
  user?: UserDto
  role?: string
  // API might return user with role directly
  id?: string
  firstName?: string
  lastName?: string
  username?: string
}

export interface UserDto {
  id?: string
  firstName: string
  lastName: string
  username: string
  role: 'USER' | 'ADMIN'
  roles?: string[]  // API returns roles array
}

// Helper function to extract token and user from various response formats
const parseAuthResponse = (responseData: any): { token: string; user: UserDto } => {
  console.log('🔍 Parsing auth response:', responseData)
  
  let token: string | null = null
  let user: Partial<UserDto> = {}

  // Try to find token in various places
  if (typeof responseData === 'string') {
    // If response is just a JWT string
    token = responseData
  } else if (responseData.token) {
    token = responseData.token
  } else if (responseData.data && typeof responseData.data === 'string') {
    // Token might be in data field as string
    token = responseData.data
  } else if (responseData.data && responseData.data.token) {
    token = responseData.data.token
  }

  // Helper to determine role from roles array or single role
  const getRoleFromData = (data: any): 'ADMIN' | 'USER' => {
    // Check if roles array contains ADMIN
    if (data.roles && Array.isArray(data.roles)) {
      return data.roles.includes('ADMIN') ? 'ADMIN' : 'USER'
    }
    // Fallback to single role field
    if (data.role) {
      return data.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER'
    }
    return 'USER'
  }

  // Try to find user info
  if (responseData.user) {
    user = {
      ...responseData.user,
      role: getRoleFromData(responseData.user)
    }
  } else if (responseData.data && responseData.data.user) {
    user = {
      ...responseData.data.user,
      role: getRoleFromData(responseData.data.user)
    }
  } else if (responseData.id) {
    // User fields might be at root level
    user = {
      id: responseData.id,
      firstName: responseData.firstName,
      lastName: responseData.lastName,
      username: responseData.username,
      role: getRoleFromData(responseData),
    }
  } else if (responseData.data && responseData.data.id) {
    user = {
      id: responseData.data.id,
      firstName: responseData.data.firstName,
      lastName: responseData.data.lastName,
      username: responseData.data.username,
      role: getRoleFromData(responseData.data),
    }
  } else if (responseData.data) {
    // New format: data contains user fields directly
    const data = responseData.data
    user = {
      id: data.id || data.username,  // Use username as ID if no ID
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      role: getRoleFromData(data),
    }
  }

  // If we found a token but no user, try to decode JWT to get user info
  if (token && !user.id) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      console.log('📦 Decoded JWT payload:', payload)
      user = {
        id: payload.sub || payload.userId || payload.id,
        firstName: payload.firstName || payload.first_name,
        lastName: payload.lastName || payload.last_name,
        username: payload.username || payload.sub,
        role: getRoleFromData(payload),  // Use the same helper for consistency
        roles: payload.roles || payload.authorities,
      }
    } catch (e) {
      console.error('❌ Failed to decode JWT:', e)
    }
  }

  if (!token) {
    console.error('❌ No token found in response')
    throw new Error('No token found in authentication response')
  }

  console.log('✅ Extracted token and user:', { token: token.substring(0, 20) + '...', user })

  return {
    token,
    user: {
      id: user.id || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      role: user.role || 'USER',  // Role already determined by getRoleFromData
      roles: user.roles,  // Preserve roles array
    },
  }
}

// Auth Service
export const auth = {
  // Sign up new user
  signUp: async (data: SignUpDto): Promise<{ token: string; user: UserDto }> => {
    const response = await authApi.post('/auth/sign-up', data)
    return parseAuthResponse(response.data)
  },

  // Sign in existing user
  signIn: async (data: SignInDto): Promise<{ token: string; user: UserDto }> => {
    const response = await authApi.post('/auth/sign-in', data)
    return parseAuthResponse(response.data)
  },

  // Get current user info
  getMe: async (): Promise<UserDto> => {
    const response = await authApi.get('/auth/me')
    const respData = response.data
    
    console.log('📱 /me endpoint response:', respData)
    
    // Helper to determine role from roles array or single role
    const getRoleFromData = (data: any): 'ADMIN' | 'USER' => {
      if (data.roles && Array.isArray(data.roles)) {
        return data.roles.includes('ADMIN') ? 'ADMIN' : 'USER'
      }
      if (data.role) {
        return data.role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER'
      }
      return 'USER'
    }
    
    // Parse user from /me endpoint - handle various formats
    let userData: any = null
    
    if (respData.data) {
      userData = respData.data
    } else if (respData.user) {
      userData = respData.user
    } else if (respData.username) {
      userData = respData
    }
    
    if (!userData) {
      throw new Error('Invalid response from /me endpoint')
    }
    
    const user: UserDto = {
      id: userData.id || userData.username,  // Use username as fallback ID
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: userData.username,
      role: getRoleFromData(userData),
      roles: userData.roles,  // Store original roles array
    }
    
    console.log('✅ Parsed user from /me:', user)
    return user
  },

  // Sign out (clear local storage)
  signOut: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      window.location.href = '/auth/signin'
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('authToken')
  },

  // Get stored token
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('authToken')
  },

  // Get stored user
  getUser: (): UserDto | null => {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  // Store auth data
  storeAuth: (token: string, user: UserDto) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token)
      localStorage.setItem('user', JSON.stringify(user))
    }
  },

  // Check if user has admin role
  isAdmin: (): boolean => {
    const user = auth.getUser()
    return user?.role === 'ADMIN'
  },

  // Check if user has specific role
  hasRole: (role: 'USER' | 'ADMIN'): boolean => {
    const user = auth.getUser()
    return user?.role === role
  },
}

export default authApi

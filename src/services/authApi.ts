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
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    if (typeof window !== 'undefined') {
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
      // Token expired or invalid - clear auth state
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      if (typeof window !== 'undefined') {
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
  id: string
  firstName: string
  lastName: string
  username: string
  role: 'USER' | 'ADMIN'
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

  // Try to find user info
  if (responseData.user) {
    user = responseData.user
  } else if (responseData.data && responseData.data.user) {
    user = responseData.data.user
  } else if (responseData.id) {
    // User fields might be at root level
    user = {
      id: responseData.id,
      firstName: responseData.firstName,
      lastName: responseData.lastName,
      username: responseData.username,
      role: responseData.role || 'USER',
    }
  } else if (responseData.data && responseData.data.id) {
    user = {
      id: responseData.data.id,
      firstName: responseData.data.firstName,
      lastName: responseData.data.lastName,
      username: responseData.data.username,
      role: responseData.data.role || 'USER',
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
        role: payload.role || payload.authorities?.[0] || 'USER',
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
      role: (user.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER') as 'USER' | 'ADMIN',
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
    const data = response.data
    
    // Parse user from /me endpoint
    if (data.user) {
      return data.user
    } else if (data.data) {
      return data.data
    } else if (data.id) {
      return {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        role: (data.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER') as 'USER' | 'ADMIN',
      }
    }
    
    throw new Error('Invalid response from /me endpoint')
  },

  // Sign out (clear local storage)
  signOut: () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin'
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken')
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('authToken')
  },

  // Get stored user
  getUser: (): UserDto | null => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  // Store auth data
  storeAuth: (token: string, user: UserDto) => {
    localStorage.setItem('authToken', token)
    localStorage.setItem('user', JSON.stringify(user))
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

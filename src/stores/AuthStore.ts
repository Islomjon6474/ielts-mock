import { makeAutoObservable, runInAction } from 'mobx'
import { auth, UserDto, SignInDto, SignUpDto } from '@/services/authApi'

export class AuthStore {
  user: UserDto | null = null
  isAuthenticated: boolean = false
  isLoading: boolean = false
  error: string | null = null

  constructor() {
    makeAutoObservable(this)
    // Initialize from localStorage on creation
    this.initializeAuth()
  }

  // Initialize auth state from localStorage
  initializeAuth() {
    if (typeof window !== 'undefined') {
      const token = auth.getToken()
      const user = auth.getUser()
      
      if (token && user) {
        runInAction(() => {
          this.user = user
          this.isAuthenticated = true
        })
        
        // Verify token is still valid
        this.verifyAuth()
      }
    }
  }

  // Verify auth by calling /me endpoint
  async verifyAuth() {
    try {
      const user = await auth.getMe()
      runInAction(() => {
        this.user = user
        this.isAuthenticated = true
        auth.storeAuth(auth.getToken()!, user)
      })
    } catch (error) {
      console.error('Auth verification failed:', error)
      this.signOut()
    }
  }

  // Sign up new user
  async signUp(data: SignUpDto) {
    runInAction(() => {
      this.isLoading = true
      this.error = null
    })

    try {
      const response = await auth.signUp(data)
      
      console.log('✅ Sign up successful:', response)
      
      runInAction(() => {
        this.user = response.user
        this.isAuthenticated = true
        this.isLoading = false
      })

      // Store token and user
      auth.storeAuth(response.token, response.user)
      
      console.log('💾 Stored auth data:', {
        token: response.token.substring(0, 20) + '...',
        user: response.user
      })

      return response
    } catch (error: any) {
      console.error('❌ Sign up error:', error)
      const errorMessage = error.response?.data?.reason 
        || error.response?.data?.message 
        || error.message 
        || 'Sign up failed. Please try again.'
      
      runInAction(() => {
        this.error = errorMessage
        this.isLoading = false
      })
      throw error
    }
  }

  // Sign in existing user
  async signIn(data: SignInDto) {
    runInAction(() => {
      this.isLoading = true
      this.error = null
    })

    try {
      const response = await auth.signIn(data)
      
      console.log('✅ Sign in successful:', response)
      
      runInAction(() => {
        this.user = response.user
        this.isAuthenticated = true
        this.isLoading = false
      })

      // Store token and user
      auth.storeAuth(response.token, response.user)
      
      console.log('💾 Stored auth data:', {
        token: response.token.substring(0, 20) + '...',
        user: response.user
      })

      return response
    } catch (error: any) {
      console.error('❌ Sign in error:', error)
      const errorMessage = error.response?.data?.reason 
        || error.response?.data?.message 
        || error.message 
        || 'Sign in failed. Please check your credentials.'
      
      runInAction(() => {
        this.error = errorMessage
        this.isLoading = false
      })
      throw error
    }
  }

  // Sign out
  signOut() {
    runInAction(() => {
      this.user = null
      this.isAuthenticated = false
      this.error = null
    })
    auth.signOut()
  }

  // Check if user is admin
  get isAdmin(): boolean {
    return this.user?.role === 'ADMIN'
  }

  // Check if user has specific role
  hasRole(role: 'USER' | 'ADMIN'): boolean {
    return this.user?.role === role
  }

  // Clear error
  clearError() {
    runInAction(() => {
      this.error = null
    })
  }
}

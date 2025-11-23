import authApi from './authApi'

// Types
export interface StudentDto {
  id?: string
  firstName: string
  lastName: string
  username: string
  password?: string
  roles?: string[]
  createdDate?: string
}

export interface ChangePasswordDto {
  id: string
  password: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  reason?: string
  totalCount?: number
}

export interface PageableResponse<T> {
  content: T[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    offset: number
    paged: boolean
    unpaged: boolean
  }
  last: boolean
  totalPages: number
  totalElements: number
  size: number
  number: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  first: boolean
  numberOfElements: number
  empty: boolean
}

// User Management API Service
export const userManagementApi = {
  /**
   * Get all students
   * GET /users/get-all?page={page}&size={size}
   */
  getAllStudents: async (page: number = 0, size: number = 100): Promise<ApiResponse<StudentDto[]>> => {
    try {
      const response = await authApi.get('/users/get-all', {
        params: {
          page,
          size
        }
      })
      console.log('📋 Get all students response:', response.data)
      
      // Handle Spring Boot Pageable response format
      if (response.data.content && Array.isArray(response.data.content)) {
        const pageableResponse = response.data as PageableResponse<StudentDto>
        return {
          success: true,
          data: pageableResponse.content,
          totalCount: pageableResponse.totalElements
        }
      }
      // Handle direct array response
      else if (Array.isArray(response.data)) {
        return {
          success: true,
          data: response.data,
          totalCount: response.data.length
        }
      }
      // Handle wrapped response with data field
      else if (response.data.data && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data,
          totalCount: response.data.totalCount || response.data.data.length
        }
      }
      // Handle success wrapper
      else if (response.data.success && response.data.data) {
        return response.data
      }
      
      return {
        success: true,
        data: [],
        totalCount: 0
      }
    } catch (error: any) {
      console.error('❌ Error fetching students:', error)
      throw error
    }
  },

  /**
   * Create a new student
   * POST /users/save-student
   * Body: { firstName, lastName, username, password }
   */
  createStudent: async (student: StudentDto): Promise<ApiResponse<StudentDto>> => {
    try {
      const payload = {
        firstName: student.firstName,
        lastName: student.lastName,
        username: student.username,
        password: student.password
      }
      
      console.log('👤 Creating student:', payload)
      const response = await authApi.post('/users/save-student', payload)
      console.log('✅ Create student response:', response.data)
      
      // Handle different response formats
      if (response.data.success) {
        return response.data
      } else if (response.data.id || response.data.username) {
        return {
          success: true,
          data: response.data
        }
      }
      
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      console.error('❌ Error creating student:', error)
      throw error
    }
  },

  /**
   * Change student password
   * PUT /users/change-password
   * Body: { id, password }
   */
  changePassword: async (data: ChangePasswordDto): Promise<ApiResponse<void>> => {
    try {
      const payload = {
        id: data.id,
        password: data.password
      }
      
      console.log('🔑 Changing password for user ID:', data.id)
      const response = await authApi.put('/users/change-password', payload)
      console.log('✅ Change password response:', response.data)
      
      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      console.error('❌ Error changing password:', error)
      throw error
    }
  }
}

export default userManagementApi

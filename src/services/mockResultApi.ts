import authApi from './authApi'

// Types
export interface GradeWritingDto {
  writingAnswer: string
  writingQuestion: string
  writingType: string
}

export interface SaveWritingGradeDto {
  mockId: string
  sectionId: string
  writingPartOneScore: number
  writingPartTwoScore: number
}

export interface WritingGradeResult {
  score: number
  feedback: string
  taskAchievement?: number
  coherenceCohesion?: number
  lexicalResource?: number
  grammaticalRange?: number
}

export interface SectionResult {
  sectionType: 'LISTENING' | 'READING' | 'WRITING'
  status: string
  correctAnswers?: number
  score?: number
}

export interface MockResultDto {
  id: string
  testId: string
  testName?: string
  userId: string
  userName?: string
  userFirstName?: string
  userLastName?: string
  startDate?: string
  startedDate?: string
  finishedDate?: string
  status: string
  sections?: SectionResult[]
  listeningScore?: number
  readingScore?: number
  writingScore?: number
  totalScore?: number
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

// Mock Result API Service
export const mockResultApi = {
  /**
   * Grade writing submission
   * POST /mock-result/grade-writing
   * Body: { writingAnswer, writingQuestion, writingType }
   */
  gradeWriting: async (data: GradeWritingDto): Promise<ApiResponse<WritingGradeResult>> => {
    try {
      const payload = {
        writingAnswer: data.writingAnswer,
        writingQuestion: data.writingQuestion,
        writingType: data.writingType
      }
      
      console.log('📝 Grading writing submission:', { writingType: data.writingType })
      const response = await authApi.post('/mock-result/grade-writing', payload)
      console.log('✅ Grade writing response:', response.data)
      
      // Handle different response formats
      if (response.data.success) {
        return response.data
      } else if (response.data.score !== undefined) {
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
      console.error('❌ Error grading writing:', error)
      throw error
    }
  },

  /**
   * Save writing grades for both tasks
   * POST /mock-result/grade-writing
   * Body: { mockId, sectionId, writingPartOneScore, writingPartTwoScore }
   */
  saveWritingGrade: async (data: SaveWritingGradeDto): Promise<ApiResponse<string>> => {
    try {
      console.log('💾 Saving writing grade:', data)
      const response = await authApi.post('/mock-result/grade-writing', data)
      console.log('✅ Save writing grade response:', response.data)
      
      // Handle response format: { success, reason, count, totalCount, data }
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      }
      
      return response.data
    } catch (error: any) {
      console.error('❌ Error saving writing grade:', error)
      throw error
    }
  },

  /**
   * Get all mock test results
   * GET /mock-result/get-all-mock?page={page}&size={size}
   */
  getAllMockResults: async (page: number = 0, size: number = 20): Promise<ApiResponse<MockResultDto[]>> => {
    try {
      const response = await authApi.get('/mock-result/get-all-mock', {
        params: {
          page,
          size
        }
      })
      console.log('📊 Get all mock results response:', response.data)
      
      // Handle Spring Boot Pageable response format
      if (response.data.content && Array.isArray(response.data.content)) {
        const pageableResponse = response.data as PageableResponse<MockResultDto>
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
      console.error('❌ Error fetching mock results:', error)
      throw error
    }
  }
}

export default mockResultApi

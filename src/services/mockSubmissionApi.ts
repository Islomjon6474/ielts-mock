import axios from 'axios'
import type {
  StartMockReqDto,
  StartSectionReqDto,
  SendAnswerReqDto,
  FinishSectionReqDto,
  ResponseDtoUUID,
  ResponseDtoObject,
  ResponseDtoListTestDto,
  ResponseDtoListSectionDto,
  ResponseDtoListPartDto,
  ResponseDtoPartQuestionContentDto,
  ResponseDtoListListeningAudioDto,
  ResponseDtoListMockDto,
  ResponseDtoListMockQuestionAnswerDto,
  PaginationParams,
  GetSubmittedAnswersParams,
  GetAllSectionsParams,
} from '@/types/api'

// Always use the production backend URL
const BASE_URL = 'https://mock.fleetoneld.com/ielts-mock-main'

// Configure axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for authentication token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      const fullUrl = `${config.baseURL}${config.url || ''}`
      console.log('🎯 Mock Submission API Request:', fullUrl)
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        window.location.href = '/auth/signin'
      }
    }
    return Promise.reject(error)
  }
)

/**
 * Mock Submission API
 * Handles student test-taking functionality
 */
export const mockSubmissionApi = {
  /**
   * Start a new mock test
   * @param testId - ID of the test to start (optional)
   * @returns Mock ID
   */
  startMock: async (testId?: string): Promise<ResponseDtoUUID> => {
    const response = await api.post<ResponseDtoUUID>('/mock-submission/start-mock', {
      testId,
    } as StartMockReqDto)
    return response.data
  },

  /**
   * Start a section within a mock test
   * @param mockId - ID of the mock test
   * @param sectionId - ID of the section to start
   */
  startSection: async (mockId: string, sectionId: string): Promise<ResponseDtoObject> => {
    const response = await api.post<ResponseDtoObject>('/mock-submission/start-section', {
      mockId,
      sectionId,
    } as StartSectionReqDto)
    return response.data
  },

  /**
   * Submit an answer for a question
   * @param mockId - ID of the mock test
   * @param sectionId - ID of the section
   * @param questionOrd - Order/position of the question
   * @param answer - Student's answer
   */
  sendAnswer: async (
    mockId: string,
    sectionId: string,
    questionOrd: number,
    answer: string
  ): Promise<ResponseDtoObject> => {
    const response = await api.post<ResponseDtoObject>('/mock-submission/send-answer', {
      mockId,
      sectionId,
      questionOrd,
      answer,
    } as SendAnswerReqDto)
    return response.data
  },

  /**
   * Finish/complete a section
   * @param mockId - ID of the mock test
   * @param sectionId - ID of the section to finish
   */
  finishSection: async (mockId: string, sectionId: string): Promise<ResponseDtoObject> => {
    const response = await api.post<ResponseDtoObject>('/mock-submission/finish-section', {
      mockId,
      sectionId,
    } as FinishSectionReqDto)
    return response.data
  },

  /**
   * Get all active tests available for taking
   * @param page - Page number (0-indexed)
   * @param size - Number of items per page
   */
  getAllTests: async (page: number = 0, size: number = 10): Promise<ResponseDtoListTestDto> => {
    const response = await api.get<ResponseDtoListTestDto>('/mock-submission/get-all-test', {
      params: { page, size } as PaginationParams,
    })
    return response.data
  },

  /**
   * Get all sections for a test
   * @param testId - ID of the test
   * @param mockId - Optional ID of the mock test (to get section status)
   */
  getAllSections: async (testId: string, mockId?: string): Promise<ResponseDtoListSectionDto> => {
    const response = await api.get<ResponseDtoListSectionDto>('/mock-submission/get-all-section', {
      params: { testId, mockId } as GetAllSectionsParams,
    })
    return response.data
  },

  /**
   * Get all parts for a section
   * @param sectionId - ID of the section
   */
  getAllParts: async (sectionId: string): Promise<ResponseDtoListPartDto> => {
    const response = await api.get<ResponseDtoListPartDto>('/mock-submission/get-all-part', {
      params: { sectionId },
    })
    return response.data
  },

  /**
   * Get part question content (reading passage, listening instructions, etc.)
   * @param partId - ID of the part
   */
  getPartQuestionContent: async (partId: string): Promise<ResponseDtoPartQuestionContentDto> => {
    const response = await api.get<ResponseDtoPartQuestionContentDto>(
      '/mock-submission/get-part-question-content',
      {
        params: { partId },
      }
    )
    return response.data
  },

  /**
   * Get all listening audio files for a test
   * @param testId - ID of the test
   */
  getAllListeningAudio: async (testId: string): Promise<ResponseDtoListListeningAudioDto> => {
    const response = await api.get<ResponseDtoListListeningAudioDto>(
      '/mock-submission/get-all-listening-audio',
      {
        params: { testId },
      }
    )
    return response.data
  },

  /**
   * Get all submitted answers for a section in a mock test
   * @param mockId - ID of the mock test
   * @param sectionId - ID of the section
   */
  getSubmittedAnswers: async (
    mockId: string,
    sectionId: string
  ): Promise<ResponseDtoListMockQuestionAnswerDto> => {
    const response = await api.get<ResponseDtoListMockQuestionAnswerDto>(
      '/mock-submission/get-all-question-submitted-answers',
      {
        params: { mockId, sectionId } as GetSubmittedAnswersParams,
      }
    )
    return response.data
  },

  /**
   * Get all mock tests for the current user
   * @param page - Page number (0-indexed)
   * @param size - Number of items per page
   */
  getAllMocks: async (page: number = 0, size: number = 10): Promise<ResponseDtoListMockDto> => {
    const response = await api.get<ResponseDtoListMockDto>('/mock-submission/get-all-mock', {
      params: { page, size } as PaginationParams,
    })
    return response.data
  },
}

export default mockSubmissionApi

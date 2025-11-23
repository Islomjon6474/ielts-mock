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

// Always use the production backend URL - never use relative paths
const BASE_URL = 'https://mock.fleetoneld.com/ielts-mock-main'

// Log the BASE_URL to verify it's correct
if (typeof window !== 'undefined') {
  console.log('API BASE_URL:', BASE_URL)
}

// Configure axios instance with full absolute URL
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for authentication token and debugging
api.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage (only in browser)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // Log the full request URL for debugging
      const fullUrl = `${config.baseURL}${config.url || ''}`
      console.log('🌐 API Request:', fullUrl)
      
      // Verify it's not going to localhost
      if (fullUrl.includes('localhost')) {
        console.error('❌ WARNING: Request going to localhost!', fullUrl)
      }
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
      // Token expired or invalid - redirect to login (only in browser)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        window.location.href = '/auth/signin'
      }
    }
    return Promise.reject(error)
  }
)

// Test Management APIs
export const testManagementApi = {
  // Create a new test
  createTest: async (name: string) => {
    const response = await api.post('/test-management/save', { name })
    return response.data
  },

  // Get all tests with pagination
  getAllTests: async (page: number = 0, size: number = 10) => {
    const response = await api.get('/test-management/get-all', {
      params: { page, size },
    })
    return response.data
  },

  // Get single test by ID
  getTest: async (id: string) => {
    const response = await api.get(`/test-management/get/${id}`)
    return response.data
  },

  // Update test active status
  updateTestActive: async (id: string, isActive: number) => {
    const response = await api.post('/test-management/update-active', {
      id,
      isActive,
    })
    return response.data
  },

  // Get all sections for a test
  getAllSections: async (testId: string) => {
    const response = await api.get('/test-management/get-all-section', {
      params: { testId },
    })
    return response.data
  },

  // Get all parts for a section
  getAllParts: async (sectionId: string) => {
    const response = await api.get('/test-management/get-all-part', {
      params: { sectionId },
    })
    return response.data
  },

  // Get single part by ID
  getPart: async (id: string) => {
    const response = await api.get(`/test-management/get-part/${id}`)
    return response.data
  },

  // Save part question content (as JSON)
  savePartQuestionContent: async (partId: string, content: any) => {
    const response = await api.post('/test-management/save-part-question-content', {
      partId,
      content: JSON.stringify(content),
    })
    return response.data
  },

  // Get part question content
  getPartQuestionContent: async (partId: string) => {
    const response = await api.get('/test-management/get-part-question-content', {
      params: { partId },
    })
    return response.data
  },

  // Add question (inserts between existing questions, shifts subsequent question numbers)
  addQuestion: async (sectionId: string, partId: string, ord: number, answers: string[]) => {
    const response = await api.post('/test-management/add-question', {
      sectionId,
      partId,
      ord,
      answers,
    })
    return response.data
  },

  // Save question answers (creates new or updates existing at the end)
  saveQuestion: async (sectionId: string, partId: string, ord: number, answers: string[]) => {
    const response = await api.post('/test-management/save-question', {
      sectionId,
      partId,
      ord,
      answers,
    })
    return response.data
  },

  // Update question
  updateQuestion: async (id: string, partId: string, answers: string[]) => {
    const response = await api.put('/test-management/update-question', {
      id,
      partId,
      answers,
    })
    return response.data
  },

  // Delete question
  deleteQuestion: async (id: string) => {
    const response = await api.delete(`/test-management/delete-question/${id}`)
    return response.data
  },

  // Get all questions for a section
  getAllQuestions: async (sectionId: string) => {
    const response = await api.get('/test-management/get-all-question', {
      params: { sectionId },
    })
    return response.data
  },

  // Delete test
  deleteTest: async (id: string) => {
    const response = await api.delete(`/test-management/delete/${id}`)
    return response.data
  },
}

// Mock Submission APIs (for student test-taking functionality)
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

// Listening Audio Management APIs
export const listeningAudioApi = {
  // Save listening audio (link uploaded file to test)
  saveListeningAudio: async (testId: string, fileId: string) => {
    const response = await api.post('/test-management/save-listening-audio', {
      testId,
      fileId,
    })
    return response.data
  },

  // Get all listening audio for a test
  getAllListeningAudio: async (testId: string) => {
    const response = await api.get('/test-management/get-all-listening-audio', {
      params: { testId },
    })
    return response.data
  },

  // Change listening audio order
  changeListeningAudioOrder: async (ids: string[]) => {
    const response = await api.put('/test-management/change-listening-audio-ord', {
      ids,
    })
    return response.data
  },

  // Delete listening audio
  deleteListeningAudio: async (id: string) => {
    const response = await api.delete(`/test-management/delete-listening-audio/${id}`)
    return response.data
  },
}

// File Management APIs
export const fileApi = {
  // Upload file
  uploadFile: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    const response = await api.post('/file/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    })
    return response.data
  },

  // Get download URL
  getDownloadUrl: (fileId: string) => {
    return `${BASE_URL}/file/download/${fileId}`
  },

  // Convert imageId to full image URL (utility for transforming stored imageId to displayable URL)
  getImageUrl: (imageId: string | undefined) => {
    return imageId ? `${BASE_URL}/file/download/${imageId}` : undefined
  },

  // Convert fileId to full file URL (for any file type: images, audio, etc.)
  getFileUrl: (fileId: string | undefined) => {
    return fileId ? `${BASE_URL}/file/download/${fileId}` : undefined
  },
}

export default api

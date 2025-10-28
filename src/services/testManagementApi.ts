import axios from 'axios'

const BASE_URL = 'http://localhost:8080/ielts-mock-main'

// Configure axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

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

  // Save question answers
  saveQuestion: async (sectionId: string, partId: string, answers: string[]) => {
    const response = await api.post('/test-management/save-question', {
      sectionId,
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
}

// Listening Audio Management APIs
export const listeningAudioApi = {
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

    const response = await api.post('/file/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Get download URL
  getDownloadUrl: (fileId: string) => {
    return `${BASE_URL}/file/download/${fileId}`
  },
}

export default api

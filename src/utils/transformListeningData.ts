import { ListeningPart } from '@/stores/ListeningStore'
import { fileApi } from '@/services/testManagementApi'

/**
 * Transform admin question data to listening part format
 */
export function transformAdminToListeningPart(
  adminData: any,
  partNumber: number,
  audioUrl?: string
): ListeningPart {
  // Use the flat questions array if available (new format)
  // Otherwise fall back to flattening questionGroups (old format)
  let questions: any[]
  let questionRange: [number, number]
  
  if (adminData.questions && Array.isArray(adminData.questions) && adminData.questions.length > 0) {
    // New format: use pre-flattened questions array
    // First, calculate the question range from questionGroups if available
    if (adminData.questionGroups && Array.isArray(adminData.questionGroups)) {
      questionRange = calculateQuestionRange(adminData.questionGroups)
    } else if (adminData.questionRange && Array.isArray(adminData.questionRange)) {
      questionRange = adminData.questionRange as [number, number]
    } else {
      // Calculate from questions
      const ids = adminData.questions.map((q: any) => q.id).filter((id: number) => typeof id === 'number')
      questionRange = ids.length > 0 ? [Math.min(...ids), Math.max(...ids)] : [1, 10]
    }
    
    questions = adminData.questions.map((q: any) => {
      // Fix imageUrl if it contains localhost or is a relative path
      let imageUrl = q.imageUrl
      if (imageUrl) {
        // If it's a relative path starting with /api/file/download, convert to full URL
        if (imageUrl.startsWith('/api/file/download/')) {
          const fileId = imageUrl.replace('/api/file/download/', '')
          imageUrl = fileApi.getImageUrl(fileId)
        }
        // If it contains localhost, replace with production URL
        else if (imageUrl.includes('localhost')) {
          const fileIdMatch = imageUrl.match(/\/file\/download\/([^/?]+)/)
          if (fileIdMatch) {
            imageUrl = fileApi.getImageUrl(fileIdMatch[1])
          }
        }
      }
      
      return {
        ...q,
        imageUrl,
        // Convert FILL_IN_BLANK back to the type expected by listening components
        type: q.type
      }
    })
  } else {
    // Old format: flatten question groups
    const questionGroups = adminData.questionGroups || []
    questionRange = calculateQuestionRange(questionGroups)
    questions = flattenQuestionGroups(questionGroups)
  }
  
  return {
    id: partNumber,
    title: `Part ${partNumber}`,
    instruction: adminData.instruction || '',
    questionRange,
    audioUrl: audioUrl || '',
    questions
  }
}

/**
 * Calculate the overall question range from question groups
 */
function calculateQuestionRange(questionGroups: any[]): [number, number] {
  if (!questionGroups || questionGroups.length === 0) {
    return [1, 10] // Default range
  }
  
  let minQuestion = Infinity
  let maxQuestion = -Infinity
  
  questionGroups.forEach(group => {
    // Parse range string like "1-5" or "11-15"
    if (group.range) {
      const match = group.range.match(/(\d+)-(\d+)/)
      if (match) {
        const start = parseInt(match[1])
        const end = parseInt(match[2])
        minQuestion = Math.min(minQuestion, start)
        maxQuestion = Math.max(maxQuestion, end)
      }
    }
    
    // Also check individual question numbers
    if (group.questions) {
      group.questions.forEach((q: any) => {
        if (q.questionNumber) {
          minQuestion = Math.min(minQuestion, q.questionNumber)
          maxQuestion = Math.max(maxQuestion, q.questionNumber)
        }
      })
    }
  })
  
  if (minQuestion === Infinity || maxQuestion === -Infinity) {
    return [1, 10] // Fallback
  }
  
  return [minQuestion, maxQuestion]
}

/**
 * Flatten question groups into a single questions array
 */
function flattenQuestionGroups(questionGroups: any[]): any[] {
  const allQuestions: any[] = []
  
  questionGroups.forEach(group => {
    const groupType = group.type
    const groupInstruction = group.instruction || ''
    // Convert imageId to imageUrl at group level with full URL
    const groupImageUrl = fileApi.getImageUrl(group.imageId)
    
    // Parse question range to get starting question number
    let startingQuestionNumber = 1
    if (group.range) {
      const match = group.range.match(/^(\d+)-(\d+)$/)
      if (match) {
        startingQuestionNumber = parseInt(match[1])
      }
    }
    
    if (group.questions && group.questions.length > 0) {
      // Each question group becomes one or more questions
      group.questions.forEach((question: any, index: number) => {
        const questionNumber = startingQuestionNumber + index
        
        allQuestions.push({
          id: questionNumber,
          type: groupType,
          text: buildQuestionText(group, question, index),
          options: question.options || undefined,
          // Use imageUrl from question if available, otherwise use group's imageUrl
          imageUrl: question.imageUrl || groupImageUrl,
          // Note: correctAnswer is NOT included in user format
        })
      })
    } else {
      // Group without individual questions - create single question for the group
      allQuestions.push({
        id: startingQuestionNumber,
        type: groupType,
        text: groupInstruction,
        imageUrl: groupImageUrl,
      })
    }
  })
  
  return allQuestions
}

/**
 * Build question text from group and question data
 */
function buildQuestionText(group: any, question: any, index: number): string {
  const parts: string[] = []
  
  // Add group instruction if this is the first question in the group
  if (index === 0 && group.instruction) {
    parts.push(group.instruction)
    parts.push('') // Empty line
  }
  
  // Add question text
  if (question.text) {
    parts.push(question.text)
  }
  
  // Add options for multiple choice
  if (question.options && question.options.length > 0) {
    parts.push('') // Empty line before options
    question.options.forEach((option: string, optIndex: number) => {
      const letter = String.fromCharCode(65 + optIndex) // A, B, C, D
      parts.push(`${letter}. ${option}`)
    })
  }
  
  return parts.join('\n')
}

/**
 * Transform multiple parts at once
 */
export function transformAdminPartsToListening(
  parts: any[],
  audioUrls?: { [partId: string]: string }
): ListeningPart[] {
  return parts.map((part, index) => {
    const partNumber = index + 1
    const audioUrl = audioUrls?.[part.id] || ''
    
    // Parse content if it's a string
    let adminData
    if (typeof part.content === 'string') {
      try {
        const parsed = JSON.parse(part.content)
        // Use user format if available, otherwise use admin format
        adminData = parsed.user || parsed.admin || parsed
      } catch (e) {
        console.error('Failed to parse part content:', e)
        adminData = {}
      }
    } else {
      adminData = part.content?.user || part.content?.admin || part.content || {}
    }
    
    return transformAdminToListeningPart(adminData, partNumber, audioUrl)
  })
}

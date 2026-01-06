import { Part } from '@/stores/ReadingStore'

interface AdminQuestionData {
  text?: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  correctAnswer: string
  sectionNumber?: number
  content?: string
  headingOptions?: string
  wordLimit?: string
}

interface AdminQuestionGroup {
  type: string
  range: string
  instruction: string
  questions: AdminQuestionData[]
}

interface AdminPartData {
  instruction: string
  passage: string
  sections?: { number: number; content: string }[]
  group1: AdminQuestionGroup
  group2: AdminQuestionGroup
}

interface AdminTestData {
  title: string
  description: string
  part1: AdminPartData
  part2: AdminPartData
  part3: AdminPartData
}

/**
 * Transform admin form data to the format used by the reading store
 */
export function transformAdminTestData(adminData: AdminTestData): Part[] {
  const parts: Part[] = []

  // Process each part (part1, part2, part3)
  ;(['part1', 'part2', 'part3'] as const).forEach((partKey, index) => {
    const partData = adminData[partKey]
    const partNumber = index + 1
    
    // Parse question range from first group
    const rangeMatch = partData.group1.range.match(/(\d+)-(\d+)/)
    const startQuestion = rangeMatch ? parseInt(rangeMatch[1]) : (index * 14) + 1
    const endQuestion = rangeMatch ? parseInt(rangeMatch[2]) : (index + 1) * 13 + 1

    const part: Part = {
      id: partNumber,
      title: `Part ${partNumber}`,
      instruction: partData.instruction,
      questionRange: [startQuestion, endQuestion],
      passage: partData.passage,
      questions: [],
    }

    // Process group 1 questions
    if (partData.group1.questions && partData.group1.questions.length > 0) {
      const { questions, sections, headingOptions } = transformQuestions(
        partData.group1.questions,
        partData.group1.type,
        startQuestion
      )
      part.questions.push(...questions)
      
      // Add sections if this is a match heading group
      if (sections && sections.length > 0) {
        part.sections = sections
      }
    }

    // Process group 2 questions
    if (partData.group2.questions && partData.group2.questions.length > 0) {
      const group1Count = partData.group1.questions?.length || 0
      const { questions, sections, headingOptions } = transformQuestions(
        partData.group2.questions,
        partData.group2.type,
        startQuestion + group1Count
      )
      part.questions.push(...questions)
      
      // Merge or add sections if this is also a match heading group
      if (sections && sections.length > 0) {
        part.sections = part.sections ? [...part.sections, ...sections] : sections
      }
    }

    parts.push(part)
  })

  return parts
}

/**
 * Transform questions based on their type
 */
function transformQuestions(
  questions: AdminQuestionData[],
  questionType: string,
  startId: number
): { questions: any[], sections?: any[], headingOptions?: string[] } {
  
  // Handle Match Heading questions differently
  if (questionType === 'MATCH_HEADING') {
    const sections: any[] = []
    const transformedQuestions: any[] = []
    let allHeadingOptions: string[] = []
    
    questions.forEach((q, index) => {
      const questionId = q.sectionNumber || (startId + index)
      
      // Create section content
      if (q.content) {
        sections.push({
          number: questionId,
          content: q.content
        })
      }
      
      // Parse heading options (one per line)
      if (q.headingOptions && index === 0) {
        // Only take heading options from first question to avoid duplicates
        allHeadingOptions = q.headingOptions
          .split('\n')
          .map(h => h.trim())
          .filter(h => h.length > 0)
      }
      
      // Create the question
      transformedQuestions.push({
        id: questionId,
        type: 'MATCH_HEADING',
        text: `Section ${questionId}`,
        options: allHeadingOptions
      })
    })
    
    return { questions: transformedQuestions, sections, headingOptions: allHeadingOptions }
  }
  
  // Handle other question types
  const transformedQuestions = questions.map((q, index) => {
    const questionId = startId + index
    const baseQuestion = {
      id: questionId,
      text: q.text || '',
    }

    switch (questionType) {
      case 'MULTIPLE_CHOICE':
        return {
          ...baseQuestion,
          type: 'MULTIPLE_CHOICE',
          options: [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean),
          maxAnswers: 1, // Can be extended for multi-select
        }

      case 'TRUE_FALSE_NOT_GIVEN':
      case 'YES_NO_NOT_GIVEN':
        return {
          ...baseQuestion,
          type: questionType,
        }

      case 'SENTENCE_COMPLETION':
      case 'SUMMARY_COMPLETION':
      case 'SHORT_ANSWER':
        return {
          ...baseQuestion,
          type: 'FILL_IN_BLANK',
        }

      case 'FILL_IN_BLANKS_DRAG_DROP':
        return {
          ...baseQuestion,
          type: 'FILL_IN_BLANKS_DRAG_DROP',
        }

      default:
        return {
          ...baseQuestion,
          type: 'FILL_IN_BLANK',
        }
    }
  })
  
  return { questions: transformedQuestions }
}

/**
 * Transform data for saving to backend
 */
export function prepareDataForBackend(adminData: AdminTestData) {
  const transformedData = transformAdminTestData(adminData)
  
  return {
    testInfo: {
      title: adminData.title,
      description: adminData.description,
    },
    parts: transformedData,
  }
}

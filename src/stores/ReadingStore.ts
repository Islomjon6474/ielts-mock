import { makeAutoObservable } from 'mobx'
import * as R from 'ramda'
import { mockSubmissionApi } from '@/services/testManagementApi'

export type QuestionType = 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN' | 'FILL_IN_BLANK' | 'MATCH_HEADING' | 'MULTIPLE_CHOICE' | 'MULTIPLE_CHOICE_SINGLE' | 'IMAGE_INPUTS' | 'SENTENCE_COMPLETION' | 'MULTIPLE_CORRECT_ANSWERS'

export interface Answer {
  questionId: number
  value: string | string[] | null
}

export interface Question {
  id: number
  type: QuestionType
  text: string
  options?: string[]
  maxAnswers?: number
  imageUrl?: string
  correctAnswer?: string | string[] // Correct answer(s) for the question
}

export interface QuestionGroup {
  instruction?: string
  imageUrl?: string
  questions: Question[]
  headingOptions?: string[]  // For MATCH_HEADING questions
  options?: string[]          // For SENTENCE_COMPLETION questions
}

export interface Section {
  number: number
  content: string
}

export interface Part {
  id: number
  title: string
  instruction: string
  passage: string
  imageUrl?: string
  sections?: Section[]
  questionGroups?: QuestionGroup[]
  questions: Question[]
  questionRange: [number, number]
}

export class ReadingStore {
  currentPart: number = 1
  currentQuestionIndex: number = 0
  answers: Map<number, string | string[]> = new Map()
  parts: Part[] = []

  // Timer properties
  timeLimit: number = 60 * 60 // 60 minutes in seconds
  timeRemaining: number = 60 * 60
  timerInterval: NodeJS.Timeout | null = null
  isTimeUp: boolean = false
  isPreviewMode: boolean = false
  mockId: string | null = null
  sectionId: string | null = null
  isSubmitting: boolean = false

  // Answer review properties (for admin result viewing)
  submittedAnswers: Map<number, string | string[]> = new Map() // User's submitted answers
  answerCorrectness: Map<number, boolean> = new Map() // Whether each answer is correct

  constructor() {
    makeAutoObservable(this)
  }

  setMockId(mockId: string) {
    this.mockId = mockId
  }

  setSectionId(sectionId: string) {
    this.sectionId = sectionId
  }

  setPreviewMode(isPreview: boolean) {
    this.isPreviewMode = isPreview
  }

  setCurrentPart(partNumber: number) {
    this.currentPart = partNumber
    this.currentQuestionIndex = 0
  }

  setCurrentQuestionIndex(index: number) {
    this.currentQuestionIndex = index
  }

  goToQuestion(questionNumber: number) {
    const part = this.parts.find(
      p => questionNumber >= p.questionRange[0] && questionNumber <= p.questionRange[1]
    )
    if (part) {
      this.currentPart = part.id
      this.currentQuestionIndex = questionNumber - part.questionRange[0]
    }
  }

  async setAnswer(questionId: number, value: string | string[]) {
    this.answers.set(questionId, value)
    
    // Auto-submit answer if not in preview mode
    if (!this.isPreviewMode && this.mockId && this.sectionId) {
      try {
        const answerString = Array.isArray(value) ? value.join(',') : value
        await mockSubmissionApi.sendAnswer(this.mockId, this.sectionId, questionId, answerString)
        console.log(`✅ Submitted answer for Q${questionId}:`, answerString)
      } catch (error) {
        console.error(`❌ Failed to submit answer for Q${questionId}:`, error)
      }
    }
  }

  removeAnswer(questionId: number) {
    this.answers.delete(questionId)
  }

  getAnswer(questionId: number): string | string[] | undefined {
    return this.answers.get(questionId)
  }

  isQuestionAnswered(questionId: number): boolean {
    const answer = this.answers.get(questionId)
    if (Array.isArray(answer)) {
      return answer.length > 0
    }
    return answer !== undefined && answer !== null && answer !== ''
  }

  nextQuestion() {
    // Try to find the next unanswered question
    const currentPartIndex = this.currentPart - 1
    const currentPart = this.parts[currentPartIndex]
    if (!currentPart) return

    // Search forward from current position for first unanswered question
    let foundUnanswered = false
    
    // First, check remaining questions in current part
    for (let i = this.currentQuestionIndex + 1; i < currentPart.questions.length; i++) {
      const question = currentPart.questions[i]
      if (!this.isQuestionAnswered(question.id)) {
        this.currentQuestionIndex = i
        foundUnanswered = true
        break
      }
    }
    
    // If not found in current part, check subsequent parts
    if (!foundUnanswered) {
      for (let partIdx = currentPartIndex + 1; partIdx < this.parts.length; partIdx++) {
        const part = this.parts[partIdx]
        for (let qIdx = 0; qIdx < part.questions.length; qIdx++) {
          const question = part.questions[qIdx]
          if (!this.isQuestionAnswered(question.id)) {
            this.currentPart = partIdx + 1
            this.currentQuestionIndex = qIdx
            foundUnanswered = true
            break
          }
        }
        if (foundUnanswered) break
      }
    }
    
    // If no unanswered question found, just go to next question sequentially
    if (!foundUnanswered) {
      if (this.currentQuestionIndex < currentPart.questions.length - 1) {
        this.currentQuestionIndex++
      } else if (this.currentPart < this.parts.length) {
        this.currentPart++
        this.currentQuestionIndex = 0
      }
    }
  }

  previousQuestion() {
    // Try to find the previous unanswered question
    const currentPartIndex = this.currentPart - 1
    const currentPart = this.parts[currentPartIndex]
    if (!currentPart) return

    // Search backward from current position for first unanswered question
    let foundUnanswered = false
    
    // First, check previous questions in current part
    for (let i = this.currentQuestionIndex - 1; i >= 0; i--) {
      const question = currentPart.questions[i]
      if (!this.isQuestionAnswered(question.id)) {
        this.currentQuestionIndex = i
        foundUnanswered = true
        break
      }
    }
    
    // If not found in current part, check previous parts (backwards)
    if (!foundUnanswered) {
      for (let partIdx = currentPartIndex - 1; partIdx >= 0; partIdx--) {
        const part = this.parts[partIdx]
        for (let qIdx = part.questions.length - 1; qIdx >= 0; qIdx--) {
          const question = part.questions[qIdx]
          if (!this.isQuestionAnswered(question.id)) {
            this.currentPart = partIdx + 1
            this.currentQuestionIndex = qIdx
            foundUnanswered = true
            break
          }
        }
        if (foundUnanswered) break
      }
    }
    
    // If no unanswered question found, just go to previous question sequentially
    if (!foundUnanswered) {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--
      } else if (this.currentPart > 1) {
        this.currentPart--
        const prevPart = this.parts[this.currentPart - 1]
        this.currentQuestionIndex = prevPart.questions.length - 1
      }
    }
  }

  get currentQuestion(): Question | null {
    const part = this.parts[this.currentPart - 1]
    return part?.questions[this.currentQuestionIndex] || null
  }

  get allQuestions(): Question[] {
    return R.flatten(this.parts.map(p => p.questions))
  }

  setParts(parts: Part[]) {
    this.parts = parts
  }

  // Load submitted answers and calculate correctness
  loadSubmittedAnswers(submittedAnswers: Array<{ questionOrd: number, answer: string }>) {
    this.submittedAnswers.clear()
    this.answerCorrectness.clear()

    submittedAnswers.forEach((submitted) => {
      const questionId = submitted.questionOrd
      const userAnswer = submitted.answer

      // Store the submitted answer
      this.submittedAnswers.set(questionId, userAnswer)

      // Find the question to get correct answer
      const question = this.allQuestions.find(q => q.id === questionId)
      if (question && question.correctAnswer) {
        // Check if answer is correct
        const isCorrect = this.checkAnswerCorrectness(userAnswer, question.correctAnswer, question.type)
        this.answerCorrectness.set(questionId, isCorrect)
      }
    })
  }

  // Check if a user answer matches the correct answer
  private checkAnswerCorrectness(
    userAnswer: string | string[],
    correctAnswer: string | string[],
    questionType: QuestionType
  ): boolean {
    // Normalize answers for comparison (trim, lowercase)
    const normalize = (str: string) => str.trim().toLowerCase()

    if (questionType === 'MULTIPLE_CHOICE' || questionType === 'MULTIPLE_CORRECT_ANSWERS') {
      // For multiple choice with multiple answers
      const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer]
      const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]

      if (userAnswers.length !== correctAnswers.length) return false

      const normalizedUser = userAnswers.map(normalize).sort()
      const normalizedCorrect = correctAnswers.map(normalize).sort()

      return normalizedUser.every((ans, i) => ans === normalizedCorrect[i])
    } else {
      // For single answer questions
      const userAns = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer
      const correctAns = Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer

      if (!userAns || !correctAns) return false

      return normalize(userAns) === normalize(correctAns)
    }
  }

  // Get submitted answer for a question
  getSubmittedAnswer(questionId: number): string | string[] | null {
    return this.submittedAnswers.get(questionId) || null
  }

  // Check if a submitted answer is correct
  isAnswerCorrect(questionId: number): boolean | null {
    if (!this.answerCorrectness.has(questionId)) return null
    return this.answerCorrectness.get(questionId) || false
  }

  async finishSection() {
    if (!this.mockId || !this.sectionId || this.isPreviewMode) {
      console.log('Cannot finish section: missing mockId/sectionId or in preview mode')
      return
    }

    try {
      this.isSubmitting = true
      await mockSubmissionApi.finishSection(this.mockId, this.sectionId)
      console.log('✅ Section finished successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to finish section:', error)
    }
  }

  startTimer(onTimeUp: () => void) {
    if (this.isPreviewMode) return
    
    this.stopTimer()
    this.timeRemaining = this.timeLimit
    this.isTimeUp = false
    
    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--
      } else {
        this.isTimeUp = true
        this.stopTimer()
        onTimeUp()
      }
    }, 1000)
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }

  reset() {
    this.stopTimer()
    this.currentPart = 1
    this.currentQuestionIndex = 0
    this.answers.clear()
    this.parts = []
    this.mockId = null
    this.sectionId = null
    this.isSubmitting = false
    this.timeRemaining = this.timeLimit
    this.isTimeUp = false
  }
}

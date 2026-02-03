import { makeAutoObservable } from 'mobx'
import * as R from 'ramda'
import { mockSubmissionApi } from '@/services/testManagementApi'

export type QuestionType = 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN' | 'FILL_IN_BLANK' | 'MATCH_HEADING' | 'MULTIPLE_CHOICE' | 'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_QUESTIONS_MULTIPLE_CHOICE' | 'IMAGE_INPUTS' | 'SENTENCE_COMPLETION' | 'FILL_IN_BLANKS_DRAG_DROP' | 'MULTIPLE_CORRECT_ANSWERS' | 'MATRIX_TABLE' | 'TABLE_COMPLETION'

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
  groupId?: string // For grouping multiple questions together (e.g., MULTIPLE_QUESTIONS_MULTIPLE_CHOICE)
  rangeStart?: number // Start of question range
  rangeEnd?: number // End of question range
}

export interface QuestionGroup {
  instruction?: string
  imageUrl?: string
  questions: Question[]
  range?: string              // Question range (e.g., "10-14")
  headingOptions?: string[]  // For MATCH_HEADING questions
  options?: string[]          // For SENTENCE_COMPLETION questions
  matrixOptions?: string[]    // For MATRIX_TABLE questions (column headers)
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

  // Queue for pending answer submissions (private - not observable, underscore prefix tells MobX to ignore)
  private _pendingAnswers: Map<number, { value: string | string[], retries: number }> = new Map()
  private _isProcessingQueue: boolean = false

  constructor() {
    makeAutoObservable(this)
  }

  setMockId(mockId: string) {
    this.mockId = mockId
    // Try to process pending answers when mockId is set
    if (this.sectionId) {
      this.processPendingAnswers()
    }
  }

  setSectionId(sectionId: string) {
    this.sectionId = sectionId
    // Try to process pending answers when sectionId is set
    if (this.mockId) {
      this.processPendingAnswers()
    }
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
    if (!this.isPreviewMode) {
      // Check if mockId and sectionId are set
      if (!this.mockId || !this.sectionId) {
        console.warn(`⚠️ Cannot submit answer for Q${questionId}: mockId or sectionId not set. Queueing for later.`)
        this._pendingAnswers.set(questionId, { value, retries: 0 })
        return
      }

      try {
        const answerString = Array.isArray(value) ? value.join(',') : value
        // Only submit if answer is not empty
        if (answerString.trim() === '') {
          console.log(`⏭️ Skipping empty answer for Q${questionId}`)
          return
        }
        await mockSubmissionApi.sendAnswer(this.mockId, this.sectionId, questionId, answerString)
        console.log(`✅ Submitted answer for Q${questionId}:`, answerString)
        // Remove from pending if it was there
        this._pendingAnswers.delete(questionId)
      } catch (error) {
        console.error(`❌ Failed to submit answer for Q${questionId}:`, error)
        // Queue for retry
        const existing = this._pendingAnswers.get(questionId)
        this._pendingAnswers.set(questionId, { value, retries: (existing?.retries || 0) + 1 })
        // Try to process queue
        this.processPendingAnswers()
      }
    }
  }

  // Process pending answers queue
  async processPendingAnswers() {
    if (this._isProcessingQueue || !this.mockId || !this.sectionId) return
    if (this._pendingAnswers.size === 0) return

    this._isProcessingQueue = true
    console.log(`📤 Processing ${this._pendingAnswers.size} pending answers...`)

    for (const [questionId, { value, retries }] of this._pendingAnswers) {
      if (retries >= 3) {
        console.error(`❌ Giving up on Q${questionId} after 3 retries`)
        this._pendingAnswers.delete(questionId)
        continue
      }

      try {
        const answerString = Array.isArray(value) ? value.join(',') : value
        if (answerString.trim() === '') {
          this._pendingAnswers.delete(questionId)
          continue
        }
        await mockSubmissionApi.sendAnswer(this.mockId!, this.sectionId!, questionId, answerString)
        console.log(`✅ Retry succeeded for Q${questionId}:`, answerString)
        this._pendingAnswers.delete(questionId)
      } catch (error) {
        console.error(`❌ Retry failed for Q${questionId}:`, error)
        this._pendingAnswers.set(questionId, { value, retries: retries + 1 })
      }
    }

    this._isProcessingQueue = false
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

  // Load submitted answers with pre-calculated correctness from API (for admin view)
  loadSubmittedAnswersWithCorrectness(submittedAnswers: Array<{
    questionOrd: number
    answer: string
    isCorrect: number | null
    correctAnswers: string[]
  }>) {
    this.submittedAnswers.clear()
    this.answerCorrectness.clear()

    submittedAnswers.forEach((submitted) => {
      const questionId = submitted.questionOrd
      const userAnswer = submitted.answer

      // Store the submitted answer
      this.submittedAnswers.set(questionId, userAnswer)

      // Store correctness from API (isCorrect: 1 = correct, 0 = incorrect, null = not graded)
      if (submitted.isCorrect !== null && submitted.isCorrect !== undefined) {
        this.answerCorrectness.set(questionId, submitted.isCorrect === 1)
      }
    })
  }

  // Manually mark an answer as correct or incorrect (for admin)
  setAnswerCorrectness(questionId: number, isCorrect: boolean) {
    this.answerCorrectness.set(questionId, isCorrect)
  }

  // Check if a user answer matches the correct answer
  private checkAnswerCorrectness(
    userAnswer: string | string[],
    correctAnswer: string | string[],
    questionType: QuestionType
  ): boolean {
    // Strip HTML tags from string
    const stripHtml = (str: string) => {
      if (!str) return ''
      return str.replace(/<[^>]*>/g, '').trim()
    }

    // Normalize answers for comparison (strip HTML, trim, lowercase)
    const normalize = (str: string) => stripHtml(str).trim().toLowerCase()

    if (questionType === 'MULTIPLE_CHOICE' || questionType === 'MULTIPLE_CORRECT_ANSWERS' || questionType === 'MULTIPLE_QUESTIONS_MULTIPLE_CHOICE') {
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

      // Process any pending answers before finishing
      if (this._pendingAnswers.size > 0) {
        console.log(`📤 Flushing ${this._pendingAnswers.size} pending answers before finishing...`)
        await this.processPendingAnswers()
      }

      // Clear timer state when section is finished
      this.clearTimerState()

      await mockSubmissionApi.finishSection(this.mockId, this.sectionId)
      console.log('✅ Section finished successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to finish section:', error)
    } finally {
      this.isSubmitting = false
    }
  }

  startTimer(onTimeUp: () => void, forceReset: boolean = false) {
    if (this.isPreviewMode) return

    this.stopTimer()

    // Try to restore timer from localStorage (only if not forcing reset)
    if (!forceReset && this.mockId && this.sectionId) {
      const savedTimer = this.restoreTimerState()
      if (savedTimer !== null) {
        this.timeRemaining = savedTimer
        console.log(`⏱️ Restored reading timer: ${Math.floor(savedTimer / 60)}:${String(savedTimer % 60).padStart(2, '0')}`)
      } else {
        this.timeRemaining = this.timeLimit
        console.log(`⏱️ Starting fresh reading timer: ${this.timeLimit / 60} minutes`)
      }
    } else {
      this.timeRemaining = this.timeLimit
    }

    this.isTimeUp = false

    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--
        // Save timer state every 10 seconds
        if (this.timeRemaining % 10 === 0) {
          this.saveTimerState()
        }
      } else {
        this.isTimeUp = true
        this.stopTimer()
        this.clearTimerState()
        onTimeUp()
      }
    }, 1000)
  }

  // Save timer state to localStorage
  private saveTimerState() {
    if (this.mockId && this.sectionId) {
      const key = `reading_timer_${this.mockId}_${this.sectionId}`
      localStorage.setItem(key, String(this.timeRemaining))
    }
  }

  // Restore timer state from localStorage
  private restoreTimerState(): number | null {
    if (this.mockId && this.sectionId) {
      const key = `reading_timer_${this.mockId}_${this.sectionId}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const remaining = parseInt(saved, 10)
        if (!isNaN(remaining) && remaining > 0 && remaining <= this.timeLimit) {
          return remaining
        }
      }
    }
    return null
  }

  // Clear timer state from localStorage
  private clearTimerState() {
    if (this.mockId && this.sectionId) {
      const key = `reading_timer_${this.mockId}_${this.sectionId}`
      localStorage.removeItem(key)
    }
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
    this._pendingAnswers.clear()
    this._isProcessingQueue = false
    this.parts = []
    this.submittedAnswers.clear()
    this.answerCorrectness.clear()
    this.mockId = null
    this.sectionId = null
    this.isSubmitting = false
    this.timeRemaining = this.timeLimit
    this.isTimeUp = false
  }
}

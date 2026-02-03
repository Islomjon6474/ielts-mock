import { makeAutoObservable } from 'mobx'
import { mockSubmissionApi } from '@/services/testManagementApi'

export interface ListeningQuestion {
  id: number
  type: 'FILL_IN_BLANK' | 'MULTIPLE_CHOICE' | 'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_QUESTIONS_MULTIPLE_CHOICE' | 'MATCHING' | 'TABLE' | 'IMAGE_INPUTS' | 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN' | 'SENTENCE_COMPLETION' | 'SHORT_ANSWER' | 'MULTIPLE_CORRECT_ANSWERS' | 'MATRIX_TABLE' | 'TABLE_COMPLETION' | 'FILL_IN_BLANKS_DRAG_DROP'
  text: string
  options?: string[]
  maxAnswers?: number
  // For IMAGE_INPUTS questions, we repeat imageUrl per question id; UI will render image once per imageUrl group
  imageUrl?: string
  correctAnswer?: string | string[] // Correct answer(s) for the question
}

export interface ListeningQuestionGroup {
  type?: string
  instruction?: string
  imageUrl?: string
  headingOptions?: string[]
  matrixOptions?: string[]
  options?: string[]
  questions?: any[]
}

export interface ListeningPart {
  id: number
  title: string
  instruction: string
  questionRange: [number, number]
  audioUrl: string
  audioFileId?: string
  questions: ListeningQuestion[]
  questionGroups?: ListeningQuestionGroup[]
}

export class ListeningStore {
  currentPart: number = 1
  currentQuestionIndex: number = 0
  answers: Map<number, string | string[]> = new Map()
  parts: ListeningPart[] = []
  audioUrls: string[] = []  // All audio URLs independent from parts
  isPlaying: boolean = false
  hasStarted: boolean = false
  audioProgress: number = 0
  audioLoading: boolean = false
  audioError: string | null = null
  allAudioReady: boolean = false
  mockId: string | null = null
  sectionId: string | null = null
  isSubmitting: boolean = false
  isPreviewMode: boolean = false

  // Answer review properties (for admin result viewing)
  submittedAnswers: Map<number, string | string[]> = new Map() // User's submitted answers
  answerCorrectness: Map<number, boolean> = new Map() // Whether each answer is correct

  // Timer properties (audio duration + 10 minutes)
  audioDuration: number = 0 // Will be set based on actual audio duration
  timeRemaining: number = 0
  timerInterval: NodeJS.Timeout | null = null
  isTimeUp: boolean = false

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

  setParts(parts: ListeningPart[]) {
    this.parts = parts
  }

  setAudioUrls(urls: string[]) {
    this.audioUrls = urls
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

  setPartAudio(partId: number, url: string) {
    const idx = this.parts.findIndex((p) => p.id === partId)
    if (idx >= 0) {
      this.parts[idx] = { ...this.parts[idx], audioUrl: url }
      this.setAudioUrls(this.parts.map(p => p.audioUrl))
    }
  }

  setPartAudioMeta(partId: number, url: string, fileId?: string) {
    const idx = this.parts.findIndex((p) => p.id === partId)
    if (idx >= 0) {
      this.parts[idx] = { ...this.parts[idx], audioUrl: url, audioFileId: fileId }
    }
  }

  setAudioLoading(loading: boolean) {
    this.audioLoading = loading
  }

  setAudioError(err: string | null) {
    this.audioError = err
  }

  setAllAudioReady(ready: boolean) {
    this.allAudioReady = ready
  }

  setCurrentPart(partNumber: number) {
    this.currentPart = partNumber
    this.currentQuestionIndex = 0
  }

  setHasStarted(started: boolean) {
    this.hasStarted = started
  }

  setIsPlaying(playing: boolean) {
    this.isPlaying = playing
  }

  setAudioProgress(progress: number) {
    this.audioProgress = progress
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

  getAnswer(questionId: number): string | string[] | undefined {
    return this.answers.get(questionId)
  }

  isQuestionAnswered(questionNumber: number): boolean {
    const answer = this.answers.get(questionNumber)
    if (Array.isArray(answer)) {
      return answer.length > 0
    }
    return answer !== undefined && answer !== null && answer !== ''
  }

  goToQuestion(questionNumber: number) {
    const part = this.parts.find(
      (p) => questionNumber >= p.questionRange[0] && questionNumber <= p.questionRange[1]
    )
    if (!part) return

    this.currentPart = part.id
    this.currentQuestionIndex = questionNumber - part.questionRange[0]
  }

  get currentPartData(): ListeningPart | undefined {
    return this.parts.find((p) => p.id === this.currentPart)
  }

  get allQuestions(): ListeningQuestion[] {
    return this.parts.flatMap(part => part.questions)
  }

  get currentQuestionNumber(): number {
    const part = this.currentPartData
    if (!part) return 1
    return part.questionRange[0] + this.currentQuestionIndex
  }

  // Start timer after audio ends (audio duration + 10 minutes)
  startTimerAfterAudio(audioDurationInSeconds: number, onTimeUp: () => void, forceReset: boolean = false) {
    if (this.isPreviewMode) return

    this.audioDuration = audioDurationInSeconds
    const totalTime = audioDurationInSeconds + (10 * 60) // audio + 10 minutes

    this.stopTimer()

    // Try to restore timer from localStorage (only if not forcing reset)
    if (!forceReset && this.mockId && this.sectionId) {
      const savedTimer = this.restoreTimerState()
      if (savedTimer !== null) {
        this.timeRemaining = savedTimer
        console.log(`⏱️ Restored listening timer: ${Math.floor(savedTimer / 60)}:${String(savedTimer % 60).padStart(2, '0')}`)
      } else {
        this.timeRemaining = totalTime
        console.log(`⏱️ Starting fresh listening timer: ${Math.round(totalTime / 60)} minutes`)
      }
    } else {
      this.timeRemaining = totalTime
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
      const key = `listening_timer_${this.mockId}_${this.sectionId}`
      localStorage.setItem(key, String(this.timeRemaining))
    }
  }

  // Restore timer state from localStorage
  private restoreTimerState(): number | null {
    if (this.mockId && this.sectionId) {
      const key = `listening_timer_${this.mockId}_${this.sectionId}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const remaining = parseInt(saved, 10)
        if (!isNaN(remaining) && remaining > 0) {
          return remaining
        }
      }
    }
    return null
  }

  // Clear timer state from localStorage
  private clearTimerState() {
    if (this.mockId && this.sectionId) {
      const key = `listening_timer_${this.mockId}_${this.sectionId}`
      localStorage.removeItem(key)
    }
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
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
    questionType: string
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
      // For single answer questions (including FILL_IN_BLANKS_DRAG_DROP)
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

  reset() {
    this.stopTimer()
    this.currentPart = 1
    this.currentQuestionIndex = 0
    this.answers.clear()
    this.submittedAnswers.clear()
    this.answerCorrectness.clear()
    this._pendingAnswers.clear()
    this._isProcessingQueue = false
    this.parts = []
    this.audioUrls = []
    this.isPlaying = false
    this.hasStarted = false
    this.audioProgress = 0
    this.mockId = null
    this.sectionId = null
    this.isSubmitting = false
    this.audioDuration = 0
    this.timeRemaining = 0
    this.isTimeUp = false
  }
}

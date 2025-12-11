import { makeAutoObservable } from 'mobx'
import { mockSubmissionApi } from '@/services/testManagementApi'

export interface ListeningQuestion {
  id: number
  type: 'FILL_IN_BLANK' | 'MULTIPLE_CHOICE' | 'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_QUESTIONS_MULTIPLE_CHOICE' | 'MATCHING' | 'TABLE' | 'IMAGE_INPUTS' | 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN' | 'SENTENCE_COMPLETION' | 'SHORT_ANSWER' | 'MULTIPLE_CORRECT_ANSWERS' | 'MATRIX_TABLE' | 'TABLE_COMPLETION'
  text: string
  options?: string[]
  maxAnswers?: number
  // For IMAGE_INPUTS questions, we repeat imageUrl per question id; UI will render image once per imageUrl group
  imageUrl?: string
  correctAnswer?: string | string[] // Correct answer(s) for the question
}

export interface ListeningPart {
  id: number
  title: string
  instruction: string
  questionRange: [number, number]
  audioUrl: string
  audioFileId?: string
  questions: ListeningQuestion[]
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
  startTimerAfterAudio(audioDurationInSeconds: number, onTimeUp: () => void) {
    if (this.isPreviewMode) return
    
    this.audioDuration = audioDurationInSeconds
    const totalTime = audioDurationInSeconds + (10 * 60) // audio + 10 minutes
    this.timeRemaining = totalTime
    this.isTimeUp = false
    
    this.stopTimer()
    
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
    // Normalize answers for comparison (trim, lowercase)
    const normalize = (str: string) => str.trim().toLowerCase()

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

  reset() {
    this.stopTimer()
    this.currentPart = 1
    this.currentQuestionIndex = 0
    this.answers.clear()
    this.submittedAnswers.clear()
    this.answerCorrectness.clear()
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

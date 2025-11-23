import { makeAutoObservable } from 'mobx'
import { mockSubmissionApi } from '@/services/testManagementApi'

export interface ListeningQuestion {
  id: number
  type: 'FILL_IN_BLANK' | 'MULTIPLE_CHOICE' | 'MULTIPLE_CHOICE_SINGLE' | 'MATCHING' | 'TABLE' | 'IMAGE_INPUTS' | 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN' | 'SENTENCE_COMPLETION' | 'SHORT_ANSWER'
  text: string
  options?: string[]
  // For IMAGE_INPUTS questions, we repeat imageUrl per question id; UI will render image once per imageUrl group
  imageUrl?: string
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

  setParts(parts: ListeningPart[]) {
    this.parts = parts
  }

  setAudioUrls(urls: string[]) {
    this.audioUrls = urls
  }

  async finishSection() {
    if (!this.mockId || !this.sectionId) {
      console.log('Cannot finish section: missing mockId/sectionId')
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
    
    // Auto-submit answer
    if (this.mockId && this.sectionId) {
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

  reset() {
    this.stopTimer()
    this.currentPart = 1
    this.currentQuestionIndex = 0
    this.answers.clear()
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

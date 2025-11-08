import { makeAutoObservable } from 'mobx'

export interface ListeningQuestion {
  id: number
  type: 'FILL_IN_BLANK' | 'MULTIPLE_CHOICE' | 'MULTIPLE_CHOICE_SINGLE' | 'MATCHING' | 'TABLE' | 'IMAGE_INPUTS' | 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN' | 'SENTENCE_COMPLETION'
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
  isPlaying: boolean = false
  hasStarted: boolean = false
  audioProgress: number = 0
  audioLoading: boolean = false
  audioError: string | null = null
  allAudioReady: boolean = false

  constructor() {
    makeAutoObservable(this)
  }

  setParts(parts: ListeningPart[]) {
    this.parts = parts
  }

  reset() {
    this.currentPart = 1
    this.currentQuestionIndex = 0
    this.answers.clear()
    this.isPlaying = false
    this.hasStarted = false
    this.audioProgress = 0
    this.audioLoading = false
    this.audioError = null
    this.allAudioReady = false
  }

  setPartAudio(partId: number, url: string) {
    const idx = this.parts.findIndex((p) => p.id === partId)
    if (idx >= 0) {
      this.parts[idx] = { ...this.parts[idx], audioUrl: url }
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

  setAnswer(questionId: number, value: string | string[]) {
    this.answers.set(questionId, value)
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
}

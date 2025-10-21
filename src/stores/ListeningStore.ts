import { makeAutoObservable } from 'mobx'

export interface ListeningQuestion {
  id: number
  type: 'FILL_IN_BLANK' | 'MULTIPLE_CHOICE' | 'MATCHING' | 'TABLE'
  text: string
  options?: string[]
}

export interface ListeningPart {
  id: number
  title: string
  instruction: string
  questionRange: [number, number]
  audioUrl: string
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

  constructor() {
    makeAutoObservable(this)
  }

  setParts(parts: ListeningPart[]) {
    this.parts = parts
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

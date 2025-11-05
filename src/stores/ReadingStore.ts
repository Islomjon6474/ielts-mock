import { makeAutoObservable } from 'mobx'
import * as R from 'ramda'

export type QuestionType = 'TRUE_FALSE_NOT_GIVEN' | 'FILL_IN_BLANK' | 'MATCH_HEADING' | 'MULTIPLE_CHOICE'

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
}

export interface QuestionGroup {
  instruction?: string
  imageUrl?: string
  questions: Question[]
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
  isPreviewMode: boolean = false

  constructor() {
    makeAutoObservable(this)
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

  setAnswer(questionId: number, value: string | string[]) {
    this.answers.set(questionId, value)
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
    const currentPart = this.parts[this.currentPart - 1]
    if (!currentPart) return

    if (this.currentQuestionIndex < currentPart.questions.length - 1) {
      this.currentQuestionIndex++
    } else if (this.currentPart < this.parts.length) {
      this.currentPart++
      this.currentQuestionIndex = 0
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--
    } else if (this.currentPart > 1) {
      this.currentPart--
      const prevPart = this.parts[this.currentPart - 1]
      this.currentQuestionIndex = prevPart.questions.length - 1
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

  reset() {
    this.currentPart = 1
    this.currentQuestionIndex = 0
    this.answers.clear()
  }
}

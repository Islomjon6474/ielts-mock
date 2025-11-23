import { makeAutoObservable } from 'mobx'
import * as R from 'ramda'
import { mockSubmissionApi } from '@/services/testManagementApi'

export type QuestionType = 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN' | 'FILL_IN_BLANK' | 'MATCH_HEADING' | 'MULTIPLE_CHOICE' | 'MULTIPLE_CHOICE_SINGLE' | 'IMAGE_INPUTS' | 'SENTENCE_COMPLETION'

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
  isPreviewMode: boolean = false
  mockId: string | null = null
  sectionId: string | null = null
  isSubmitting: boolean = false

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
      throw error
    } finally {
      this.isSubmitting = false
    }
  }

  reset() {
    this.currentPart = 1
    this.currentQuestionIndex = 0
    this.answers.clear()
    this.mockId = null
    this.sectionId = null
    this.isSubmitting = false
  }
}

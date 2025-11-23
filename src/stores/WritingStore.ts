import { makeAutoObservable } from 'mobx'
import { mockSubmissionApi } from '@/services/testManagementApi'

export interface WritingTask {
  id: number
  title: string
  timeMinutes: number
  minWords: number
  instruction: string
  question: string
  image?: string
}

export class WritingStore {
  currentTask: number = 1
  answers: Map<number, string> = new Map()
  tasks: WritingTask[] = []
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

  setTasks(tasks: WritingTask[]) {
    this.tasks = tasks
  }

  setCurrentTask(taskNumber: number) {
    this.currentTask = taskNumber
  }

  setAnswer(taskId: number, text: string) {
    this.answers.set(taskId, text)
  }

  getAnswer(taskId: number): string {
    return this.answers.get(taskId) || ''
  }

  getWordCount(taskId: number): number {
    const text = this.getAnswer(taskId)
    if (!text.trim()) return 0
    return text.trim().split(/\s+/).length
  }

  get currentTaskData(): WritingTask | undefined {
    return this.tasks.find(t => t.id === this.currentTask)
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
      throw error
    } finally {
      this.isSubmitting = false
    }
  }

  reset() {
    this.currentTask = 1
    this.answers.clear()
    this.tasks = []
    this.mockId = null
    this.sectionId = null
    this.isSubmitting = false
  }
}

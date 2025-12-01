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
  isPreviewMode: boolean = false

  // Timer properties
  timeLimit: number = 60 * 60 // 60 minutes in seconds
  timeRemaining: number = 60 * 60
  timerInterval: NodeJS.Timeout | null = null
  isTimeUp: boolean = false

  // Auto-save properties
  autoSaveInterval: NodeJS.Timeout | null = null
  autoSaveIntervalTime: number = 10 * 1000 // 10 seconds in milliseconds

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

  setTasks(tasks: WritingTask[]) {
    this.tasks = tasks
  }

  setCurrentTask(taskNumber: number) {
    this.currentTask = taskNumber
  }

  setAnswer(taskId: number, text: string) {
    this.answers.set(taskId, text)
  }

  /**
   * Save all current answers to the server
   */
  async saveAnswers() {
    if (!this.mockId || !this.sectionId || this.isPreviewMode) {
      return
    }

    try {
      // Send all answers to the server
      const savePromises = Array.from(this.answers.entries()).map(([taskId, answer]) => {
        // Only save if there's actual content
        if (answer && answer.trim()) {
          return mockSubmissionApi.sendAnswer(
            this.mockId!,
            this.sectionId!,
            taskId,
            answer
          )
        }
        return Promise.resolve()
      })

      await Promise.all(savePromises)
      console.log('✅ Writing answers saved successfully')
    } catch (error) {
      console.error('❌ Failed to save writing answers:', error)
    }
  }

  /**
   * Start auto-save interval
   */
  startAutoSave() {
    if (this.isPreviewMode) return

    this.stopAutoSave()

    this.autoSaveInterval = setInterval(() => {
      this.saveAnswers()
    }, this.autoSaveIntervalTime)

    console.log('✅ Auto-save started (every 10 seconds)')
  }

  /**
   * Stop auto-save interval
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
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
    if (!this.mockId || !this.sectionId || this.isPreviewMode) {
      console.log('Cannot finish section: missing mockId/sectionId or in preview mode')
      return
    }

    try {
      this.isSubmitting = true

      // Save all answers before finishing
      await this.saveAnswers()

      // Then finish the section
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
    this.stopAutoSave()
    this.currentTask = 1
    this.answers.clear()
    this.tasks = []
    this.mockId = null
    this.sectionId = null
    this.isSubmitting = false
    this.timeRemaining = this.timeLimit
    this.isTimeUp = false
  }
}

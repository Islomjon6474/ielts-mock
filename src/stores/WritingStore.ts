import { makeAutoObservable } from 'mobx'

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

  constructor() {
    makeAutoObservable(this)
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
}

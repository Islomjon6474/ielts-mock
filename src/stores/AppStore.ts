import { makeAutoObservable } from 'mobx'
import * as R from 'ramda'

export class AppStore {
  currentModule: string | null = null
  testProgress: number = 0
  isTestActive: boolean = false

  constructor() {
    makeAutoObservable(this)
  }

  setCurrentModule(module: string) {
    this.currentModule = module
  }

  setTestProgress(progress: number) {
    this.testProgress = R.clamp(0, 100, progress)
  }

  startTest() {
    this.isTestActive = true
    this.testProgress = 0
  }

  endTest() {
    this.isTestActive = false
    this.testProgress = 0
    this.currentModule = null
  }

  resetTest() {
    this.testProgress = 0
  }
}

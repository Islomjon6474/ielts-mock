import { AppStore } from './AppStore'
import { ReadingStore } from './ReadingStore'
import { WritingStore } from './WritingStore'
import { ListeningStore } from './ListeningStore'
import { AuthStore } from './AuthStore'

export class RootStore {
  appStore: AppStore
  readingStore: ReadingStore
  writingStore: WritingStore
  listeningStore: ListeningStore
  authStore: AuthStore

  constructor() {
    this.appStore = new AppStore()
    this.readingStore = new ReadingStore()
    this.writingStore = new WritingStore()
    this.listeningStore = new ListeningStore()
    this.authStore = new AuthStore()
  }
}

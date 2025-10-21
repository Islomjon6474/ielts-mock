import { AppStore } from './AppStore'
import { ReadingStore } from './ReadingStore'
import { WritingStore } from './WritingStore'
import { ListeningStore } from './ListeningStore'

export class RootStore {
  appStore: AppStore
  readingStore: ReadingStore
  writingStore: WritingStore
  listeningStore: ListeningStore

  constructor() {
    this.appStore = new AppStore()
    this.readingStore = new ReadingStore()
    this.writingStore = new WritingStore()
    this.listeningStore = new ListeningStore()
  }
}

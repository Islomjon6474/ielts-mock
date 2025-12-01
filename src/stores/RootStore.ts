import { AppStore } from './AppStore'
import { ReadingStore } from './ReadingStore'
import { WritingStore } from './WritingStore'
import { ListeningStore } from './ListeningStore'
import { AuthStore } from './AuthStore'
import { AdminStore } from './AdminStore'
import { ThemeStore } from './ThemeStore'

export class RootStore {
  appStore: AppStore
  readingStore: ReadingStore
  writingStore: WritingStore
  listeningStore: ListeningStore
  authStore: AuthStore
  adminStore: AdminStore
  themeStore: ThemeStore

  constructor() {
    this.appStore = new AppStore()
    this.readingStore = new ReadingStore()
    this.writingStore = new WritingStore()
    this.listeningStore = new ListeningStore()
    this.authStore = new AuthStore()
    this.adminStore = new AdminStore()
    this.themeStore = new ThemeStore()
  }
}

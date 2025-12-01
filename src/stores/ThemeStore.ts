import { makeAutoObservable } from 'mobx'

export type ThemeType = 'light' | 'dark' | 'yellow'

export interface ThemeColors {
  background: string
  foreground: string
  cardBackground: string
  borderColor: string
  primary: string
  secondary: string
  textPrimary: string
  textSecondary: string
  buttonBackground: string
  buttonText: string
  inputBackground: string
  inputBorder: string
  headerBackground: string
}

export const themes: Record<ThemeType, ThemeColors> = {
  light: {
    background: '#ffffff',
    foreground: '#000000',
    cardBackground: '#ffffff',
    borderColor: '#d9d9d9',
    primary: '#1677ff',
    secondary: '#f5f5f5',
    textPrimary: '#000000',
    textSecondary: '#666666',
    buttonBackground: '#1677ff',
    buttonText: '#ffffff',
    inputBackground: '#ffffff',
    inputBorder: '#d9d9d9',
    headerBackground: '#ffffff',
  },
  dark: {
    background: '#000000',
    foreground: '#ffffff',
    cardBackground: '#1a1a1a',
    borderColor: '#434343',
    primary: '#1677ff',
    secondary: '#2a2a2a',
    textPrimary: '#ffffff',
    textSecondary: '#cccccc',
    buttonBackground: '#1677ff',
    buttonText: '#ffffff',
    inputBackground: '#1a1a1a',
    inputBorder: '#434343',
    headerBackground: '#1a1a1a',
  },
  yellow: {
    background: '#000000',
    foreground: '#ffff00',
    cardBackground: '#1a1a00',
    borderColor: '#666600',
    primary: '#ffff00',
    secondary: '#333300',
    textPrimary: '#ffff00',
    textSecondary: '#cccc00',
    buttonBackground: '#ffff00',
    buttonText: '#000000',
    inputBackground: '#1a1a00',
    inputBorder: '#666600',
    headerBackground: '#1a1a00',
  },
}

export const themeLabels: Record<ThemeType, string> = {
  light: 'Black on White',
  dark: 'White on Black',
  yellow: 'Yellow on Black',
}

export class ThemeStore {
  currentTheme: ThemeType = 'light'
  fontSize: number = 16 // Base font size in pixels (14-22px range)

  constructor() {
    makeAutoObservable(this)
    // Load theme and font size from localStorage on initialization
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('ielts-theme') as ThemeType
      if (savedTheme && themes[savedTheme]) {
        this.currentTheme = savedTheme
      }

      const savedFontSize = localStorage.getItem('ielts-font-size')
      if (savedFontSize) {
        const parsedSize = parseInt(savedFontSize, 10)
        if (parsedSize >= 14 && parsedSize <= 22) {
          this.fontSize = parsedSize
        }
      }
    }
  }

  setTheme(theme: ThemeType) {
    this.currentTheme = theme
    if (typeof window !== 'undefined') {
      localStorage.setItem('ielts-theme', theme)
      this.applyTheme()
    }
  }

  setFontSize(size: number) {
    // Clamp font size between 14px and 22px
    this.fontSize = Math.max(14, Math.min(22, size))
    if (typeof window !== 'undefined') {
      localStorage.setItem('ielts-font-size', this.fontSize.toString())
      this.applyFontSize()
    }
  }

  applyTheme() {
    const theme = themes[this.currentTheme]
    const root = document.documentElement

    // Apply CSS variables
    root.style.setProperty('--background', theme.background)
    root.style.setProperty('--foreground', theme.foreground)
    root.style.setProperty('--card-background', theme.cardBackground)
    root.style.setProperty('--border-color', theme.borderColor)
    root.style.setProperty('--primary', theme.primary)
    root.style.setProperty('--secondary', theme.secondary)
    root.style.setProperty('--text-primary', theme.textPrimary)
    root.style.setProperty('--text-secondary', theme.textSecondary)
    root.style.setProperty('--button-background', theme.buttonBackground)
    root.style.setProperty('--button-text', theme.buttonText)
    root.style.setProperty('--input-background', theme.inputBackground)
    root.style.setProperty('--input-border', theme.inputBorder)
    root.style.setProperty('--header-background', theme.headerBackground)
  }

  applyFontSize() {
    const root = document.documentElement
    // Set base font size on html element
    root.style.setProperty('--font-size-base', `${this.fontSize}px`)
    root.style.fontSize = `${this.fontSize}px`
  }

  get colors(): ThemeColors {
    return themes[this.currentTheme]
  }

  get label(): string {
    return themeLabels[this.currentTheme]
  }

  get fontSizeLabel(): string {
    if (this.fontSize <= 15) return 'Small'
    if (this.fontSize <= 17) return 'Medium'
    if (this.fontSize <= 19) return 'Large'
    return 'Extra Large'
  }
}

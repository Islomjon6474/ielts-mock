import { makeAutoObservable, runInAction } from 'mobx'
import { testManagementApi } from '@/services/testManagementApi'
import type { TestDto, SectionDto, PartDto } from '@/types/api'
import type { MockResultDto } from '@/services/mockResultApi'

export class AdminStore {
  // Current test being edited
  currentTest: TestDto | null = null
  currentTestId: string | null = null

  // Sections for current test
  sections: SectionDto[] = []
  currentSectionId: string | null = null

  // Parts for current section (cached by sectionId)
  partsCache: Map<string, PartDto[]> = new Map()

  // Part content cache (to avoid refetching)
  partContentCache: Map<string, any> = new Map()

  // Mock results cache (keyed by mock result id)
  mockResultsCache: Map<string, MockResultDto> = new Map()

  // Loading states
  isLoadingTest: boolean = false
  isLoadingSections: boolean = false
  isLoadingParts: boolean = false

  // Error states
  error: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  // ============================================================================
  // Test Management
  // ============================================================================

  /**
   * Load a test by ID
   */
  async loadTest(testId: string, force: boolean = false) {
    // Return cached if available and not forcing refresh
    if (!force && this.currentTestId === testId && this.currentTest) {
      console.log('📦 Using cached test:', testId)
      return this.currentTest
    }

    try {
      runInAction(() => {
        this.isLoadingTest = true
        this.error = null
      })

      console.log('📥 Fetching test:', testId)
      const response = await testManagementApi.getTest(testId)
      const test = response.data || response

      runInAction(() => {
        this.currentTest = test
        this.currentTestId = testId
        this.isLoadingTest = false
      })

      console.log('✅ Test loaded:', test)
      return test
    } catch (error: any) {
      console.error('❌ Error loading test:', error)
      runInAction(() => {
        this.error = error.message || 'Failed to load test'
        this.isLoadingTest = false
      })
      throw error
    }
  }

  /**
   * Clear current test
   */
  clearTest() {
    runInAction(() => {
      this.currentTest = null
      this.currentTestId = null
      this.sections = []
      this.currentSectionId = null
      this.partsCache.clear()
      this.partContentCache.clear()
    })
  }

  // ============================================================================
  // Section Management
  // ============================================================================

  /**
   * Load sections for a test
   */
  async loadSections(testId: string, force: boolean = false) {
    // Return cached if available and not forcing refresh
    if (!force && this.currentTestId === testId && this.sections.length > 0) {
      console.log('📦 Using cached sections for test:', testId)
      return this.sections
    }

    try {
      runInAction(() => {
        this.isLoadingSections = true
        this.error = null
      })

      console.log('📥 Fetching sections for test:', testId)
      const response = await testManagementApi.getAllSections(testId)
      const sections = response.data || response || []

      runInAction(() => {
        this.sections = sections
        this.currentTestId = testId
        this.isLoadingSections = false
      })

      console.log(`✅ Loaded ${sections.length} sections`)
      return sections
    } catch (error: any) {
      console.error('❌ Error loading sections:', error)
      runInAction(() => {
        this.error = error.message || 'Failed to load sections'
        this.isLoadingSections = false
      })
      throw error
    }
  }

  /**
   * Get a specific section by ID
   */
  getSection(sectionId: string): SectionDto | null {
    return this.sections.find(s => s.id === sectionId) || null
  }

  /**
   * Get section by type
   */
  getSectionByType(sectionType: string): SectionDto | null {
    return this.sections.find(
      s => s.sectionType.toLowerCase() === sectionType.toLowerCase()
    ) || null
  }

  // ============================================================================
  // Part Management
  // ============================================================================

  /**
   * Load parts for a section
   */
  async loadParts(sectionId: string, force: boolean = false) {
    // Return cached if available and not forcing refresh
    if (!force && this.partsCache.has(sectionId)) {
      console.log('📦 Using cached parts for section:', sectionId)
      return this.partsCache.get(sectionId)!
    }

    try {
      runInAction(() => {
        this.isLoadingParts = true
        this.error = null
      })

      console.log('📥 Fetching parts for section:', sectionId)
      const response = await testManagementApi.getAllParts(sectionId)
      const parts = response.data || response || []

      // Sort parts by ord field
      const sortedParts = [...parts].sort((a, b) => a.ord - b.ord)

      runInAction(() => {
        this.partsCache.set(sectionId, sortedParts)
        this.currentSectionId = sectionId
        this.isLoadingParts = false
      })

      console.log(`✅ Loaded ${sortedParts.length} parts:`, sortedParts.map(p => `Part ${p.ord}`).join(', '))
      return sortedParts
    } catch (error: any) {
      console.error('❌ Error loading parts:', error)
      runInAction(() => {
        this.error = error.message || 'Failed to load parts'
        this.isLoadingParts = false
      })
      throw error
    }
  }

  /**
   * Get parts for a section (from cache)
   */
  getParts(sectionId: string): PartDto[] {
    return this.partsCache.get(sectionId) || []
  }

  /**
   * Get a specific part by ID
   */
  getPart(partId: string): PartDto | null {
    // Search through all cached parts
    for (const parts of this.partsCache.values()) {
      const part = parts.find(p => p.id === partId)
      if (part) return part
    }
    return null
  }

  /**
   * Get part order (ord field) by part ID
   * This is the main method to get "Part 1", "Part 2", etc.
   */
  getPartOrder(partId: string): number | null {
    const part = this.getPart(partId)
    return part?.ord ?? null
  }

  /**
   * Get part by order number within a section
   */
  getPartByOrder(sectionId: string, order: number): PartDto | null {
    const parts = this.getParts(sectionId)
    return parts.find(p => p.ord === order) || null
  }

  /**
   * Invalidate parts cache for a section (call after creating/deleting parts)
   */
  invalidatePartsCache(sectionId: string) {
    console.log('🗑️ Invalidating parts cache for section:', sectionId)
    this.partsCache.delete(sectionId)
  }

  // ============================================================================
  // Part Content Management
  // ============================================================================

  /**
   * Load part content
   */
  async loadPartContent(partId: string, force: boolean = false) {
    // Return cached if available and not forcing refresh
    if (!force && this.partContentCache.has(partId)) {
      console.log('📦 Using cached content for part:', partId)
      return this.partContentCache.get(partId)
    }

    try {
      console.log('📥 Fetching content for part:', partId)
      const response = await testManagementApi.getPartQuestionContent(partId)
      const contentString = response.data?.content || response.content || null

      if (!contentString) {
        console.log('⚠️ No content found for part:', partId)
        return null
      }

      // Parse the content
      let parsedContent
      try {
        parsedContent = JSON.parse(contentString)
      } catch (e) {
        console.error('❌ Failed to parse content:', e)
        return null
      }

      runInAction(() => {
        this.partContentCache.set(partId, parsedContent)
      })

      console.log('✅ Content loaded for part:', partId)
      return parsedContent
    } catch (error: any) {
      console.error('❌ Error loading part content:', error)
      // Not an error if content doesn't exist yet
      return null
    }
  }

  /**
   * Get part content from cache
   */
  getPartContent(partId: string): any | null {
    return this.partContentCache.get(partId) || null
  }

  /**
   * Invalidate part content cache (call after saving content)
   */
  invalidatePartContentCache(partId: string) {
    console.log('🗑️ Invalidating content cache for part:', partId)
    this.partContentCache.delete(partId)
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get the total number of parts across all sections
   */
  getTotalParts(): number {
    let total = 0
    for (const parts of this.partsCache.values()) {
      total += parts.length
    }
    return total
  }

  /**
   * Check if data is loaded for a test
   */
  isTestLoaded(testId: string): boolean {
    return this.currentTestId === testId && this.currentTest !== null
  }

  /**
   * Check if sections are loaded for a test
   */
  areSectionsLoaded(testId: string): boolean {
    return this.currentTestId === testId && this.sections.length > 0
  }

  /**
   * Check if parts are loaded for a section
   */
  arePartsLoaded(sectionId: string): boolean {
    return this.partsCache.has(sectionId)
  }

  // ============================================================================
  // Mock Results Management
  // ============================================================================

  /**
   * Store multiple mock results in cache
   */
  storeMockResults(results: MockResultDto[]) {
    runInAction(() => {
      results.forEach(result => {
        this.mockResultsCache.set(result.id, result)
      })
    })
    console.log(`📦 Stored ${results.length} mock results in cache`)
  }

  /**
   * Store a single mock result in cache
   */
  storeMockResult(result: MockResultDto) {
    runInAction(() => {
      this.mockResultsCache.set(result.id, result)
    })
    console.log(`📦 Stored mock result ${result.id} in cache`)
  }

  /**
   * Get a mock result from cache by ID
   */
  getMockResult(mockId: string): MockResultDto | null {
    return this.mockResultsCache.get(mockId) || null
  }

  /**
   * Get student name from cached mock result
   */
  getStudentName(mockId: string): { firstName: string; lastName: string } | null {
    const result = this.mockResultsCache.get(mockId)
    if (!result) {
      console.warn(`⚠️ Mock result ${mockId} not found in cache`)
      return null
    }

    const firstName = result.firstName || result.userFirstName || result.userName?.split(' ')[0] || 'Unknown'
    const lastName = result.lastName || result.userLastName || result.userName?.split(' ')[1] || ''

    return { firstName, lastName }
  }

  /**
   * Get test name from cached mock result
   */
  getTestName(mockId: string): string | null {
    const result = this.mockResultsCache.get(mockId)
    return result?.testName || null
  }

  /**
   * Clear mock results cache
   */
  clearMockResultsCache() {
    runInAction(() => {
      this.mockResultsCache.clear()
    })
    console.log('🗑️ Cleared mock results cache')
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Clear all error states
   */
  clearError() {
    runInAction(() => {
      this.error = null
    })
  }

  /**
   * Reset the entire store
   */
  reset() {
    runInAction(() => {
      this.currentTest = null
      this.currentTestId = null
      this.sections = []
      this.currentSectionId = null
      this.partsCache.clear()
      this.partContentCache.clear()
      this.mockResultsCache.clear()
      this.isLoadingTest = false
      this.isLoadingSections = false
      this.isLoadingParts = false
      this.error = null
    })
    console.log('🔄 AdminStore reset')
  }
}

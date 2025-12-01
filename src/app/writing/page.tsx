'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import WritingTestLayout from '@/components/writing/WritingTestLayout'
import { mockSubmissionApi, fileApi } from '@/services/testManagementApi'
import { safeMultiParseJson } from '@/utils/json'
import type { TestDto, SectionDto, PartDto } from '@/types/api'
import { enterFullscreen, exitFullscreen, onFullscreenChange } from '@/utils/fullscreen'
import { playWarningSound } from '@/utils/audioAlert'

const WritingPageContent = observer(() => {
  const { writingStore } = useStore()
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const urlTestId = searchParams.get('testId')
  const urlMockId = searchParams.get('mockId')
  const isPreviewMode = searchParams.get('preview') === 'true'
  const isSubmittingRef = useRef(false) // Track if user is submitting

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Reset writing store and set preview mode
        writingStore.reset()
        writingStore.setPreviewMode(isPreviewMode)
        
        let testIdToUse: string | null = null
        
        // If testId provided in URL, use it directly
        if (urlTestId) {
          console.log('📎 Using testId from URL:', urlTestId)
          testIdToUse = urlTestId
        } else {
          // 1) Get active tests and take the first ACTIVE one
          const testsResp = await mockSubmissionApi.getAllTests(0, 100)
          const allTests: TestDto[] = testsResp.data
          
          // Filter for active tests only (isActive === 1)
          const activeTests = allTests.filter((t) => t.isActive === 1)
          
          // If no active tests, use first available test
          const test = activeTests.length > 0 ? activeTests[0] : allTests[0]
          
          if (!test) {
            console.log('❌ No tests found')
            writingStore.setTasks([])
            setLoading(false)
            return
          }
          
          testIdToUse = test.id
          console.log('✍️ Loading writing test:', test.name || test.id)
        }

        // Ensure testIdToUse is not null
        if (!testIdToUse) {
          console.log('❌ No test ID available')
          writingStore.setTasks([])
          setLoading(false)
          return
        }

        // 2) Get or start mock test
        let mockId: string
        
        if (urlMockId) {
          // Use mockId from URL (for viewing results or continuing test)
          mockId = urlMockId
          console.log('✍️ Using mockId from URL:', mockId)
          
          // Check if this mock is finished to automatically enable preview mode
          const mocksResp = await mockSubmissionApi.getAllMocks(0, 100)
          const allMocks = mocksResp.data || []
          const mock = allMocks.find((m) => m.id === mockId)
          if (mock && mock.isFinished === 1) {
            console.log('✍️ Mock is finished, enabling preview mode')
            writingStore.setPreviewMode(true)
          }
        } else {
          // First, check if there's an existing unfinished mock session
          const mocksResp = await mockSubmissionApi.getAllMocks(0, 100)
          const allMocks = mocksResp.data || []
          let existingMock = allMocks.find((m) => m.testId === testIdToUse && m.isFinished === 0)
          
          if (existingMock) {
            mockId = existingMock.id
            console.log('✍️ Resuming existing mock session:', mockId)
          } else {
            const mockResp = await mockSubmissionApi.startMock(testIdToUse)
            mockId = mockResp.data
            console.log('✍️ Started new mock session:', mockId)
          }
        }

        // 3) Get sections and pick writing
        const sectionsResp = await mockSubmissionApi.getAllSections(testIdToUse)
        const sections: SectionDto[] = sectionsResp.data
        const writingSection = sections.find((s) => s.sectionType.toLowerCase() === 'writing')
        if (!writingSection) {
          writingStore.setTasks([])
          setLoading(false)
          return
        }

        // 4) Start writing section
        await mockSubmissionApi.startSection(mockId, writingSection.id)
        console.log('✍️ Started writing section:', writingSection.id)

        // 5) Set mockId and sectionId in store for submission
        writingStore.setMockId(mockId)
        writingStore.setSectionId(writingSection.id)

        // 6) Get parts and their content
        console.log('🔍 Getting parts for writing section ID:', writingSection.id)
        const partsResp = await mockSubmissionApi.getAllParts(writingSection.id)
        console.log('📦 Parts response:', partsResp)
        
        const parts: PartDto[] = partsResp.data
        console.log('✍️ All parts for writing:', parts.length, parts)
        
        interface WritingTaskData {
          id: number
          title: string
          timeMinutes: number
          minWords: number
          instruction: string
          question: string
          image?: string
        }
        const allTasks: WritingTaskData[] = []
        
        for (const part of parts) {
          try {
            console.log('📄 Processing part:', part.id)
            const contentResp = await mockSubmissionApi.getPartQuestionContent(part.id)
            const raw = contentResp.data.content
            if (!raw) {
              console.log('⚠️ No content for part:', part.id)
              continue
            }
            
            const partData: any = safeMultiParseJson(raw, 10)
            const dataToUse = partData?.user || partData?.admin || partData
            
            console.log('📝 Part data:', part.id, dataToUse)
            
            // Skip parts with questionGroups (those are reading/listening parts)
            if (dataToUse?.questionGroups) {
              console.log('⏭️ Skipping part with questionGroups:', part.id)
              continue
            }
            
            // Extract task description from passage field (used in admin)
            const questionText = dataToUse.passage || dataToUse.question || dataToUse.text || 'Write your response based on the task instructions.'
            
            const task = {
              id: allTasks.length + 1,
              title: dataToUse.title || `Task ${allTasks.length + 1}`,
              timeMinutes: Number(dataToUse.timeMinutes) || (allTasks.length === 0 ? 20 : 40),
              minWords: Number(dataToUse.minWords) || (allTasks.length === 0 ? 150 : 250),
              instruction: dataToUse.instruction || '',
              question: questionText,
              image: fileApi.getImageUrl(dataToUse.imageId),
            }
            allTasks.push(task)
            console.log('✅ Added writing task:', task)
          } catch (partError) {
            console.error('❌ Error processing part:', part.id, partError)
            // Continue to next part
          }
        }
        
        console.log('✍️ Total writing tasks loaded:', allTasks.length)

        writingStore.setTasks(allTasks)

        // 4.5) Enter fullscreen mode if not in preview mode
        if (!writingStore.isPreviewMode) {
          try {
            await enterFullscreen()
            console.log('✅ Entered fullscreen mode')
          } catch (error) {
            console.log('⚠️ Could not enter fullscreen (may need user interaction):', error)
          }
        }

        // 5) Start timer (60 minutes)
        writingStore.startTimer(async () => {
          console.log('⏰ Time is up! Auto-submitting...')
          try {
            await writingStore.finishSection()
            window.location.href = '/'
          } catch (error) {
            console.error('Failed to auto-submit:', error)
          }
        })

        // 5.5) Start auto-save (every 10 seconds)
        if (!writingStore.isPreviewMode) {
          writingStore.startAutoSave()
        }

        // 6) Load previously submitted answers (if any)
        try {
          console.log('🔄 Loading previously submitted answers...')
          const answersResp = await mockSubmissionApi.getSubmittedAnswers(mockId, writingSection.id)
          const submittedAnswers = answersResp.data
          
          if (submittedAnswers.length > 0) {
            console.log(`✅ Found ${submittedAnswers.length} previously submitted answers`)
            submittedAnswers.forEach((answer: any) => {
              const questionOrd = answer.questionOrd || answer.ord
              const answerValue = answer.answer
              
              if (questionOrd && answerValue) {
                // For writing, questionOrd corresponds to task ID (1 for Task 1, 2 for Task 2)
                writingStore.answers.set(questionOrd, answerValue)
                console.log(`📝 Restored answer for Task ${questionOrd}`)
              }
            })
          } else {
            console.log('ℹ️ No previously submitted answers found')
          }
        } catch (error) {
          console.error('⚠️ Error loading submitted answers:', error)
          // Continue anyway - this is not critical
        }
      } catch (error) {
        console.error('❌ Error loading writing test:', error)
        writingStore.setTasks([])
      } finally {
        setLoading(false)
      }
    }
    load()

    // Cleanup: exit fullscreen when component unmounts
    return () => {
      exitFullscreen().catch(() => {
        // Ignore errors on cleanup
      })
    }
  }, [urlTestId])

  // Listen for fullscreen changes and play warning sound if exited via ESC
  useEffect(() => {
    if (writingStore.isPreviewMode) return // Don't monitor in preview mode

    const cleanup = onFullscreenChange((isFullscreen) => {
      // If user exited fullscreen (not in fullscreen) and they're NOT submitting
      if (!isFullscreen && !isSubmittingRef.current) {
        console.log('⚠️ User exited fullscreen without submitting!')
        playWarningSound()
      }
    })

    // Cleanup listener
    return cleanup
  }, [writingStore.isPreviewMode])

  // Pass the submitting ref to the layout so it can set it when submitting
  useEffect(() => {
    // Expose a method to mark as submitting
    ;(window as any).__markWritingAsSubmitting = () => {
      isSubmittingRef.current = true
    }
    return () => {
      delete (window as any).__markWritingAsSubmitting
    }
  }, [])

  if (loading) return null
  return <WritingTestLayout isPreviewMode={writingStore.isPreviewMode} />
})

function WritingPage() {
  return (
    <Suspense fallback={null}>
      <WritingPageContent />
    </Suspense>
  )
}

export default WritingPage

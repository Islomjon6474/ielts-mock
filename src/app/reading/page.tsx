'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import ReadingTestLayout from '@/components/reading/ReadingTestLayout'
import { mockSubmissionApi, fileApi } from '@/services/testManagementApi'
import { safeMultiParseJson } from '@/utils/json'

const ReadingPageContent = observer(() => {
  const { readingStore } = useStore()
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const urlTestId = searchParams.get('testId')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        
        // Reset reading store to ensure clean state
        readingStore.reset()
        // Ensure preview mode is disabled on user side
        readingStore.setPreviewMode(false)
        
        let testIdToUse: string | null = null
        
        // If testId provided in URL, use it directly
        if (urlTestId) {
          console.log('📎 Using testId from URL:', urlTestId)
          testIdToUse = urlTestId
        } else {
          // Otherwise, get first active test
          const testsResp = await mockSubmissionApi.getAllTests(0, 100)
          console.log('📊 Tests response:', testsResp)
          
          const allTests = testsResp?.data || []
          console.log('📋 All tests:', allTests.length, allTests)
          
          // Filter for active tests only (isActive === 1)
          const activeTests = allTests.filter((t) => t.isActive === 1)
          console.log('✅ Active tests:', activeTests.length, activeTests)
          
          // If no active tests, use first available test
          const test = activeTests.length > 0 ? activeTests[0] : allTests[0]
          
          if (!test) {
            console.log('❌ No tests found at all')
            readingStore.setParts([])
            setLoading(false)
            return
          }
          
          testIdToUse = test.id
          console.log('📖 Loading reading test:', test.name || test.id, 'Active:', test.isActive)
        }

        // Ensure testIdToUse is not null
        if (!testIdToUse) {
          console.log('❌ No test ID available')
          readingStore.setParts([])
          setLoading(false)
          return
        }

        // 2) Get or start mock test
        // First, check if there's an existing mock session
        const mocksResp = await mockSubmissionApi.getAllMocks(0, 100)
        const allMocks = mocksResp.data || []
        let existingMock = allMocks.find((m) => m.testId === testIdToUse && m.isFinished === 0)
        
        let mockId: string
        if (existingMock) {
          mockId = existingMock.id
          console.log('📖 Resuming existing mock session:', mockId)
        } else {
          const mockResp = await mockSubmissionApi.startMock(testIdToUse)
          mockId = mockResp.data
          console.log('📖 Started new mock session:', mockId)
        }
        
        // 3) Get sections and pick reading
        console.log('🔍 Getting sections for test ID:', testIdToUse)
        
        const sectionsResp = await mockSubmissionApi.getAllSections(testIdToUse)
        console.log('📁 Sections response:', sectionsResp)
        
        const sections = sectionsResp.data || []
        console.log('📋 All sections:', sections.length, sections)
        
        const readingSection = sections.find((s: any) => `${s.sectionType}`.toLowerCase() === 'reading')

        if (!readingSection) {
          console.log('❌ No reading section found for this test')
          readingStore.setParts([])
          setLoading(false)
          return
        }


        // 4) Start reading section
        await mockSubmissionApi.startSection(mockId, readingSection.id)
        console.log('📖 Started reading section:', readingSection.id)

        // 5) Set mockId and sectionId in store for submission
        readingStore.setMockId(mockId)
        readingStore.setSectionId(readingSection.id)

        // 6) Get parts and their content
        console.log('🔍 Getting parts for section ID:', readingSection.id)
        const partsResp = await mockSubmissionApi.getAllParts(readingSection.id)
        console.log('📦 Parts response:', partsResp)
        
        const parts = partsResp.data || []
        console.log('📚 All parts for reading:', parts.length, parts)
        
        const allParts: any[] = []
        
        for (const part of parts) {
          const contentResp = await mockSubmissionApi.getPartQuestionContent(part.id)
          const raw = contentResp.data?.content
          if (!raw) continue
          
          const partData: any = safeMultiParseJson(raw, 10)
          const dataToUse = partData?.user || partData?.admin || partData
          
          console.log('📄 Part data:', part.id, dataToUse)
          
          // Check if this part has actual reading content (questionGroups or questions)
          const hasQuestionGroups = dataToUse?.questionGroups && Array.isArray(dataToUse.questionGroups) && dataToUse.questionGroups.length > 0
          const hasQuestions = dataToUse?.questions && Array.isArray(dataToUse.questions) && dataToUse.questions.length > 0
          
          // Skip parts that only have instruction/passage (Writing-style format) without questions
          if (!hasQuestionGroups && !hasQuestions) {
            console.log('⚠️ Skipping part without questions:', part.id)
            continue
          }
          
          // Transform question groups with imageId to imageUrl
          let questionGroups = undefined
          if (hasQuestionGroups) {
            questionGroups = dataToUse.questionGroups.map((group: any, groupIndex: number) => ({
              instruction: group.instruction,
              imageUrl: fileApi.getImageUrl(group.imageId),
              questions: (group.questions || []).map((q: any) => ({
                ...q,
                options: q.options || [],
                groupIndex: groupIndex  // Add groupIndex to each question
              }))
            }))
          }
          
          // Map questions with options and add groupIndex from questionGroups
          const mappedQuestions = (dataToUse.questions || []).map((q: any) => {
            // Find which group this question belongs to based on question range
            let groupIndex = q.groupIndex
            if (groupIndex === undefined && hasQuestionGroups) {
              dataToUse.questionGroups.forEach((group: any, gIdx: number) => {
                if (group.range) {
                  const match = group.range.match(/^(\d+)-(\d+)$/)
                  if (match) {
                    const start = parseInt(match[1])
                    const end = parseInt(match[2])
                    if (q.id >= start && q.id <= end) {
                      groupIndex = gIdx
                    }
                  }
                }
              })
            }
            
            return {
              ...q,
              options: q.options || [],
              groupIndex: groupIndex
            }
          })
          
          // Calculate questionRange from actual question IDs
          let questionRange: [number, number] = [1, 13]
          if (dataToUse.questionRange) {
            questionRange = dataToUse.questionRange
          } else if (mappedQuestions.length > 0) {
            const questionIds = mappedQuestions.map((q: any) => q.id).filter((id: any) => typeof id === 'number')
            if (questionIds.length > 0) {
              questionRange = [Math.min(...questionIds), Math.max(...questionIds)]
            }
          }
          
          const validated = {
            id: dataToUse.id || allParts.length + 1,
            title: dataToUse.title || `Part ${allParts.length + 1}`,
            instruction: dataToUse.instruction || '',
            passage: dataToUse.passage || '',
            imageUrl: fileApi.getImageUrl(dataToUse.imageId),
            questions: mappedQuestions,
            questionRange: questionRange,
            sections: dataToUse.sections || undefined,
            questionGroups: questionGroups,
          }
          allParts.push(validated)
        }
        
        console.log('📚 Total reading parts loaded:', allParts.length)
        readingStore.setParts(allParts)

        // 7) Start timer (60 minutes)
        readingStore.startTimer(async () => {
          console.log('⏰ Time is up! Auto-submitting...')
          try {
            await readingStore.finishSection()
            window.location.href = '/'
          } catch (error) {
            console.error('Failed to auto-submit:', error)
          }
        })

        // 8) Load previously submitted answers (if any)
        try {
          console.log('🔄 Loading previously submitted answers...')
          const answersResp = await mockSubmissionApi.getSubmittedAnswers(mockId, readingSection.id)
          const submittedAnswers = answersResp.data || []
          
          if (submittedAnswers.length > 0) {
            console.log(`✅ Found ${submittedAnswers.length} previously submitted answers`)
            submittedAnswers.forEach((answer: any) => {
              const questionOrd = answer.questionOrd || answer.ord
              const answerValue = answer.answer
              
              if (questionOrd && answerValue) {
                // Set answer in store without triggering auto-submit
                readingStore.answers.set(questionOrd, answerValue)
                console.log(`📝 Restored answer for Q${questionOrd}:`, answerValue)
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
        console.error('❌ Error loading reading test:', error)
        readingStore.setParts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [urlTestId])

  if (loading) return null
  return <ReadingTestLayout />
})

function ReadingPage() {
  return (
    <Suspense fallback={null}>
      <ReadingPageContent />
    </Suspense>
  )
}

export default ReadingPage

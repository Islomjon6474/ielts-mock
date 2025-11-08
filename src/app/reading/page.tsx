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
        
        let testIdToUse: string | null = null
        
        // If testId provided in URL, use it directly
        if (urlTestId) {
          console.log('📎 Using testId from URL:', urlTestId)
          testIdToUse = urlTestId
        } else {
          // Otherwise, get first active test
          const testsResp = await mockSubmissionApi.getAllTests(0, 100)
          console.log('📊 Tests response:', testsResp)
          
          const tests = testsResp?.data || testsResp?.content || testsResp || []
          const allTests = Array.isArray(tests) ? tests : (tests?.data || [])
          console.log('📋 All tests:', allTests.length, allTests)
          
          // Filter for active tests only (isActive === 1)
          const activeTests = allTests.filter((t: any) => t.isActive === 1)
          console.log('✅ Active tests:', activeTests.length, activeTests)
          
          // If no active tests, use first available test
          const test = activeTests.length > 0 ? activeTests[0] : allTests[0]
          
          if (!test) {
            console.log('❌ No tests found at all')
            readingStore.setParts([])
            setLoading(false)
            return
          }
          
          testIdToUse = test.id || test.testId || test?.id
          console.log('📖 Loading reading test:', test.name || test.id, 'Active:', test.isActive)
        }

        // Ensure testIdToUse is not null
        if (!testIdToUse) {
          console.log('❌ No test ID available')
          readingStore.setParts([])
          setLoading(false)
          return
        }

        // 2) Get sections and pick reading
        console.log('🔍 Getting sections for test ID:', testIdToUse)
        
        const sectionsResp = await mockSubmissionApi.getAllSections(testIdToUse)
        console.log('📑 Sections response:', sectionsResp)
        
        const sections = sectionsResp?.data || sectionsResp || []
        console.log('📋 All sections:', sections)
        
        const readingSection = sections.find((s: any) => `${s.sectionType}`.toLowerCase() === 'reading')
        console.log('📖 Reading section found:', readingSection)
        
        if (!readingSection) {
          console.log('❌ No reading section found for this test')
          readingStore.setParts([])
          setLoading(false)
          return
        }

        // 3) Get parts and their content
        console.log('🔍 Getting parts for section ID:', readingSection.id)
        const partsResp = await mockSubmissionApi.getAllParts(readingSection.id)
        console.log('📦 Parts response:', partsResp)
        
        const parts = partsResp?.data || partsResp || []
        console.log('📚 All parts for reading:', parts.length, parts)
        
        const allParts: any[] = []
        
        for (const part of parts) {
          const contentResp = await mockSubmissionApi.getPartQuestionContent(part.id)
          const raw = contentResp?.data?.content ?? contentResp?.content ?? null
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
            questionGroups = dataToUse.questionGroups.map((group: any) => ({
              instruction: group.instruction,
              imageUrl: fileApi.getImageUrl(group.imageId),
              questions: (group.questions || []).map((q: any) => ({
                ...q,
                options: q.options || []
              }))
            }))
          }
          
          // Map questions with options
          const mappedQuestions = (dataToUse.questions || []).map((q: any) => ({
            ...q,
            options: q.options || []
          }))
          
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

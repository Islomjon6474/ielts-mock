'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import WritingTestLayout from '@/components/writing/WritingTestLayout'
import { mockSubmissionApi, fileApi } from '@/services/testManagementApi'
import { safeMultiParseJson } from '@/utils/json'

const WritingPageContent = observer(() => {
  const { writingStore } = useStore()
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
          // 1) Get active tests and take the first ACTIVE one
          const testsResp = await mockSubmissionApi.getAllTests(0, 100)
          const tests = testsResp?.data || testsResp?.content || testsResp || []
          const allTests = Array.isArray(tests) ? tests : (tests?.data || [])
          
          // Filter for active tests only (isActive === 1)
          const activeTests = allTests.filter((t: any) => t.isActive === 1)
          
          // If no active tests, use first available test
          const test = activeTests.length > 0 ? activeTests[0] : allTests[0]
          
          if (!test) {
            console.log('❌ No tests found')
            writingStore.setTasks([])
            setLoading(false)
            return
          }
          
          testIdToUse = test.id || test.testId || test?.id
          console.log('✍️ Loading writing test:', test.name || test.id)
        }

        // Ensure testIdToUse is not null
        if (!testIdToUse) {
          console.log('❌ No test ID available')
          writingStore.setTasks([])
          setLoading(false)
          return
        }

        // 2) Get sections and pick writing
        const sectionsResp = await mockSubmissionApi.getAllSections(testIdToUse)
        const sections = sectionsResp?.data || sectionsResp || []
        const writingSection = sections.find((s: any) => `${s.sectionType}`.toLowerCase() === 'writing')
        if (!writingSection) {
          writingStore.setTasks([])
          setLoading(false)
          return
        }

        // 3) Get parts and their content
        console.log('🔍 Getting parts for writing section ID:', writingSection.id)
        const partsResp = await mockSubmissionApi.getAllParts(writingSection.id)
        console.log('📦 Parts response:', partsResp)
        
        const parts = partsResp?.data || partsResp || []
        console.log('✍️ All parts for writing:', parts.length, parts)
        
        const allTasks: any[] = []
        
        for (const part of parts) {
          try {
            console.log('📄 Processing part:', part.id)
            const contentResp = await mockSubmissionApi.getPartQuestionContent(part.id)
            const raw = contentResp?.data?.content ?? contentResp?.content ?? null
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
            
            // Extract question text - first instruction or text field
            let questionText = dataToUse.question || dataToUse.text || ''
            if (!questionText && dataToUse.instruction) {
              questionText = dataToUse.instruction
            }
            
            const task = {
              id: allTasks.length + 1,
              title: dataToUse.title || `Task ${allTasks.length + 1}`,
              timeMinutes: Number(dataToUse.timeMinutes) || (allTasks.length === 0 ? 20 : 40),
              minWords: Number(dataToUse.minWords) || (allTasks.length === 0 ? 150 : 250),
              instruction: dataToUse.instruction || '',
              question: questionText || 'Write your response based on the task instructions.',
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
      } catch (error) {
        console.error('❌ Error loading writing test:', error)
        writingStore.setTasks([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [urlTestId])

  if (loading) return null
  return <WritingTestLayout />
})

function WritingPage() {
  return (
    <Suspense fallback={null}>
      <WritingPageContent />
    </Suspense>
  )
}

export default WritingPage

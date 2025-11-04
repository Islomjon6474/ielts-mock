'use client'

import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import ReadingTestLayout from '@/components/reading/ReadingTestLayout'
import { mockSubmissionApi } from '@/services/testManagementApi'
import { safeMultiParseJson } from '@/utils/json'

const ReadingPage = observer(() => {
  const { readingStore } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const testsResp = await mockSubmissionApi.getAllTests(0, 1)
        const tests = testsResp?.data || testsResp?.content || testsResp || []
        const test = Array.isArray(tests) ? tests[0] : tests?.data?.[0]
        if (!test) { readingStore.setParts([]); return }

        const sectionsResp = await mockSubmissionApi.getAllSections(test.id || test.testId || test?.id)
        const sections = sectionsResp?.data || sectionsResp || []
        const readingSection = sections.find((s: any) => `${s.sectionType}`.toLowerCase() === 'reading')
        if (!readingSection) { readingStore.setParts([]); return }

        const partsResp = await mockSubmissionApi.getAllParts(readingSection.id)
        const parts = partsResp?.data || partsResp || []
        const allParts: any[] = []
        for (const part of parts) {
          const contentResp = await mockSubmissionApi.getPartQuestionContent(part.id)
          const raw = contentResp?.data?.content ?? contentResp?.content ?? null
          if (!raw) continue
          const partData: any = safeMultiParseJson(raw, 10)
          const dataToUse = partData?.user || partData?.admin || partData
          const validated = {
            id: dataToUse.id || allParts.length + 1,
            title: dataToUse.title || `Part ${allParts.length + 1}`,
            instruction: dataToUse.instruction || '',
            passage: dataToUse.passage || '',
            questions: dataToUse.questions || [],
            questionRange: dataToUse.questionRange || [1, 13],
            sections: dataToUse.sections || undefined,
          }
          allParts.push(validated)
        }
        readingStore.setParts(allParts)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [readingStore])

  if (loading) return null
  return <ReadingTestLayout />
})

export default ReadingPage

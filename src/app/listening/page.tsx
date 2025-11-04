'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/stores/StoreContext'
import ListeningTestLayout from '@/components/listening/ListeningTestLayout'
import { mockSubmissionApi } from '@/services/testManagementApi'
import { safeMultiParseJson } from '@/utils/json'
import { transformAdminPartsToListening } from '@/utils/transformListeningData'

export default function ListeningPage() {
  const { listeningStore } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // 1) Get active tests and take the first one
        const testsResp = await mockSubmissionApi.getAllTests(0, 1)
        const tests = testsResp?.data || testsResp?.content || testsResp || []
        const test = Array.isArray(tests) ? tests[0] : tests?.data?.[0]
        if (!test) {
          listeningStore.setParts([])
          setLoading(false)
          return
        }

        // 2) Get sections and pick listening
        const sectionsResp = await mockSubmissionApi.getAllSections(test.id || test.testId || test?.id)
        const sections = sectionsResp?.data || sectionsResp || []
        const listeningSection = sections.find((s: any) => `${s.sectionType}`.toLowerCase() === 'listening')
        if (!listeningSection) {
          listeningStore.setParts([])
          setLoading(false)
          return
        }

        // 3) Get parts and their content
        const partsResp = await mockSubmissionApi.getAllParts(listeningSection.id)
        const parts = partsResp?.data || partsResp || []
        const partsWithContent: any[] = []
        for (const p of parts) {
          const contentResp = await mockSubmissionApi.getPartQuestionContent(p.id)
          const raw = contentResp?.data?.content ?? contentResp?.content ?? null
          if (!raw) continue
          const parsed = safeMultiParseJson(raw, 10)
          partsWithContent.push({ ...p, content: parsed })
        }

        // 4) Transform and set to store
        const listeningParts = transformAdminPartsToListening(partsWithContent)
        listeningStore.setParts(listeningParts)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [listeningStore])

  if (loading) return null
  return <ListeningTestLayout />
}

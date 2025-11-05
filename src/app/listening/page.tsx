'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useStore } from '@/stores/StoreContext'
import ListeningTestLayout from '@/components/listening/ListeningTestLayout'
import { mockSubmissionApi, fileApi } from '@/services/testManagementApi'
import { safeMultiParseJson } from '@/utils/json'
import { transformAdminPartsToListening } from '@/utils/transformListeningData'

function ListeningPageContent() {
  const { listeningStore } = useStore()
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const urlTestId = searchParams.get('testId')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Reset listening store to ensure clean state
        listeningStore.reset()
        
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
            listeningStore.setParts([])
            setLoading(false)
            return
          }
          
          testIdToUse = test.id || test.testId || test?.id
          console.log('🎧 Loading listening test:', test.name || test.id)
        }

        // Ensure testIdToUse is not null
        if (!testIdToUse) {
          console.log('❌ No test ID available')
          listeningStore.setParts([])
          setLoading(false)
          return
        }

        // 2) Get sections and pick listening
        const sectionsResp = await mockSubmissionApi.getAllSections(testIdToUse)
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

        // 4) Get audio files, build audio URLs, and preload them
        const audioUrls: { [partId: string]: string } = {}
        try {
          listeningStore.setAudioLoading(true)
          listeningStore.setAllAudioReady(false)
          listeningStore.setAudioError(null)

          console.log('🎵 Fetching audio for test ID:', testIdToUse)
          const audioResponse = await mockSubmissionApi.getAllListeningAudio(testIdToUse)
          const audioFiles = audioResponse?.data || []
          
          const preloadPromises: Promise<void>[] = []
          
          audioFiles.forEach((audio: any, index: number) => {
            if (index >= partsWithContent.length) return
            const partId = partsWithContent[index].id
            const fileId = audio.fileId
            if (!fileId) return
            
            const fileUrl = fileApi.getFileUrl(fileId)
            if (!fileUrl) return
            
            audioUrls[partId] = fileUrl

            // Preload audio file
            const preloadPromise = new Promise<void>((resolve) => {
              const audio = new Audio()
              audio.preload = 'auto'
              audio.src = fileUrl
              
              const onReady = () => {
                audio.removeEventListener('canplaythrough', onReady)
                audio.removeEventListener('error', onError)
                resolve()
              }
              
              const onError = () => {
                audio.removeEventListener('canplaythrough', onReady)
                audio.removeEventListener('error', onError)
                console.error('Failed to preload audio:', fileUrl)
                resolve() // Resolve anyway to not block other files
              }
              
              audio.addEventListener('canplaythrough', onReady, { once: true })
              audio.addEventListener('error', onError, { once: true })
            })
            
            preloadPromises.push(preloadPromise)
          })

          // Wait for all audio to preload
          await Promise.all(preloadPromises)
          listeningStore.setAllAudioReady(true)
          
        } catch (err) {
          console.error('Failed to fetch audio files:', err)
          listeningStore.setAudioError('Failed to load audio')
          listeningStore.setAllAudioReady(false)
        } finally {
          listeningStore.setAudioLoading(false)
        }

        // 5) Transform and set to store
        const listeningParts = transformAdminPartsToListening(partsWithContent, audioUrls)
        listeningStore.setParts(listeningParts)
      } catch (error) {
        console.error('❌ Error loading listening test:', error)
        listeningStore.setParts([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [urlTestId])

  if (loading) return null
  return <ListeningTestLayout />
}

export default function ListeningPage() {
  return (
    <Suspense fallback={null}>
      <ListeningPageContent />
    </Suspense>
  )
}

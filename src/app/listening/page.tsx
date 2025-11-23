'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import ListeningTestLayout from '@/components/listening/ListeningTestLayout'
import { mockSubmissionApi, fileApi } from '@/services/testManagementApi'
import { safeMultiParseJson } from '@/utils/json'
import { transformAdminPartsToListening } from '@/utils/transformListeningData'

const ListeningPageContent = observer(() => {
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
          const allTests = testsResp?.data || []
          
          // Filter for active tests only (isActive === 1)
          const activeTests = allTests.filter((t) => t.isActive === 1)
          
          // If no active tests, use first available test
          const test = activeTests.length > 0 ? activeTests[0] : allTests[0]
          
          if (!test) {
            console.log('❌ No tests found')
            listeningStore.setParts([])
            setLoading(false)
            return
          }
          
          testIdToUse = test.id
          console.log('🎧 Loading listening test:', test.name || test.id)
        }

        // Ensure testIdToUse is not null
        if (!testIdToUse) {
          console.log('❌ No test ID available')
          listeningStore.setParts([])
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
          console.log('🎧 Resuming existing mock session:', mockId)
        } else {
          const mockResp = await mockSubmissionApi.startMock(testIdToUse)
          mockId = mockResp.data
          console.log('🎧 Started new mock session:', mockId)
        }

        // 3) Get sections and pick listening
        const sectionsResp = await mockSubmissionApi.getAllSections(testIdToUse)
        const sections = sectionsResp.data || []
        const listeningSection = sections.find((s: any) => `${s.sectionType}`.toLowerCase() === 'listening')
        if (!listeningSection) {
          listeningStore.setParts([])
          setLoading(false)
          return
        }

        // 4) Start listening section
        await mockSubmissionApi.startSection(mockId, listeningSection.id)
        console.log('🎧 Started listening section:', listeningSection.id)

        // 5) Set mockId and sectionId in store for submission
        listeningStore.setMockId(mockId)
        listeningStore.setSectionId(listeningSection.id)

        // 6) Get parts and their content
        const partsResp = await mockSubmissionApi.getAllParts(listeningSection.id)
        const parts = partsResp.data || []
        const partsWithContent: any[] = []
        for (const p of parts) {
          const contentResp = await mockSubmissionApi.getPartQuestionContent(p.id)
          const raw = contentResp.data?.content
          if (!raw) continue
          const parsed = safeMultiParseJson(raw, 10)
          partsWithContent.push({ ...p, content: parsed })
        }

        // 7) Get audio files and preload them (independent of parts)
        try {
          listeningStore.setAudioLoading(true)
          listeningStore.setAllAudioReady(false)
          listeningStore.setAudioError(null)

          console.log('🎵 Fetching audio for test ID:', testIdToUse)
          const audioResponse = await mockSubmissionApi.getAllListeningAudio(testIdToUse)
          const audioFiles = audioResponse.data || []
          
          // Sort audio files by ord field to ensure correct order
          const sortedAudioFiles = [...audioFiles].sort((a, b) => (a.ord || 0) - (b.ord || 0))
          console.log(`🎵 Found ${sortedAudioFiles.length} audio files for listening test`)
          
          const preloadPromises: Promise<void>[] = []
          const audioUrls: string[] = []
          
          sortedAudioFiles.forEach((audio: any, index: number) => {
            const fileId = audio.fileId
            if (!fileId) {
              console.warn(`Audio at index ${index} has no fileId`)
              return
            }
            
            const fileUrl = fileApi.getFileUrl(fileId)
            if (!fileUrl) {
              console.warn(`Could not generate URL for fileId: ${fileId}`)
              return
            }
            
            console.log(`🎵 Audio ${index + 1} (ord: ${audio.ord || 'N/A'}): ${audio.name || 'unnamed'}`, fileUrl)
            audioUrls.push(fileUrl)

            // Preload audio file
            const preloadPromise = new Promise<void>((resolve) => {
              const audioElement = new Audio()
              audioElement.preload = 'auto'
              audioElement.src = fileUrl
              
              const onReady = () => {
                audioElement.removeEventListener('canplaythrough', onReady)
                audioElement.removeEventListener('error', onError)
                console.log(`✅ Audio ${index + 1} preloaded successfully`)
                resolve()
              }
              
              const onError = () => {
                audioElement.removeEventListener('canplaythrough', onReady)
                audioElement.removeEventListener('error', onError)
                console.error(`❌ Failed to preload audio ${index + 1}:`, fileUrl)
                resolve() // Resolve anyway to not block other files
              }
              
              audioElement.addEventListener('canplaythrough', onReady, { once: true })
              audioElement.addEventListener('error', onError, { once: true })
            })
            
            preloadPromises.push(preloadPromise)
          })

          // Wait for all audio to preload
          await Promise.all(preloadPromises)
          console.log(`✅ All ${audioUrls.length} audio files preloaded`)
          listeningStore.setAllAudioReady(true)
          
          // Store ALL audio URLs in the listening store for sequential playback
          listeningStore.setAudioUrls(audioUrls)
          console.log(`📦 Stored ${audioUrls.length} audio URLs in listening store`)
          
          // Also map to parts for compatibility with existing code
          const audioUrlsMap: { [partId: string]: string } = {}
          partsWithContent.forEach((part, index) => {
            if (index < audioUrls.length) {
              audioUrlsMap[part.id] = audioUrls[index]
            }
          })
          
          // 5) Transform and set to store
          const listeningParts = transformAdminPartsToListening(partsWithContent, audioUrlsMap)
          listeningStore.setParts(listeningParts)
          
          // 6) Calculate total audio duration and start timer
          // Estimate: assume each audio is ~10 minutes (600 seconds)
          const estimatedAudioDuration = audioUrls.length * 600 // 10 min per audio
          listeningStore.startTimerAfterAudio(estimatedAudioDuration, async () => {
            console.log('⏰ Time is up! Auto-submitting...')
            try {
              await listeningStore.finishSection()
              window.location.href = '/'
            } catch (error) {
              console.error('Failed to auto-submit:', error)
            }
          })
          
        } catch (err) {
          console.error('Failed to fetch audio files:', err)
          listeningStore.setAudioError('Failed to load audio')
          listeningStore.setAllAudioReady(false)
        } finally {
          listeningStore.setAudioLoading(false)
        }

        // 8) Load previously submitted answers (if any)
        try {
          console.log('🔄 Loading previously submitted answers...')
          const answersResp = await mockSubmissionApi.getSubmittedAnswers(mockId, listeningSection.id)
          const submittedAnswers = answersResp.data || []
          
          if (submittedAnswers.length > 0) {
            console.log(`✅ Found ${submittedAnswers.length} previously submitted answers`)
            submittedAnswers.forEach((answer: any) => {
              const questionOrd = answer.questionOrd || answer.ord
              const answerValue = answer.answer
              
              if (questionOrd && answerValue) {
                // Set answer in store without triggering auto-submit
                listeningStore.answers.set(questionOrd, answerValue)
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
})

export default function ListeningPage() {
  return (
    <Suspense fallback={null}>
      <ListeningPageContent />
    </Suspense>
  )
}

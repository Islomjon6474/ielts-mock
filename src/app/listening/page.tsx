'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { observer } from 'mobx-react-lite'
import { Spin } from 'antd'
import { useStore } from '@/stores/StoreContext'
import ListeningTestLayout from '@/components/listening/ListeningTestLayout'
import { mockSubmissionApi, fileApi } from '@/services/testManagementApi'
import { safeMultiParseJson } from '@/utils/json'
import { transformAdminPartsToListening } from '@/utils/transformListeningData'
import { enterFullscreen, exitFullscreen, onFullscreenChange } from '@/utils/fullscreen'
import { playWarningSound } from '@/utils/audioAlert'

const ListeningPageContent = observer(() => {
  const { listeningStore } = useStore()
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('Loading test...')
  const searchParams = useSearchParams()
  const urlTestId = searchParams.get('testId')
  const urlMockId = searchParams.get('mockId')
  const isPreviewMode = searchParams.get('preview') === 'true'
  const isSubmittingRef = useRef(false) // Track if user is submitting

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Reset listening store to ensure clean state
        listeningStore.reset()
        // Set preview mode based on URL parameter
        listeningStore.setPreviewMode(isPreviewMode)
        
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
        let mockId: string
        
        if (urlMockId) {
          // Use mockId from URL (for viewing results or continuing test)
          mockId = urlMockId
          console.log('🎧 Using mockId from URL:', mockId)
          
          // Check if this mock is finished to automatically enable preview mode
          const mocksResp = await mockSubmissionApi.getAllMocks(0, 100)
          const allMocks = mocksResp.data || []
          const mock = allMocks.find((m) => m.id === mockId)
          if (mock && mock.isFinished === 1) {
            console.log('🎧 Mock is finished, enabling preview mode')
            listeningStore.setPreviewMode(true)
          }
        } else {
          // First, check if there's an existing unfinished mock session
          const mocksResp = await mockSubmissionApi.getAllMocks(0, 100)
          const allMocks = mocksResp.data || []
          let existingMock = allMocks.find((m) => m.testId === testIdToUse && m.isFinished === 0)
          
          if (existingMock) {
            mockId = existingMock.id
            console.log('🎧 Resuming existing mock session:', mockId)
          } else {
            const mockResp = await mockSubmissionApi.startMock(testIdToUse)
            mockId = mockResp.data
            console.log('🎧 Started new mock session:', mockId)
          }
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

        // 5.5) Load submitted answers if in preview mode or if mock is finished
        if (listeningStore.isPreviewMode) {
          try {
            const answersResp = await mockSubmissionApi.getSubmittedAnswers(mockId, listeningSection.id)
            const submittedAnswers = answersResp.data || []
            console.log('📝 Loading submitted answers:', submittedAnswers)
            
            // Populate the answers in the store
            submittedAnswers.forEach((ans: any) => {
              if (ans.questionOrd && ans.answer) {
                listeningStore.answers.set(ans.questionOrd, ans.answer)
              }
            })
            console.log('✅ Loaded', submittedAnswers.length, 'submitted answers')
          } catch (error) {
            console.error('❌ Failed to load submitted answers:', error)
          }
        }

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
          setLoadingMessage('Fetching audio files...')

          console.log('🎵 Fetching audio for test ID:', testIdToUse)
          const audioResponse = await mockSubmissionApi.getAllListeningAudio(testIdToUse)
          const audioFiles = audioResponse.data || []

          // Sort audio files by ord field to ensure correct order
          const sortedAudioFiles = [...audioFiles].sort((a, b) => (a.ord || 0) - (b.ord || 0))
          console.log(`🎵 Found ${sortedAudioFiles.length} audio files for listening test`)

          if (sortedAudioFiles.length > 0) {
            setLoadingMessage(`Downloading ${sortedAudioFiles.length} audio file${sortedAudioFiles.length > 1 ? 's' : ''}...`)
          }
          
          const preloadPromises: Promise<number>[] = []
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

            // Preload audio file with authentication and get its duration
            const preloadPromise = new Promise<number>(async (resolve) => {
              try {
                setLoadingMessage(`Downloading audio ${index + 1} of ${sortedAudioFiles.length}...`)

                // Fetch audio with authentication
                const token = localStorage.getItem('authToken')
                const headers: HeadersInit = {}

                if (token) {
                  headers['Authorization'] = `Bearer ${token}`
                }

                const response = await fetch(fileUrl, { headers })

                if (!response.ok) {
                  console.error(`❌ Failed to fetch audio ${index + 1}: ${response.status} ${response.statusText}`)
                  resolve(0)
                  return
                }

                const blob = await response.blob()
                const blobUrl = URL.createObjectURL(blob)

                // Create audio element to get duration
                const audioElement = new Audio()
                audioElement.preload = 'metadata'
                audioElement.src = blobUrl

                const onLoadedMetadata = () => {
                  audioElement.removeEventListener('loadedmetadata', onLoadedMetadata)
                  audioElement.removeEventListener('error', onError)
                  const duration = audioElement.duration || 0
                  console.log(`✅ Audio ${index + 1} preloaded successfully - Duration: ${Math.round(duration)}s`)
                  URL.revokeObjectURL(blobUrl) // Clean up blob URL
                  resolve(duration)
                }

                const onError = () => {
                  audioElement.removeEventListener('loadedmetadata', onLoadedMetadata)
                  audioElement.removeEventListener('error', onError)
                  console.error(`❌ Failed to load audio metadata ${index + 1}`)
                  URL.revokeObjectURL(blobUrl) // Clean up blob URL
                  resolve(0)
                }

                audioElement.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
                audioElement.addEventListener('error', onError, { once: true })
              } catch (error) {
                console.error(`❌ Error preloading audio ${index + 1}:`, error)
                resolve(0)
              }
            })

            preloadPromises.push(preloadPromise)
          })

          // Wait for all audio to preload and get their durations
          setLoadingMessage('Processing audio files...')
          const audioDurations = await Promise.all(preloadPromises)
          let totalAudioDuration = audioDurations.reduce((sum, duration) => sum + duration, 0)

          // Fallback: if no audio files or total duration is 0, estimate based on number of parts/questions
          if (totalAudioDuration === 0 || audioUrls.length === 0) {
            const estimatedDurationPerPart = 600 // 10 minutes per part
            const numberOfParts = Math.max(partsWithContent.length, 4) // Assume at least 4 parts for standard IELTS
            totalAudioDuration = numberOfParts * estimatedDurationPerPart
            console.log(`⚠️ No audio files or duration found. Using estimated duration: ${Math.round(totalAudioDuration / 60)} minutes`)
          } else {
            console.log(`✅ All ${audioUrls.length} audio files preloaded`)
            console.log(`⏱️ Total audio duration: ${Math.round(totalAudioDuration)}s (${Math.round(totalAudioDuration / 60)} minutes)`)
          }
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

          // 5.5) Enter fullscreen mode if not in preview mode
          if (!listeningStore.isPreviewMode) {
            try {
              await enterFullscreen()
              console.log('✅ Entered fullscreen mode')
            } catch (error) {
              console.log('⚠️ Could not enter fullscreen (may need user interaction):', error)
            }
          }

          // 6) Start timer with audio duration (the store will add 10 minutes)
          const audioDurationInSeconds = Math.round(totalAudioDuration)
          console.log(`⏱️ Audio duration: ${Math.round(audioDurationInSeconds / 60)} minutes`)
          console.log(`⏱️ Total test time will be: ${Math.round(audioDurationInSeconds / 60) + 10} minutes (audio + 10 min)`)
          listeningStore.startTimerAfterAudio(audioDurationInSeconds, async () => {
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

    // Cleanup: exit fullscreen when component unmounts
    return () => {
      exitFullscreen().catch(() => {
        // Ignore errors on cleanup
      })
    }
  }, [urlTestId])

  // Listen for fullscreen changes and play warning sound if exited via ESC
  useEffect(() => {
    if (listeningStore.isPreviewMode) return // Don't monitor in preview mode

    const cleanup = onFullscreenChange((isFullscreen) => {
      // If user exited fullscreen (not in fullscreen) and they're NOT submitting
      if (!isFullscreen && !isSubmittingRef.current) {
        console.log('⚠️ User exited fullscreen without submitting!')
        playWarningSound()
      }
    })

    // Cleanup listener
    return cleanup
  }, [listeningStore.isPreviewMode])

  // Pass the submitting ref to the layout so it can set it when submitting
  useEffect(() => {
    // Expose a method to mark as submitting
    ;(window as any).__markListeningAsSubmitting = () => {
      isSubmittingRef.current = true
    }
    return () => {
      delete (window as any).__markListeningAsSubmitting
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <Spin size="large" />
        <p style={{ color: 'var(--text-primary)' }} className="mt-4 text-lg">{loadingMessage}</p>
        {loadingMessage.includes('Downloading') && (
          <p style={{ color: 'var(--text-secondary)' }} className="mt-2 text-sm">
            Please wait while we prepare your test...
          </p>
        )}
      </div>
    )
  }
  // Use the store's preview mode which gets automatically set when viewing finished mocks
  return <ListeningTestLayout isPreviewMode={listeningStore.isPreviewMode} />
})

export default function ListeningPage() {
  return (
    <Suspense fallback={null}>
      <ListeningPageContent />
    </Suspense>
  )
}

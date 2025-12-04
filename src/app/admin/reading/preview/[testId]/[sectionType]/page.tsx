'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import ReadingTestLayout from '@/components/reading/ReadingTestLayout'
import type { Part as ReadingPart, Question as ReadingQuestion, Section as ReadingSection } from '@/stores/ReadingStore'
import ListeningTestLayout from '@/components/listening/ListeningTestLayout'
import WritingTestLayout from '@/components/writing/WritingTestLayout'
import { testManagementApi, listeningAudioApi, fileApi } from '@/services/testManagementApi'
import { mockSubmissionApi } from '@/services/mockSubmissionApi'
import { safeMultiParseJson } from '@/utils/json'
import { transformAdminPartsToListening } from '@/utils/transformListeningData'
import { Spin, message, Button, Card, Typography } from 'antd'
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const SectionPreviewPage = observer(() => {
  const { readingStore, listeningStore, writingStore } = useStore()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const testId = params.testId as string
  const sectionType = params.sectionType as string
  const resultId = searchParams.get('resultId')
  // Use resultId as mockId since they're the same thing
  const mockId = searchParams.get('mockId') || resultId
  const [loading, setLoading] = useState(true)
  const [hasContent, setHasContent] = useState(false)
  
  const isReading = sectionType.toLowerCase() === 'reading'
  const isListening = sectionType.toLowerCase() === 'listening'
  const isWriting = sectionType.toLowerCase() === 'writing'

  useEffect(() => {
    if (testId && sectionType) {
      loadSectionData()
    }
  }, [testId, sectionType])

  const loadSectionData = async () => {
    try {
      setLoading(true)
      let contentFound = false

      // Fetch sections for the test
      const sectionsResponse = await testManagementApi.getAllSections(testId)
      const sections = sectionsResponse?.data || sectionsResponse || []

      console.log('Sections response:', sections)

      // Find the specific section by type
      const section = sections.find((s: any) => s.sectionType.toLowerCase() === sectionType.toLowerCase())

      if (!section) {
        message.warning(`No ${sectionType} section found for this test`)
        setLoading(false)
        return
      }
      console.log('mockId', mockId)

      // Fetch user answers with correctness info if mockId is provided (for admin view)
      // Use a local variable instead of state to avoid async state update issues
      let submittedAnswers: any[] = []
      if (mockId) {
        try {
          console.log('🔍 DEBUG: Fetching answers with correctness for mockId:', mockId, 'sectionId:', section.id)
          // Use the new API that includes correctness information
          const answersResponse = await mockSubmissionApi.getSubmittedAndCorrectAnswers(mockId, section.id)
          console.log('🔍 DEBUG: API Response with correctness:', answersResponse)
          submittedAnswers = answersResponse?.data || []
          console.log('🔍 DEBUG: Extracted answers with correctness:', submittedAnswers)
        } catch (error) {
          console.error('🔍 DEBUG: Error fetching user answers:', error)
          message.warning('Could not load user answers')
        }
      } else {
        console.log('🔍 DEBUG: No mockId provided, skipping answer fetch')
      }

      // Fetch parts for this section
      const partsResponse = await testManagementApi.getAllParts(section.id)
      const parts = partsResponse?.data || partsResponse || []
      
      console.log('Parts response for section', section.id, ':', parts)
      
      if (!parts || parts.length === 0) {
        message.warning('No parts found for this section. Please create parts first.')
        setHasContent(false)
        setLoading(false)
        return
      }

      // Fetch content for each part
      const partsWithContent = [] as any[]
      for (const part of parts) {
        try {
          const contentResponse = await testManagementApi.getPartQuestionContent(part.id)
          // Expected: { success: true/false, data: { content: string } }
          if (!contentResponse || contentResponse.success === false) {
            console.warn(`Part ${part.id} returned no content or success=false`, contentResponse)
            continue
          }
          const raw = contentResponse?.data?.content ?? contentResponse?.content ?? null
          if (!raw) {
            console.warn(`Part ${part.id} has empty content`)
            continue
          }
          const parsed = safeMultiParseJson(raw, 10)
          partsWithContent.push({ ...part, content: parsed })
        } catch (error) {
          console.error(`Error loading part ${part.id}:`, error)
        }
      }

      console.log('Parts with content:', partsWithContent)

      // Handle based on section type
      if (isListening) {
        // LISTENING SECTION
        // Reset listening store to prevent auto-play from previous state
        listeningStore.reset()
        
        let listeningParts: any[] = []  // Declare outside try block
        
        // Fetch audio files for the test and preload them (independent of parts)
        try {
          listeningStore.setAudioLoading(true)
          listeningStore.setAllAudioReady(false)
          listeningStore.setAudioError(null)

          const audioResponse = await listeningAudioApi.getAllListeningAudio(testId)
          const audioFiles = audioResponse?.data || []
          
          // Sort audio files by ord field to ensure correct order
          const sortedAudioFiles = [...audioFiles].sort((a, b) => (a.ord || 0) - (b.ord || 0))
          console.log(`🎵 Preview: Found ${sortedAudioFiles.length} audio files for listening test`)

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
            
            console.log(`🎵 Preview: Audio ${index + 1} (ord: ${audio.ord || 'N/A'}): ${audio.name || 'unnamed'}`, fileUrl)
            audioUrls.push(fileUrl)

            // Preload via authenticated fetch and Audio object
            const p = new Promise<void>(async (resolve) => {
              try {
                // Fetch audio with authentication
                const token = localStorage.getItem('authToken')
                const headers: HeadersInit = {}

                if (token) {
                  headers['Authorization'] = `Bearer ${token}`
                }

                const response = await fetch(fileUrl, { headers })

                if (!response.ok) {
                  console.error(`❌ Preview: Failed to fetch audio ${index + 1}: ${response.status} ${response.statusText}`)
                  resolve()
                  return
                }

                const blob = await response.blob()
                const blobUrl = URL.createObjectURL(blob)

                const a = new Audio()
                a.preload = 'auto'
                a.src = blobUrl
                const done = () => {
                  a.removeEventListener('canplaythrough', done)
                  a.removeEventListener('error', onErr)
                  console.log(`✅ Preview: Audio ${index + 1} preloaded successfully`)
                  URL.revokeObjectURL(blobUrl)
                  resolve()
                }
                const onErr = () => {
                  a.removeEventListener('canplaythrough', done)
                  a.removeEventListener('error', onErr)
                  console.error(`❌ Preview: Failed to preload audio ${index + 1}`)
                  URL.revokeObjectURL(blobUrl)
                  resolve()
                }
                a.addEventListener('canplaythrough', done, { once: true })
                a.addEventListener('error', onErr, { once: true })
              } catch (error) {
                console.error(`❌ Preview: Error preloading audio ${index + 1}:`, error)
                resolve()
              }
            })
            preloadPromises.push(p)
          })

          await Promise.all(preloadPromises)
          console.log(`✅ Preview: All ${audioUrls.length} audio files preloaded`)
          listeningStore.setAllAudioReady(true)
          
          // Store ALL audio URLs in the listening store for sequential playback
          listeningStore.setAudioUrls(audioUrls)
          console.log(`📦 Preview: Stored ${audioUrls.length} audio URLs in listening store`)
          
          // Also map to parts for compatibility with existing code
          const audioUrlsMap: { [partId: string]: string } = {}
          partsWithContent.forEach((part, index) => {
            if (index < audioUrls.length) {
              audioUrlsMap[part.id] = audioUrls[index]
            }
          })
          
          // Transform admin format to listening format
          listeningParts = transformAdminPartsToListening(partsWithContent, audioUrlsMap)
          console.log('Transformed listening parts:', listeningParts)
          
        } catch (error: any) {
          console.warn('No audio files found or preload failed:', error)
          listeningStore.setAudioError(error?.message || 'Failed to load audio')
          listeningStore.setAllAudioReady(false)
        } finally {
          listeningStore.setAudioLoading(false)
        }

        if (listeningParts.length > 0) {
          listeningStore.setParts(listeningParts)
          listeningStore.setPreviewMode(true) // Enable preview mode
          // Set mockId and sectionId for admin marking functionality
          if (mockId) {
            listeningStore.setMockId(mockId)
            listeningStore.setSectionId(section.id)
          }

          console.log('🔍 DEBUG: All listening parts loaded:', listeningParts.length)
          console.log('🔍 DEBUG: All listening questions:', listeningStore.allQuestions.map(q => ({ id: q.id, type: q.type, correctAnswer: q.correctAnswer })))
          console.log('🔍 DEBUG: Listening user answers from API:', submittedAnswers)

          // Load submitted answers with correctness if available
          if (submittedAnswers && submittedAnswers.length > 0) {
            // Use new method that loads pre-calculated correctness from API
            listeningStore.loadSubmittedAnswersWithCorrectness(submittedAnswers)
            console.log('🔍 DEBUG: Loaded submitted answers with correctness into listening store')
            console.log('🔍 DEBUG: Listening submitted answers map:', Array.from(listeningStore.submittedAnswers.entries()))
            console.log('🔍 DEBUG: Listening answer correctness map:', Array.from(listeningStore.answerCorrectness.entries()))
          } else {
            console.log('🔍 DEBUG: No listening user answers to load')
          }

          contentFound = true
          setHasContent(true)
        } else {
          setHasContent(false)
        }
      } else if (isReading) {
        // READING SECTION
        const allParts: ReadingPart[] = []
        for (const partWithContent of partsWithContent) {
          const content = partWithContent.content
          const partData = typeof content === 'string' ? safeMultiParseJson(content, 10) : content
          // Use user format if available, otherwise use admin format
          const dataToUse = partData?.user || partData?.admin || partData
          
          // Validate part data has required fields
          if (dataToUse && typeof dataToUse === 'object') {
            // Transform question groups with imageId to imageUrl
            let questionGroups = undefined
            if (dataToUse.questionGroups && Array.isArray(dataToUse.questionGroups)) {
              questionGroups = dataToUse.questionGroups.map((group: any, groupIndex: number) => ({
                instruction: group.instruction,
                imageUrl: fileApi.getImageUrl(group.imageId),
                headingOptions: group.headingOptions, // For MATCH_HEADING
                matrixOptions: group.matrixOptions,   // For MATRIX_TABLE
                options: group.options,               // For SENTENCE_COMPLETION
                questions: (group.questions || []).map((q: any) => ({
                  ...q,
                  options: q.options || [],
                  groupIndex: groupIndex  // Add groupIndex to each question
                }))
              }))
            }

            // Get admin format for correct answers (if available)
            const adminData = partData?.admin || null

            // Map questions with options and add groupIndex from questionGroups
            const mappedQuestions = (dataToUse.questions || []).map((q: any) => {
              // Find which group this question belongs to based on question range
              let groupIndex = q.groupIndex
              if (groupIndex === undefined && dataToUse.questionGroups && Array.isArray(dataToUse.questionGroups)) {
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

              // Extract correct answer from admin format
              let correctAnswer = undefined
              if (adminData && adminData.questions) {
                const adminQuestion = adminData.questions.find((aq: any) => aq.id === q.id)
                if (adminQuestion && adminQuestion.answer) {
                  correctAnswer = adminQuestion.answer
                }
              }

              return {
                ...q,
                options: q.options || [],
                groupIndex: groupIndex,
                correctAnswer: correctAnswer
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
            
            // Ensure all required fields exist with defaults
            const validatedPart: ReadingPart = {
              id: dataToUse.id || allParts.length + 1,
              title: dataToUse.title || `Part ${allParts.length + 1}`,
              instruction: dataToUse.instruction || '',
              passage: dataToUse.passage || '',
              imageUrl: fileApi.getImageUrl(dataToUse.imageId),
              questions: mappedQuestions as ReadingQuestion[],
              questionRange: questionRange as [number, number],
              sections: (dataToUse.sections || undefined) as ReadingSection[] | undefined,
              questionGroups: questionGroups,
            }
            allParts.push(validatedPart)
          }
        }

        console.log('All reading parts loaded:', allParts)

        if (allParts.length > 0) {
          readingStore.setParts(allParts)
          readingStore.setPreviewMode(true) // Enable preview mode to disable inputs
          // Set mockId and sectionId for admin marking functionality
          if (mockId) {
            readingStore.setMockId(mockId)
            readingStore.setSectionId(section.id)
          }

          console.log('🔍 DEBUG: All parts loaded:', allParts.length)
          console.log('🔍 DEBUG: All questions:', readingStore.allQuestions.map(q => ({ id: q.id, type: q.type, correctAnswer: q.correctAnswer })))
          console.log('🔍 DEBUG: User answers from API:', submittedAnswers)
          console.log('🔍 DEBUG: Preview mode:', readingStore.isPreviewMode)

          // Load submitted answers with correctness if available
          if (submittedAnswers && submittedAnswers.length > 0) {
            // Use new method that loads pre-calculated correctness from API
            readingStore.loadSubmittedAnswersWithCorrectness(submittedAnswers)
            console.log('🔍 DEBUG: Loaded submitted answers with correctness into store')
            console.log('🔍 DEBUG: Submitted answers map:', Array.from(readingStore.submittedAnswers.entries()))
            console.log('🔍 DEBUG: Answer correctness map:', Array.from(readingStore.answerCorrectness.entries()))
          } else {
            console.log('🔍 DEBUG: No user answers to load')
          }

          contentFound = true
          setHasContent(true)
        } else {
          setHasContent(false)
        }
      } else if (isWriting) {
        // WRITING SECTION
        const tasks: Array<{
          id: number
          title: string
          timeMinutes: number
          minWords: number
          instruction: string
          question: string
          image?: string
        }> = []

        partsWithContent.forEach((p: any, idx: number) => {
          const content = p.content
          const partData = typeof content === 'string' ? safeMultiParseJson(content, 10) : content
          const dataToUse: any = partData?.user || partData?.admin || partData || {}

          // Defaults by IELTS tasks if not provided
          const isTask1 = idx === 0
          const defaultTime = isTask1 ? 20 : 40
          const defaultWords = isTask1 ? 150 : 250

          // Build a question string from available fields
          let questionText = ''
          if (typeof dataToUse.question === 'string' && dataToUse.question.trim()) {
            questionText = dataToUse.question
          } else if (typeof dataToUse.passage === 'string' && dataToUse.passage.trim()) {
            questionText = dataToUse.passage
          } else if (Array.isArray(dataToUse.questionGroups) && dataToUse.questionGroups.length > 0) {
            const firstGroup = dataToUse.questionGroups[0]
            if (Array.isArray(firstGroup?.questions) && firstGroup.questions.length > 0) {
              questionText = firstGroup.questions.map((q: any) => q?.text).filter(Boolean).join('\n')
            } else if (firstGroup?.instruction) {
              questionText = firstGroup.instruction
            }
          } else if (dataToUse.instruction) {
            questionText = dataToUse.instruction
          }

          const task = {
            id: idx + 1,
            title: dataToUse.title || `Task ${idx + 1}`,
            timeMinutes: Number(dataToUse.timeMinutes) || defaultTime,
            minWords: Number(dataToUse.minWords) || defaultWords,
            instruction: dataToUse.instruction || '',
            question: questionText || 'Write your response based on the task instructions.',
            image: fileApi.getImageUrl(dataToUse.imageId),
          }
          tasks.push(task)
        })

        console.log('Writing tasks for preview:', tasks)
        if (tasks.length > 0) {
          writingStore.setTasks(tasks as any)
          contentFound = true
          setHasContent(true)
        } else {
          setHasContent(false)
        }
      } else {
        setHasContent(false)
      }
      // Only warn when we truly didn't find content in this load execution
      if (!contentFound) message.warning('No content found for this section. Please create content first.')
      
    } catch (error: any) {
      console.error('Error loading section data:', error)
      message.error(`Failed to load section data: ${error.message || 'Unknown error'}`)
      setHasContent(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip={`Loading ${sectionType} section preview...`} />
      </div>
    )
  }

  if (!hasContent) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <div style={{
          background: 'var(--header-background)',
          borderBottom: '1px solid var(--border-color)',
          padding: '16px 24px'
        }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(`/admin/reading/preview/${testId}`)}
            size="large"
          >
            Back to Section Selection
          </Button>
        </div>
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)', padding: '48px' }}>
          <Card style={{ maxWidth: 600, textAlign: 'center', padding: '40px 20px' }}>
            <FileTextOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }} />
            <Title level={3}>No Content Available</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
              This {sectionType} section doesn&apos;t have any content yet. Please add content before previewing.
            </Text>
            <Button
              type="primary"
              size="large"
              onClick={() => router.push(`/admin/test/${testId}`)}
            >
              Go to Test Management
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const handleBackClick = () => {
    if (resultId) {
      router.push(`/admin/results/${resultId}/preview?testId=${testId}`)
    } else {
      router.push(`/admin/reading/preview/${testId}`)
    }
  }

  return (
    <div>
      {isReading && <ReadingTestLayout isPreviewMode={true} onBackClick={handleBackClick} />}
      {isListening && <ListeningTestLayout isPreviewMode={true} onBackClick={handleBackClick} />}
      {isWriting && <WritingTestLayout isPreviewMode={true} onBackClick={handleBackClick} />}
    </div>
  )
})

export default SectionPreviewPage

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import ReadingTestLayout from '@/components/reading/ReadingTestLayout'
import type { Part as ReadingPart, Question as ReadingQuestion, Section as ReadingSection } from '@/stores/ReadingStore'
import ListeningTestLayout from '@/components/listening/ListeningTestLayout'
import WritingTestLayout from '@/components/writing/WritingTestLayout'
import { testManagementApi, listeningAudioApi } from '@/services/testManagementApi'
import { safeMultiParseJson } from '@/utils/json'
import { transformAdminPartsToListening } from '@/utils/transformListeningData'
import { Spin, message, Button, Card, Typography } from 'antd'
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const SectionPreviewPage = observer(() => {
  const { readingStore, listeningStore, writingStore } = useStore()
  const params = useParams()
  const router = useRouter()
  const testId = params.testId as string
  const sectionType = params.sectionType as string
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
        // Fetch audio files for the test and preload them
        let audioUrls: { [partId: string]: string } = {}
        try {
          listeningStore.setAudioLoading(true)
          listeningStore.setAllAudioReady(false)
          listeningStore.setAudioError(null)

          const audioResponse = await listeningAudioApi.getAllListeningAudio(testId)
          const audioFiles = audioResponse?.data || []
          console.log('Audio files:', audioFiles)

          const preloadPromises: Promise<void>[] = []
          audioFiles.forEach((audio: any, index: number) => {
            if (index >= partsWithContent.length) return
            const partId = partsWithContent[index].id
            const fileId = audio.fileId
            if (!fileId) return

            const fileUrl = `/api/file/download/${fileId}`
            audioUrls[partId] = fileUrl

            // Preload via Audio object and canplaythrough
            const p = new Promise<void>((resolve) => {
              const a = new Audio()
              a.preload = 'auto'
              a.src = fileUrl
              const done = () => {
                a.removeEventListener('canplaythrough', done)
                a.removeEventListener('error', onErr)
                resolve()
              }
              const onErr = () => {
                a.removeEventListener('canplaythrough', done)
                a.removeEventListener('error', onErr)
                // resolve anyway; we will still allow UI to start even if a file fails
                resolve()
              }
              a.addEventListener('canplaythrough', done, { once: true })
              a.addEventListener('error', onErr, { once: true })
            })
            preloadPromises.push(p)
          })

          await Promise.all(preloadPromises)
          listeningStore.setAllAudioReady(true)
        } catch (error: any) {
          console.warn('No audio files found or preload failed:', error)
          listeningStore.setAudioError(error?.message || 'Failed to load audio')
          listeningStore.setAllAudioReady(false)
        } finally {
          listeningStore.setAudioLoading(false)
        }

        // Transform admin format to listening format
        const listeningParts = transformAdminPartsToListening(partsWithContent, audioUrls)
        console.log('Transformed listening parts:', listeningParts)

        if (listeningParts.length > 0) {
          listeningStore.setParts(listeningParts)
          // listeningStore has no preview mode; ListeningTestLayout renders read-only by design
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
            // Ensure all required fields exist with defaults
            const validatedPart: ReadingPart = {
              id: dataToUse.id || allParts.length + 1,
              title: dataToUse.title || `Part ${allParts.length + 1}`,
              instruction: dataToUse.instruction || '',
              passage: dataToUse.passage || '',
              questions: (dataToUse.questions || []) as ReadingQuestion[],
              questionRange: (dataToUse.questionRange || [1, 13]) as [number, number],
              sections: (dataToUse.sections || undefined) as ReadingSection[] | undefined,
            }
            allParts.push(validatedPart)
          }
        }

        console.log('All reading parts loaded:', allParts)

        if (allParts.length > 0) {
          readingStore.setParts(allParts)
          readingStore.setPreviewMode(true) // Enable preview mode to disable inputs
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
            image: dataToUse.imageId ? `/api/file/download/${dataToUse.imageId}` : undefined,
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
      <div className="min-h-screen" style={{ background: '#f5f5f5' }}>
        <div style={{ 
          background: '#fff', 
          borderBottom: '1px solid #f0f0f0',
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

  return (
    <div>
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000, 
        background: '#fff', 
        borderBottom: '1px solid #f0f0f0',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(`/admin/reading/preview/${testId}`)}
            size="large"
          >
            Back to Sections
          </Button>
          <span style={{ fontSize: '16px', fontWeight: 500, color: '#cf1322' }}>
            PREVIEW MODE - {sectionType.toUpperCase()} - All inputs are disabled
          </span>
        </div>
      </div>
      <div style={{ marginTop: '60px' }}>
        {isReading && <ReadingTestLayout />}
        {isListening && <ListeningTestLayout />}
        {isWriting && <WritingTestLayout />}
      </div>
    </div>
  )
})

export default SectionPreviewPage

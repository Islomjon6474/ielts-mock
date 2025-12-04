'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Layout, Button } from 'antd'
import { LeftOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import { useRouter, useSearchParams } from 'next/navigation'
import { useStore } from '@/stores/StoreContext'
import Header from '@/components/common/Header'
import Timer from '@/components/common/Timer'
import ReadingPassage from './ReadingPassage'
import QuestionPanel from './QuestionPanel'
import BottomNavigation from './BottomNavigation'
import SubmitModal from '@/components/common/SubmitModal'
import AdminGradingPanel from '@/components/admin/AdminGradingPanel'
import { exitFullscreen } from '@/utils/fullscreen'

const { Content } = Layout

interface ReadingTestLayoutProps {
  isPreviewMode?: boolean
  onBackClick?: () => void
}

const ReadingTestLayout = observer(({ isPreviewMode = false, onBackClick }: ReadingTestLayoutProps) => {
  const { readingStore } = useStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [leftWidth, setLeftWidth] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get admin grading info from URL params
  const studentName = searchParams?.get('studentName') || undefined
  const testName = searchParams?.get('testName') || undefined
  const showAdminPanel = isPreviewMode && readingStore.mockId && readingStore.sectionId

  // Calculate statistics for admin panel
  const gradingStats = useMemo(() => {
    let correct = 0
    let incorrect = 0
    let notAnswered = 0

    readingStore.allQuestions.forEach(q => {
      const submitted = readingStore.getSubmittedAnswer(q.id)
      const isCorrect = readingStore.isAnswerCorrect(q.id)

      if (!submitted) {
        notAnswered++
      } else if (isCorrect === true) {
        correct++
      } else if (isCorrect === false) {
        incorrect++
      }
    })

    return {
      total: readingStore.allQuestions.length,
      correct,
      incorrect,
      notAnswered
    }
  }, [readingStore.submittedAnswers, readingStore.answerCorrectness, readingStore.allQuestions])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return
      
      const containerRect = containerRef.current.getBoundingClientRect()
      const containerWidth = containerRect.width
      const offsetX = e.clientX - containerRect.left
      const newLeftWidth = (offsetX / containerWidth) * 100
      
      if (newLeftWidth >= 25 && newLeftWidth <= 75) {
        setLeftWidth(newLeftWidth)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging])

  const currentPart = readingStore.parts[readingStore.currentPart - 1]

  if (!currentPart) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const handleHeadingDrop = (sectionNumber: number, heading: string) => {
    // Find the question that corresponds to this section number
    const questionIndex = sectionNumber - currentPart.questionRange[0]
    const question = currentPart.questions[questionIndex]
    
    if (question && question.type === 'MATCH_HEADING') {
      // If heading is empty string, remove the answer (detach)
      if (heading === '' || !heading) {
        readingStore.removeAnswer(question.id)
      } else {
        readingStore.setAnswer(question.id, heading)
      }
    }
  }

  const getHeadingForSection = (sectionNumber: number): string | undefined => {
    // Find the question that corresponds to this section number
    const questionIndex = sectionNumber - currentPart.questionRange[0]
    const question = currentPart.questions[questionIndex]
    
    if (question && question.type === 'MATCH_HEADING') {
      return readingStore.getAnswer(question.id) as string | undefined
    }
    return undefined
  }

  const handleSubmit = () => {
    setShowSubmitModal(true)
  }

  const handleModalClose = () => {
    setShowSubmitModal(false)
  }

  const handleModalConfirm = async () => {
    // Mark as submitting so warning sound doesn't play
    if ((window as any).__markReadingAsSubmitting) {
      (window as any).__markReadingAsSubmitting()
    }

    try {
      await readingStore.finishSection()
      setShowSubmitModal(false)
      // Exit fullscreen before redirecting
      await exitFullscreen().catch(() => {})

      // Navigate to writing section
      const mockId = readingStore.mockId
      const searchParams = new URLSearchParams(window.location.search)
      const testId = searchParams.get('testId')

      if (mockId && testId) {
        // Import the API here to avoid circular dependencies
        const { mockSubmissionApi } = await import('@/services/testManagementApi')

        // Get sections to find writing section
        const sectionsResp = await mockSubmissionApi.getAllSections(testId, mockId)
        const sections = sectionsResp.data

        // Find writing section
        const writingSection = sections.find((s: any) =>
          String(s.sectionType).toLowerCase() === 'writing'
        )

        if (writingSection) {
          // Start writing section
          await mockSubmissionApi.startSection(mockId, writingSection.id)
          console.log('✅ Started writing section:', writingSection.id)

          // Navigate to writing page
          router.push(`/writing?testId=${testId}&mockId=${mockId}`)
          return
        }
      }

      // Fallback: go home if no writing section found
      router.push('/')
    } catch (error) {
      console.error('Failed to submit test:', error)
      // On error, still try to go to writing or home
      const searchParams = new URLSearchParams(window.location.search)
      const testId = searchParams.get('testId')
      const mockId = searchParams.get('mockId')
      if (testId && mockId) {
        router.push(`/writing?testId=${testId}&mockId=${mockId}`)
      } else {
        router.push('/')
      }
    }
  }

  return (
    <Layout className="h-screen flex flex-col">
      <Header 
        isPreviewMode={isPreviewMode}
        previewSectionType="reading"
        onBackClick={onBackClick}
      >
        {!isPreviewMode && (
          <Timer timeRemaining={readingStore.timeRemaining} isTimeUp={readingStore.isTimeUp} />
        )}
      </Header>

      {/* Admin Grading Panel */}
      {showAdminPanel && (
        <div className="px-4 pt-4">
          <AdminGradingPanel
            mockId={readingStore.mockId!}
            sectionId={readingStore.sectionId!}
            totalQuestions={gradingStats.total}
            correctAnswers={gradingStats.correct}
            incorrectAnswers={gradingStats.incorrect}
            notAnswered={gradingStats.notAnswered}
            studentName={studentName}
            testName={testName}
            onRecalculate={() => {
              // Optionally reload the page or refresh data
              window.location.reload()
            }}
          />
        </div>
      )}

      {/* Part Title - Compact */}
      <div className="px-4 py-1.5 border-b" style={{ backgroundColor: 'var(--card-background)', borderColor: 'var(--border-color)' }}>
        <h2 className="font-semibold text-sm inline-block mr-4" style={{ color: 'var(--text-primary)' }}>{currentPart.title}</h2>
        <span
          className="text-xs prose prose-xs max-w-none inline"
          style={{ color: 'var(--text-secondary)' }}
          dangerouslySetInnerHTML={{ __html: currentPart.instruction }}
        />
      </div>

      {/* Main Content Area with Resizable Panes */}
      <Content className="flex-1 flex overflow-hidden relative" ref={containerRef}>
        {/* Left Pane - Reading Passage */}
        <div
          className="overflow-y-auto"
          style={{
            width: `${leftWidth}%`,
            backgroundColor: 'var(--background)'
          }}
        >
          <ReadingPassage
            passage={currentPart.passage}
            imageUrl={currentPart.imageUrl}
            sections={currentPart.sections}
            onHeadingDrop={handleHeadingDrop}
            getHeadingForSection={getHeadingForSection}
            hasMatchHeading={currentPart.questions.some(q => q.type === 'MATCH_HEADING')}
            matchHeadingQuestions={currentPart.questions.filter(q => q.type === 'MATCH_HEADING')}
          />
        </div>

        {/* Resizable Divider */}
        <div
          className="w-1 cursor-col-resize transition-colors flex-shrink-0"
          onMouseDown={handleMouseDown}
          style={{
            cursor: isDragging ? 'col-resize' : 'col-resize',
            backgroundColor: 'var(--border-color)',
            opacity: isDragging ? 0.8 : 0.5
          }}
        />

        {/* Right Pane - Questions */}
        <div
          className="overflow-y-auto flex-1"
          style={{
            width: `${100 - leftWidth}%`,
            backgroundColor: 'var(--card-background)'
          }}
        >
          <QuestionPanel />
        </div>
      </Content>

      {/* Bottom Navigation */}
      <BottomNavigation onSubmit={handleSubmit} isPreviewMode={isPreviewMode} />

      {/* Submit Modal */}
      <SubmitModal 
        visible={showSubmitModal} 
        onClose={handleModalClose} 
        onConfirm={handleModalConfirm}
        loading={readingStore.isSubmitting}
      />
    </Layout>
  )
})

export default ReadingTestLayout

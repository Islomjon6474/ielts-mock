'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
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

interface ReadingTestLayoutProps {
  isPreviewMode?: boolean
  onBackClick?: () => void
}

const ReadingTestLayout = observer(({ isPreviewMode = false, onBackClick }: ReadingTestLayoutProps) => {
  const { readingStore, adminStore } = useStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [leftWidth, setLeftWidth] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Get admin grading info from adminStore (optimized - no need to fetch all tests)
  const studentNameData = readingStore.mockId ? adminStore.getStudentName(readingStore.mockId) : null
  const studentName = studentNameData ? `${studentNameData.firstName} ${studentNameData.lastName}`.trim() : undefined
  const testName = readingStore.mockId ? adminStore.getTestName(readingStore.mockId) : undefined
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
    <div className="ielts-test-page ielts-reading-page">
      <Header
        isPreviewMode={isPreviewMode}
        previewSectionType="reading"
        onBackClick={onBackClick}
      >
        {!isPreviewMode && (
          <Timer timeRemaining={readingStore.timeRemaining} isTimeUp={readingStore.isTimeUp} />
        )}
      </Header>

      {/* Part Title with Admin Grading Panel */}
      <div className="ielts-part-header">
        <div className="flex items-center justify-between gap-4">
          {/* Part Title and Instruction */}
          <div className="flex-1">
            <p style={{ margin: '0 0 4px 0' }}><strong>{currentPart.title}</strong></p>
            <p
              style={{ margin: '0', color: 'var(--text-secondary)', fontSize: '14px' }}
              dangerouslySetInnerHTML={{ __html: currentPart.instruction }}
            />
          </div>

          {/* Admin Grading Panel - Inline Compact */}
          {showAdminPanel && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span style={{ color: '#666' }}>Total: <strong>{gradingStats.total}</strong></span>
                <span className="text-green-600">✓ {gradingStats.correct}</span>
                <span className="text-red-500">✗ {gradingStats.incorrect}</span>
                {gradingStats.notAnswered > 0 && (
                  <span style={{ color: '#8c8c8c' }}>− {gradingStats.notAnswered}</span>
                )}
              </div>
              <Button
                type="primary"
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => window.location.reload()}
                style={{ fontSize: '12px', padding: '0 8px', height: '24px' }}
              >
                Recalc
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area with Resizable Panes */}
      <div className="ielts-panels-container ielts-reading-panels" ref={containerRef}>
        {/* Left Pane - Reading Passage */}
        <div
          className="ielts-passage-panel"
          style={{ width: `calc(${leftWidth}% - 8px)` }}
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
          className="ielts-resizer"
          onMouseDown={handleMouseDown}
        />

        {/* Right Pane - Questions */}
        <div
          className="ielts-questions-panel"
          style={{ width: `calc(${100 - leftWidth}% - 8px)` }}
        >
          <QuestionPanel />
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation onSubmit={handleSubmit} isPreviewMode={isPreviewMode} />

      {/* Submit Modal */}
      <SubmitModal
        visible={showSubmitModal}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        loading={readingStore.isSubmitting}
      />
    </div>
  )
})

export default ReadingTestLayout

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button, Input } from 'antd'
import { LeftOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/StoreContext'
import Header from '@/components/common/Header'
import Timer from '@/components/common/Timer'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import SubmitModal from '@/components/common/SubmitModal'
import { exitFullscreen } from '@/utils/fullscreen'

const { TextArea } = Input

interface WritingTestLayoutProps {
  isPreviewMode?: boolean
  onBackClick?: () => void
}

const WritingTestLayout = observer(({ isPreviewMode = false, onBackClick }: WritingTestLayoutProps) => {
  const { writingStore } = useStore()
  const router = useRouter()
  const [leftWidth, setLeftWidth] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [localAnswer, setLocalAnswer] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

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

  const currentTask = writingStore.currentTaskData

  // Sync local answer with store when task changes
  useEffect(() => {
    if (currentTask) {
      const storeAnswer = writingStore.getAnswer(currentTask.id)
      setLocalAnswer(storeAnswer)
    }
  }, [currentTask?.id, writingStore])

  // Check if tasks are loaded
  if (!writingStore.tasks || writingStore.tasks.length === 0) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!currentTask) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  // Calculate word count from local state for proper reactivity
  const wordCount = localAnswer && localAnswer.trim() ? localAnswer.trim().split(/\s+/).length : 0

  const handleTaskChange = (taskId: number) => {
    // Save current answer before switching
    writingStore.setAnswer(currentTask.id, localAnswer)
    writingStore.setCurrentTask(taskId)
  }

  const handleTextChange = (text: string) => {
    setLocalAnswer(text)
    if (currentTask) {
      writingStore.setAnswer(currentTask.id, text)
    }
  }

  const handleSubmit = () => {
    setShowSubmitModal(true)
  }

  const handleModalClose = () => {
    setShowSubmitModal(false)
  }

  const handleModalConfirm = async () => {
    // Mark as submitting so warning sound doesn't play
    if ((window as any).__markWritingAsSubmitting) {
      (window as any).__markWritingAsSubmitting()
    }

    try {
      await writingStore.finishSection()
      setShowSubmitModal(false)
      // Exit fullscreen before redirecting
      await exitFullscreen().catch(() => {})
      router.push('/')
    } catch (error) {
      console.error('Failed to submit test:', error)
      // Still close modal and redirect even if submission fails
      setShowSubmitModal(false)
      await exitFullscreen().catch(() => {})
      router.push('/')
    }
  }

  return (
    <div className="ielts-test-page ielts-writing-page">
      <Header
        isPreviewMode={isPreviewMode}
        previewSectionType="writing"
        onBackClick={onBackClick}
      >
        {!isPreviewMode && (
          <Timer timeRemaining={writingStore.timeRemaining} isTimeUp={writingStore.isTimeUp} />
        )}
      </Header>

      {/* Task Info Header */}
      <div className="ielts-part-header">
        <p style={{ margin: '0 0 4px 0' }}><strong>{currentTask.title}</strong></p>
        <p style={{ margin: '0', color: 'var(--text-secondary)', fontSize: '14px' }}>
          You should spend about {currentTask.timeMinutes} minutes on this task. Write at least {currentTask.minWords} words.
        </p>
      </div>

      {/* Main Content Area with Resizable Panes */}
      <div className="ielts-panels-container ielts-writing-panels" ref={containerRef}>
        {/* Left Pane - Question/Task */}
        <div
          className="ielts-left-panel"
          style={{ width: `calc(${leftWidth}% - 8px)` }}
        >
          {currentTask.instruction && (
            <div className="ielts-instruction" dangerouslySetInnerHTML={{ __html: currentTask.instruction }} />
          )}

          <div className="ielts-task-prompt">
            <div dangerouslySetInnerHTML={{ __html: currentTask.question }} />
          </div>

          {currentTask.image && (
            <div className="chart-container" style={{ textAlign: 'center', margin: '20px 0' }}>
              <AuthenticatedImage
                src={currentTask.image}
                alt="Task visual"
                style={{ maxWidth: '80%', height: 'auto', border: '1px solid var(--border-color)' }}
              />
            </div>
          )}
        </div>

        {/* Resizable Divider */}
        <div
          className="ielts-resizer"
          onMouseDown={handleMouseDown}
        />

        {/* Right Pane - Writing Area */}
        <div
          className="ielts-right-panel"
          style={{ width: `calc(${100 - leftWidth}% - 8px)` }}
        >
          <textarea
            className="ielts-writing-textarea"
            value={localAnswer}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Start writing your response here..."
          />
          <div className="ielts-word-count">
            Words: <span style={{ fontWeight: 'bold' }}>{wordCount}</span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="ielts-nav-row" aria-label="Tasks">
        {writingStore.tasks.map((task) => {
          const isCurrentTask = writingStore.currentTask === task.id
          const taskWordCount = writingStore.getWordCount(task.id)
          const isComplete = taskWordCount >= task.minWords

          return (
            <div
              key={task.id}
              className={`ielts-section-wrapper ${isCurrentTask ? 'selected' : ''} ${isComplete ? 'completed' : ''}`}
              style={{ position: 'relative' }}
            >
              {/* Completion indicator bar */}
              {isComplete && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  backgroundColor: '#28a745'
                }} />
              )}
              <button
                className="ielts-section-btn"
                onClick={() => handleTaskChange(task.id)}
              >
                <span className="ielts-section-nr">{task.title}</span>
                <span className="ielts-attempted-count">{taskWordCount}/{task.minWords}</span>
              </button>
            </div>
          )
        })}

        {/* Submit Button */}
        <button
          className="ielts-submit-btn"
          onClick={handleSubmit}
          disabled={isPreviewMode}
        >
          <CheckOutlined />
          <span>Submit</span>
        </button>
      </nav>

      {/* Submit Modal */}
      <SubmitModal
        visible={showSubmitModal}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        loading={writingStore.isSubmitting}
      />
    </div>
  )
})

export default WritingTestLayout

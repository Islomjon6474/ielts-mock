'use client'

import { useState, useEffect, useRef } from 'react'
import { Layout, Button, Input } from 'antd'
import { LeftOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/StoreContext'
import Header from '@/components/common/Header'
import Timer from '@/components/common/Timer'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import SubmitModal from '@/components/common/SubmitModal'
import { exitFullscreen } from '@/utils/fullscreen'

const { Content, Footer } = Layout
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

  // Check if tasks are loaded
  if (!writingStore.tasks || writingStore.tasks.length === 0) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const currentTask = writingStore.currentTaskData
  
  if (!currentTask) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const answer = writingStore.getAnswer(currentTask.id)
  const wordCount = writingStore.getWordCount(currentTask.id)

  const handleTaskChange = (taskId: number) => {
    writingStore.setCurrentTask(taskId)
  }

  const handleTextChange = (text: string) => {
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
    <Layout className="h-screen flex flex-col">
      <Header 
        isPreviewMode={isPreviewMode}
        previewSectionType="writing"
        onBackClick={onBackClick}
      >
        {!isPreviewMode && (
          <Timer timeRemaining={writingStore.timeRemaining} isTimeUp={writingStore.isTimeUp} />
        )}
      </Header>

      {/* Task Info - Compact */}
      <div className="px-4 py-1.5 border-b" style={{ backgroundColor: 'var(--card-background)', borderColor: 'var(--border-color)' }}>
        <h2 className="font-semibold text-sm inline-block mr-3" style={{ color: 'var(--text-primary)' }}>{currentTask.title}</h2>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Spend about <span className="text-blue-600 font-semibold">{currentTask.timeMinutes} min</span> • Write at least <span className="text-blue-600 font-semibold">{currentTask.minWords} words</span>
        </span>
      </div>

      {/* Main Content Area with Resizable Panes */}
      <Content ref={containerRef} className="flex-1 flex relative overflow-hidden">
        {/* Left Pane - Question */}
        <div
          className="overflow-y-auto p-6"
          style={{ width: `${leftWidth}%`, backgroundColor: 'var(--card-background)' }}
        >
          <div className="prose prose-base max-w-none">
            {currentTask.instruction && (
              <div
                className="mb-4 prose prose-base max-w-none"
                style={{
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap'
                }}
                dangerouslySetInnerHTML={{ __html: currentTask.instruction }}
              />
            )}
            <div
              className="leading-relaxed prose prose-base max-w-none"
              style={{
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap'
              }}
              dangerouslySetInnerHTML={{ __html: currentTask.question }}
            />
            {currentTask.image && (
              <div className="mt-6">
                <AuthenticatedImage src={currentTask.image} alt="Task visual" className="max-w-full h-auto" />
              </div>
            )}
          </div>
        </div>

        {/* Resizable Divider */}
        <div
          className="w-1 cursor-col-resize transition-colors flex-shrink-0"
          onMouseDown={handleMouseDown}
          style={{
            cursor: 'col-resize',
            backgroundColor: isDragging ? 'var(--border-color)' : 'var(--border-color)',
            opacity: isDragging ? 0.8 : 0.5
          }}
        />

        {/* Right Pane - Answer Input */}
        <div
          className="flex flex-col p-6"
          style={{ width: `${100 - leftWidth}%`, backgroundColor: 'var(--background)' }}
        >
          <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
            <TextArea
              value={answer}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full flex-1 resize-none text-base leading-relaxed"
              style={{
                height: '100%',
                minHeight: '100%',
                fontFamily: 'inherit',
                backgroundColor: 'var(--input-background)',
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)'
              }}
              autoSize={false}
            />
            <div className="mt-2 text-right">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Words: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{wordCount}</span>
              </span>
            </div>
          </div>
        </div>
      </Content>

      {/* Bottom Navigation */}
      <Footer className="border-t p-0" style={{ backgroundColor: 'var(--card-background)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between px-4 py-2 gap-3">
          {/* Part Buttons - Compact */}
          <div className="flex items-center gap-2">
            {writingStore.tasks.map((task) => {
              const isCurrentTask = writingStore.currentTask === task.id
              const taskWordCount = writingStore.getWordCount(task.id)
              const isComplete = taskWordCount >= task.minWords

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded border transition-all"
                  style={{
                    backgroundColor: isCurrentTask ? 'var(--background)' : 'var(--card-background)',
                    borderColor: isCurrentTask ? 'var(--border-color)' : 'var(--border-color)',
                    opacity: isCurrentTask ? 1 : 0.8,
                    minWidth: 'fit-content'
                  }}
                  onClick={() => handleTaskChange(task.id)}
                >
                  <span
                    className="font-medium text-xs whitespace-nowrap"
                    style={{ color: isCurrentTask ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    {task.title}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {taskWordCount}/{task.minWords}
                  </span>
                  {isComplete && <CheckOutlined className="text-green-500" style={{ fontSize: '10px' }} />}
                </div>
              )
            })}
          </div>

          {/* Navigation Arrows and Submit */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <Button
              icon={<LeftOutlined />}
              onClick={() => handleTaskChange(writingStore.currentTask - 1)}
              disabled={writingStore.currentTask === 1}
              size="small"
              style={{
                backgroundColor: writingStore.currentTask !== 1 ? 'var(--card-background)' : 'var(--background)',
                borderColor: 'var(--border-color)',
                color: writingStore.currentTask !== 1 ? 'var(--text-primary)' : 'var(--text-secondary)',
                opacity: writingStore.currentTask !== 1 ? 1 : 0.5
              }}
            />

            {/* Next Button */}
            <Button
              icon={<RightOutlined />}
              onClick={() => handleTaskChange(writingStore.currentTask + 1)}
              disabled={writingStore.currentTask === writingStore.tasks.length}
              size="small"
              style={{
                backgroundColor: writingStore.currentTask !== writingStore.tasks.length ? 'var(--text-primary)' : 'var(--background)',
                borderColor: writingStore.currentTask !== writingStore.tasks.length ? 'var(--text-primary)' : 'var(--border-color)',
                color: writingStore.currentTask !== writingStore.tasks.length ? 'var(--card-background)' : 'var(--text-secondary)'
              }}
            />

            {/* Submit Button */}
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSubmit}
              disabled={isPreviewMode}
              size="small"
              className="bg-green-600 hover:bg-green-700"
            >
              Submit
            </Button>
          </div>
        </div>
      </Footer>

      {/* Submit Modal */}
      <SubmitModal 
        visible={showSubmitModal} 
        onClose={handleModalClose} 
        onConfirm={handleModalConfirm}
        loading={writingStore.isSubmitting}
      />
    </Layout>
  )
})

export default WritingTestLayout
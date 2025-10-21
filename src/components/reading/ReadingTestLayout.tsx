'use client'

import { useState, useEffect, useRef } from 'react'
import { Layout, Button } from 'antd'
import { LeftOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/StoreContext'
import Header from '@/components/common/Header'
import ReadingPassage from './ReadingPassage'
import QuestionPanel from './QuestionPanel'
import BottomNavigation from './BottomNavigation'
import SubmitModal from '@/components/common/SubmitModal'

const { Content } = Layout

const ReadingTestLayout = observer(() => {
  const { readingStore } = useStore()
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

  const handleModalConfirm = () => {
    setShowSubmitModal(false)
    router.push('/')
  }

  return (
    <Layout className="h-screen flex flex-col">
      <Header />

      {/* Part Title */}
      <div className="bg-gray-50 px-6 border-b">
        <h2 className="font-bold text-base text-black">{currentPart.title}</h2>
        <p className="text-xs text-gray-600 mt-0.5">{currentPart.instruction}</p>
      </div>

      {/* Main Content Area with Resizable Panes */}
      <Content ref={containerRef} className="flex-1 flex relative overflow-hidden">
        {/* Left Pane - Reading Passage */}
        <div
          className="overflow-y-auto bg-white"
          style={{ width: `${leftWidth}%` }}
        >
          <ReadingPassage 
            passage={currentPart.passage}
            sections={currentPart.sections}
            onHeadingDrop={handleHeadingDrop}
            getHeadingForSection={getHeadingForSection}
          />
        </div>

        {/* Resizable Divider */}
        <div
          className="w-1 bg-gray-400 cursor-col-resize hover:bg-gray-600 transition-colors flex-shrink-0"
          onMouseDown={handleMouseDown}
          style={{ 
            cursor: isDragging ? 'col-resize' : 'col-resize',
            backgroundColor: isDragging ? '#4B5563' : '#9CA3AF'
          }}
        />

        {/* Right Pane - Questions */}
        <div
          className="overflow-y-auto bg-gray-50 flex-1"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <QuestionPanel />
        </div>

        {/* Navigation Buttons */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            type="primary"
            size="large"
            icon={<LeftOutlined />}
            onClick={() => readingStore.previousQuestion()}
            disabled={readingStore.currentPart === 1 && readingStore.currentQuestionIndex === 0}
            className="bg-gray-700"
          />
          <Button
            type="primary"
            size="large"
            icon={<RightOutlined />}
            onClick={() => readingStore.nextQuestion()}
            className="bg-gray-700"
          />
        </div>
      </Content>

      {/* Bottom Navigation */}
      <BottomNavigation onSubmit={handleSubmit} />

      {/* Submit Modal */}
      <SubmitModal visible={showSubmitModal} onClose={handleModalClose} onConfirm={handleModalConfirm} />
    </Layout>
  )
})

export default ReadingTestLayout

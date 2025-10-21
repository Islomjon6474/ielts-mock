'use client'

import { useState, useEffect, useRef } from 'react'
import { Layout, Button, Input } from 'antd'
import { LeftOutlined, RightOutlined, CheckOutlined } from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/StoreContext'
import Header from '@/components/common/Header'
import SubmitModal from '@/components/common/SubmitModal'

const { Content, Footer } = Layout
const { TextArea } = Input

const WritingTestLayout = observer(() => {
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

  const handleModalConfirm = () => {
    setShowSubmitModal(false)
    router.push('/')
  }

  return (
    <Layout className="h-screen flex flex-col">
      <Header />

      {/* Task Info */}
      <div className="bg-gray-50 px-6 py-2 border-b">
        <h2 className="font-bold text-base text-black">{currentTask.title}</h2>
        <p className="text-xs text-gray-600 mt-0.5">
          You should spend about <span className="text-blue-600 font-semibold">{currentTask.timeMinutes} minutes</span> on this task. Write at least <span className="text-blue-600 font-semibold">{currentTask.minWords} words</span>.
        </p>
      </div>

      {/* Main Content Area with Resizable Panes */}
      <Content ref={containerRef} className="flex-1 flex relative overflow-hidden">
        {/* Left Pane - Question */}
        <div
          className="overflow-y-auto bg-white p-6"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="prose max-w-none">
            <h3 className="text-base font-semibold mb-4">Write about the following topic:</h3>
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
              {currentTask.question}
            </div>
            {currentTask.image && (
              <div className="mt-6">
                <img src={currentTask.image} alt="Task visual" className="max-w-full h-auto" />
              </div>
            )}
          </div>
        </div>

        {/* Resizable Divider */}
        <div
          className="w-1 bg-gray-400 cursor-col-resize hover:bg-gray-600 transition-colors flex-shrink-0"
          onMouseDown={handleMouseDown}
          style={{ 
            cursor: 'col-resize',
            backgroundColor: isDragging ? '#4B5563' : '#9CA3AF'
          }}
        />

        {/* Right Pane - Answer Input */}
        <div
          className="bg-gray-50 flex flex-col overflow-hidden"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <div className="flex-1 p-6 overflow-auto">
            <TextArea
              value={answer}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-full resize-none text-base leading-relaxed"
              style={{ minHeight: '100%', fontFamily: 'inherit' }}
              autoSize={false}
            />
          </div>
          <div className="px-6 py-3 bg-white border-t text-right flex-shrink-0">
            <span className="text-sm text-gray-600">
              Words: <span className="font-semibold text-gray-900">{wordCount}</span>
            </span>
          </div>
        </div>
      </Content>

      {/* Bottom Navigation */}
      <Footer className="border-t bg-white p-0">
        <div className="flex items-center px-6 gap-4">
          {/* Part Buttons - Full Width */}
          <div className="flex items-center gap-3 flex-1">
            {writingStore.tasks.map((task) => {
              const isCurrentTask = writingStore.currentTask === task.id
              const taskWordCount = writingStore.getWordCount(task.id)
              const isComplete = taskWordCount >= task.minWords

              return (
                <div
                  key={task.id}
                  className={`flex-1 flex items-center justify-between cursor-pointer px-4 py-2 rounded-lg border ${
                    isCurrentTask
                      ? 'bg-gray-100 border-gray-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => handleTaskChange(task.id)}
                >
                  <span
                    className={`font-semibold ${
                      isCurrentTask ? 'text-black' : 'text-gray-500'
                    }`}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {taskWordCount} of {task.minWords}
                    </span>
                    {isComplete && <CheckOutlined className="text-green-500" />}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Navigation and Submit */}
          <div className="flex items-center gap-2">
            <Button
              type="primary"
              icon={<LeftOutlined />}
              disabled={writingStore.currentTask === 1}
              onClick={() => handleTaskChange(writingStore.currentTask - 1)}
              className="bg-gray-700"
            >
              Previous
            </Button>
            <Button
              type="primary"
              icon={<RightOutlined />}
              iconPosition="end"
              disabled={writingStore.currentTask === writingStore.tasks.length}
              onClick={() => handleTaskChange(writingStore.currentTask + 1)}
              className="bg-gray-700"
            >
              Next
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700"
            >
              Submit
            </Button>
          </div>
        </div>
      </Footer>

      {/* Submit Modal */}
      <SubmitModal visible={showSubmitModal} onClose={handleModalClose} onConfirm={handleModalConfirm} />
    </Layout>
  )
})

export default WritingTestLayout
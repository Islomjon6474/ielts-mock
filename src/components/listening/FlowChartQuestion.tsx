'use client'

import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Input } from 'antd'

interface FlowChartQuestionProps {
  questionStart: number
  questionEnd: number
  options: string[]
  instruction: string
  title: string
}

const FlowChartQuestion = observer(({
  questionStart,
  questionEnd,
  options,
  instruction,
  title
}: FlowChartQuestionProps) => {
  const { listeningStore } = useStore()
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, option: string) => {
    setDraggedItem(option)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, questionId: number) => {
    e.preventDefault()
    if (draggedItem) {
      listeningStore.setAnswer(questionId, draggedItem)
    }
    setDraggedItem(null)
  }

  const handleRemove = (questionId: number) => {
    listeningStore.setAnswer(questionId, '')
  }

  // Get used options
  const questionIds = Array.from({ length: questionEnd - questionStart + 1 }, (_, i) => questionStart + i)
  const usedOptions = questionIds
    .map(id => listeningStore.getAnswer(id) as string)
    .filter(Boolean)

  const DropZone = ({ questionId }: { questionId: number }) => {
    const answer = listeningStore.getAnswer(questionId) as string || ''
    
    return (
      <span
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, questionId)}
        className="inline-flex items-center gap-1 mx-1"
      >
        <Input
          value={answer}
          onChange={(e) => listeningStore.setAnswer(questionId, e.target.value)}
          placeholder={questionId.toString()}
          className="text-center"
          style={{ width: '80px' }}
        />
        {answer && (
          <button
            onClick={() => handleRemove(questionId)}
            className="text-gray-400 hover:text-gray-600 text-sm font-bold"
          >
            ✕
          </button>
        )}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-base mb-2">{title}</h3>
      <p className="text-sm mb-4">{instruction}</p>

      <div className="flex gap-8">
        {/* Left side - Flow chart */}
        <div className="flex-1 max-w-2xl">
          <h4 className="font-semibold text-sm mb-3">Procedure for detecting life on another planet</h4>
          
          <div className="space-y-0">
            {/* Step 1 */}
            <div style={{ border: '1px solid #000' }} className="p-3 bg-white">
              <p className="text-sm">A spacecraft lands on a planet and sends out a rover.</p>
            </div>
            
            <div className="flex justify-center py-2">
              <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-500">
                <polygon points="8,0 16,8 8,16 0,8" fill="currentColor"/>
              </svg>
            </div>

            {/* Step 2 */}
            <div style={{ border: '1px solid #000' }} className="p-3 bg-white">
              <p className="text-sm">The rover is directed to a <DropZone questionId={26} /> which has organic matter in it.</p>
            </div>
            
            <div className="flex justify-center py-2">
              <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-500">
                <polygon points="8,0 16,8 8,16 0,8" fill="currentColor"/>
              </svg>
            </div>

            {/* Step 3 */}
            <div style={{ border: '1px solid #000' }} className="p-3 bg-white">
              <p className="text-sm">It collects a sample from below the surface in order to avoid the effects of <DropZone questionId={27} />.</p>
            </div>
            
            <div className="flex justify-center py-2">
              <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-500">
                <polygon points="8,0 16,8 8,16 0,8" fill="currentColor"/>
              </svg>
            </div>

            {/* Step 4 */}
            <div style={{ border: '1px solid #000' }} className="p-3 bg-white">
              <p className="text-sm">The soil and rocks are checked to look for evidence of fossils.</p>
            </div>
            
            <div className="flex justify-center py-2">
              <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-500">
                <polygon points="8,0 16,8 8,16 0,8" fill="currentColor"/>
              </svg>
            </div>

            {/* Step 5 */}
            <div style={{ border: '1px solid #000' }} className="p-3 bg-white">
              <p className="text-sm">The sample is converted to powder.</p>
            </div>
            
            <div className="flex justify-center py-2">
              <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-500">
                <polygon points="8,0 16,8 8,16 0,8" fill="currentColor"/>
              </svg>
            </div>

            {/* Step 6 */}
            <div style={{ border: '1px solid #000' }} className="p-3 bg-white">
              <p className="text-sm">The sample is subjected to <DropZone questionId={28} />.</p>
            </div>
            
            <div className="flex justify-center py-2">
              <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-500">
                <polygon points="8,0 16,8 8,16 0,8" fill="currentColor"/>
              </svg>
            </div>

            {/* Step 7 */}
            <div style={{ border: '1px solid #000' }} className="p-3 bg-white">
              <p className="text-sm">It runs spectrometer to seek for potential proof of life e.g. <DropZone questionId={29} />.</p>
            </div>
            
            <div className="flex justify-center py-2">
              <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-500">
                <polygon points="8,0 16,8 8,16 0,8" fill="currentColor"/>
              </svg>
            </div>

            {/* Step 8 */}
            <div style={{ border: '1px solid #000' }} className="p-3 bg-white">
              <p className="text-sm">The <DropZone questionId={30} /> are compared with existing data from Earth.</p>
            </div>
          </div>
        </div>

        {/* Right side - Options */}
        <div className="w-48">
          <div className="space-y-2">
            {options.map((option, index) => {
              const isUsed = usedOptions.includes(option)
              
              return (
                <div
                  key={index}
                  draggable={!isUsed}
                  onDragStart={(e) => !isUsed && handleDragStart(e, option)}
                  className={`px-3 py-2 border rounded text-sm ${
                    isUsed
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-white border-gray-300 cursor-move hover:bg-gray-50'
                  }`}
                >
                  {option}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
})

export default FlowChartQuestion

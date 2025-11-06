'use client'

import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Input } from 'antd'

interface MatchingItem {
  id: number
  label: string
}

interface MatchingQuestionProps {
  questionStart: number
  questionEnd: number
  leftItems: MatchingItem[]
  rightOptions: string[]
  instruction: string
  title: string
}

const MatchingQuestion = observer(({
  questionStart,
  questionEnd,
  leftItems,
  rightOptions,
  instruction,
  title
}: MatchingQuestionProps) => {
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
  const usedOptions = leftItems
    .map((item: MatchingItem) => listeningStore.getAnswer(item.id) as string)
    .filter(Boolean)

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-base mb-2">{title}</h3>
      <p className="text-sm mb-4">{instruction}</p>

      <div className="flex gap-8">
        {/* Left side - People/Items with drop zones */}
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-3">People</h4>
          <div className="space-y-3">
            {leftItems.map((item: MatchingItem) => {
              const answer = listeningStore.getAnswer(item.id) as string || ''
              
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="text-sm w-32">{item.label}</span>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, item.id)}
                    className="relative flex items-center gap-2"
                  >
                    <Input
                      value={answer}
                      onChange={(e) => listeningStore.setAnswer(item.id, e.target.value)}
                      placeholder={item.id.toString()}
                      className="text-center"
                      style={{ width: '150px' }}
                    />
                    {answer && (
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right side - Options */}
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-3">Staff Responsibilities</h4>
          <div className="space-y-2">
            {rightOptions.map((option: string, index: number) => {
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

export default MatchingQuestion

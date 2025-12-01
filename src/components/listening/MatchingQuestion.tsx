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
  isPreviewMode?: boolean
}

const MatchingQuestion = observer(({
  questionStart,
  questionEnd,
  leftItems,
  rightOptions,
  instruction,
  title,
  isPreviewMode = false
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
      <h3 style={{ color: 'var(--text-primary)' }} className="font-bold text-base mb-2">{title}</h3>
      <p style={{ color: 'var(--text-primary)' }} className="text-sm mb-4">{instruction}</p>

      <div className="flex gap-8">
        {/* Left side - People/Items with drop zones */}
        <div className="flex-1">
          <h4 style={{ color: 'var(--text-primary)' }} className="font-semibold text-sm mb-3">People</h4>
          <div className="space-y-3">
            {leftItems.map((item: MatchingItem) => {
              // In preview mode with submitted answers, show submitted answer with correctness styling
              if (isPreviewMode) {
                const submittedAnswer = listeningStore.getSubmittedAnswer(item.id)
                const isCorrect = listeningStore.isAnswerCorrect(item.id)

                // Determine border and background color based on correctness
                let borderColor = 'var(--input-border)'
                let backgroundColor = 'var(--input-background)'

                if (submittedAnswer) {
                  if (isCorrect === true) {
                    borderColor = '#52c41a' // Green for correct
                    backgroundColor = '#f6ffed' // Light green background
                  } else if (isCorrect === false) {
                    borderColor = '#ff4d4f' // Red for incorrect
                    backgroundColor = '#fff2f0' // Light red background
                  }
                }

                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <span style={{ color: 'var(--text-primary)' }} className="text-sm w-32">{item.label}</span>
                    <div className="relative flex items-center gap-2">
                      <Input
                        value={submittedAnswer as string || ''}
                        placeholder={item.id.toString()}
                        className="text-center"
                        style={{
                          width: '150px',
                          backgroundColor,
                          borderColor,
                          borderWidth: '2px',
                          color: 'var(--text-primary)'
                        }}
                        disabled={true}
                      />
                    </div>
                  </div>
                )
              }

              // Normal mode - editable
              const answer = listeningStore.getAnswer(item.id) as string || ''

              return (
                <div key={item.id} className="flex items-center gap-3">
                  <span style={{ color: 'var(--text-primary)' }} className="text-sm w-32">{item.label}</span>
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
                      style={{ width: '150px', backgroundColor: 'var(--input-background)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                      disabled={false}
                    />
                    {answer && (
                      <button
                        onClick={() => handleRemove(item.id)}
                        style={{ color: 'var(--text-secondary)' }}
                        className="hover:opacity-70 text-sm font-bold"
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
          <h4 style={{ color: 'var(--text-primary)' }} className="font-semibold text-sm mb-3">Staff Responsibilities</h4>
          <div className="space-y-2">
            {rightOptions.map((option: string, index: number) => {
              const isUsed = usedOptions.includes(option)

              return (
                <div
                  key={index}
                  draggable={!isUsed && !isPreviewMode}
                  onDragStart={(e) => !isUsed && !isPreviewMode && handleDragStart(e, option)}
                  style={{
                    backgroundColor: isUsed ? 'var(--card-background)' : 'var(--card-background)',
                    borderColor: 'var(--border-color)',
                    color: isUsed ? 'var(--text-secondary)' : 'var(--text-primary)',
                    opacity: isUsed ? 0.5 : 1
                  }}
                  className={`px-3 py-2 border rounded text-sm ${
                    isUsed
                      ? 'cursor-not-allowed'
                      : isPreviewMode
                      ? 'cursor-default'
                      : 'cursor-move hover:opacity-80'
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

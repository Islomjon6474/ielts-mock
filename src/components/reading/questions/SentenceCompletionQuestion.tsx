'use client'

import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'

interface SentenceCompletionQuestionProps {
  questions: Question[]
  questionNumbers: number[]
  options: string[]
}

const SentenceCompletionQuestion = observer(({ 
  questions, 
  questionNumbers,
  options 
}: SentenceCompletionQuestionProps) => {
  const { readingStore } = useStore()
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, option: string) => {
    // Check if option is already used
    const isUsed = questionNumbers.some(qNum => {
      const answer = readingStore.getAnswer(qNum) as string
      return answer === option
    })
    
    if (isUsed) {
      e.preventDefault()
      return
    }
    
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
      readingStore.setAnswer(questionId, draggedItem)
    }
    setDraggedItem(null)
  }

  const handleRemove = (questionId: number) => {
    readingStore.setAnswer(questionId, '')
  }

  // Get all used options
  const usedOptions = questionNumbers
    .map(qNum => readingStore.getAnswer(qNum) as string)
    .filter(Boolean)

  // Helper to strip HTML
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  return (
    <div className="space-y-6">
      {/* Questions Section */}
      <div>
        <div className="space-y-2">
          {questions.map((question, index) => {
            const questionNumber = questionNumbers[index]
            const answer = readingStore.getAnswer(question.id) as string || ''
            
            // Parse the text to extract the sentence and placeholder
            const textContent = question.text
            // Extract placeholder like [21], [22], etc.
            const placeholderMatch = textContent.match(/\[(\d+)\]/)
            const placeholderNum = placeholderMatch ? placeholderMatch[1] : questionNumber.toString()
            
            const cleanText = stripHtml(textContent)
            
            // Split text by placeholder to show it inline
            const parts = cleanText.split(`[${placeholderNum}]`)
            
            // Get clean answer text if answer exists
            const cleanAnswer = answer ? stripHtml(answer) : ''
            
            return (
              <div key={question.id} className="flex items-center gap-2 text-sm">
                <strong className="whitespace-nowrap">{questionNumber}</strong>
                <span>{parts[0]}</span>
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, question.id)}
                  className={`inline-flex items-center border-2 border-dashed rounded px-3 py-1 min-w-[100px] ${
                    answer ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  {answer ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{cleanAnswer}</span>
                      <button
                        onClick={() => handleRemove(question.id)}
                        className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">{placeholderNum}</span>
                  )}
                </div>
                {parts[1] && <span>{parts[1]}</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Options Section */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Features</h4>
        <div className="grid grid-cols-2 gap-3">
          {options.map((option, index) => {
            const isUsed = usedOptions.includes(option)
            const cleanOption = stripHtml(option)
            
            return (
              <div
                key={index}
                draggable={!isUsed}
                onDragStart={(e) => handleDragStart(e, option)}
                className={`px-4 py-3 border-2 rounded-md text-sm transition-all shadow-sm ${
                  isUsed
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed line-through border-gray-500'
                    : 'bg-gray-200 border-gray-700 cursor-move hover:bg-blue-50 hover:border-blue-500 hover:shadow-md'
                }`}
              >
                {cleanOption}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default SentenceCompletionQuestion

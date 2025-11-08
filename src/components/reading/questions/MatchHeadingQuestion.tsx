'use client'

import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'

interface MatchHeadingQuestionProps {
  questions: Question[]
  questionNumbers: number[]
  headings: string[]
}

const MatchHeadingQuestion = observer(({ 
  questions, 
  questionNumbers,
  headings 
}: MatchHeadingQuestionProps) => {
  const { readingStore } = useStore()
  const [draggedItem, setDraggedItem] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, heading: string) => {
    // Check if heading is already used
    const isUsed = questionNumbers.some(qNum => {
      const answer = readingStore.getAnswer(qNum) as string
      return answer === heading
    })
    
    if (isUsed) {
      e.preventDefault()
      return
    }
    
    setDraggedItem(heading)
    e.dataTransfer.setData('heading', heading)
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

  // Get all used headings
  const usedHeadings = questionNumbers
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
      {/* Sections with drop zones */}
      <div>
        <div className="space-y-3">
          {questions.map((question, index) => {
            const questionNumber = questionNumbers[index]
            const answer = readingStore.getAnswer(question.id) as string || ''
            
            // Parse the text to extract the section and placeholder
            const textContent = question.text
            const placeholderMatch = textContent.match(/\[(\d+)\]/)
            const placeholderNum = placeholderMatch ? placeholderMatch[1] : questionNumber.toString()
            
            const cleanText = stripHtml(textContent)
            const parts = cleanText.split(`[${placeholderNum}]`)
            
            // Get clean answer text if answer exists
            const cleanAnswer = answer ? stripHtml(answer) : ''
            
            return (
              <div key={question.id} className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                <div className="text-sm mb-3">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: parts[0] || cleanText }}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <strong className="text-sm">{questionNumber}.</strong>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, question.id)}
                    className={`flex-1 border-2 border-dashed rounded px-4 py-3 min-h-[50px] flex items-center ${
                      answer ? 'border-blue-400 bg-blue-50' : 'border-gray-400'
                    }`}
                  >
                    {answer ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-medium">{cleanAnswer}</span>
                        <button
                          onClick={() => handleRemove(question.id)}
                          className="text-gray-400 hover:text-gray-600 text-sm font-bold ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Drag heading here</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Headings Section */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Available Headings</h4>
        <div className="grid grid-cols-1 gap-3">
          {headings.map((heading, index) => {
            const isUsed = usedHeadings.includes(heading)
            const cleanHeading = stripHtml(heading)
            
            return (
              <div
                key={index}
                draggable={!isUsed}
                onDragStart={(e) => handleDragStart(e, heading)}
                className={`px-4 py-3 border-2 rounded-md text-sm transition-all shadow-sm ${
                  isUsed
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed line-through border-gray-500'
                    : 'bg-gray-200 border-gray-700 cursor-move hover:bg-blue-50 hover:border-blue-500 hover:shadow-md'
                }`}
              >
                <span className="font-medium mr-2">{String.fromCharCode(105 + index)}.</span>
                {cleanHeading}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default MatchHeadingQuestion

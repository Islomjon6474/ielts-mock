'use client'

import { useState, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'

interface SentenceCompletionQuestionProps {
  questions: any[]
  questionNumbers: number[]
  options: string[]
  instruction?: string
  title?: string
  imageUrl?: string
  isPreviewMode?: boolean
}

const SentenceCompletionQuestion = observer(({ 
  questions, 
  questionNumbers,
  options,
  instruction,
  title,
  imageUrl,
  isPreviewMode = false
}: SentenceCompletionQuestionProps) => {
  const { listeningStore } = useStore()
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  useEffect(() => {
    const currentQuestionNumber = listeningStore.currentQuestionNumber
    
    // Find if current question is in this group
    if (questionNumbers.includes(currentQuestionNumber)) {
      const questionRef = questionRefs.current[currentQuestionNumber]
      if (questionRef) {
        setTimeout(() => {
          questionRef.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          // Focus on the drop zone
          const dropZone = questionRef.querySelector('[class*="border-dashed"]') as HTMLElement
          if (dropZone) {
            dropZone.focus()
          }
        }, 100)
      }
    }
  }, [listeningStore.currentQuestionNumber, questionNumbers])

  const handleDragStart = (e: React.DragEvent, option: string) => {
    // Check if option is already used
    const isUsed = questionNumbers.some(qNum => {
      const answer = listeningStore.getAnswer(qNum) as string
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
      listeningStore.setAnswer(questionId, draggedItem)
    }
    setDraggedItem(null)
  }

  const handleRemove = (questionId: number) => {
    listeningStore.setAnswer(questionId, '')
  }

  // Get all used options
  const usedOptions = questionNumbers
    .map(qNum => listeningStore.getAnswer(qNum) as string)
    .filter(Boolean)

  // Helper to strip HTML (for options only)
  const stripHtml = (html: string) => {
    if (!html) return ''
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // Helper to render HTML content with styled arrows while preserving structure
  const renderHtmlWithStyledArrows = (html: string) => {
    if (!html) return null
    
    // Keep HTML structure intact, just style the arrows
    let processedHtml = html
      // Style arrows to be larger and bold
      .replace(/↓/g, '<span style="font-size: 2rem; font-weight: bold; color: #374151; display: inline-block; margin: 0 4px;">↓</span>')
      .replace(/↑/g, '<span style="font-size: 2rem; font-weight: bold; color: #374151; display: inline-block; margin: 0 4px;">↑</span>')
      .replace(/←/g, '<span style="font-size: 2rem; font-weight: bold; color: #374151; display: inline-block; margin: 0 4px;">←</span>')
      .replace(/→/g, '<span style="font-size: 2rem; font-weight: bold; color: #374151; display: inline-block; margin: 0 4px;">→</span>')
    
    return <div dangerouslySetInnerHTML={{ __html: processedHtml }} className="prose prose-sm max-w-none" />
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="font-bold text-base mb-2">{title}</h3>}
      {instruction && <p className="text-sm mb-4">{instruction}</p>}
      
      {/* Display image if available */}
      {imageUrl && (
        <div className="mb-4">
          <AuthenticatedImage
            src={imageUrl}
            alt="Question group illustration"
            className="rounded border"
            style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
          />
        </div>
      )}
      
      <div className="space-y-6">
        {/* Questions Section */}
        <div>
          <div className="space-y-2">
            {questions.map((question, index) => {
              const questionNumber = questionNumbers[index]
              const answer = listeningStore.getAnswer(question.id) as string || ''
              
              // Parse the text to extract the sentence and placeholder
              const textContent = question.text
              // Extract placeholder like [21], [22], etc.
              const placeholderMatch = textContent.match(/\[(\d+)\]/)
              const placeholderNum = placeholderMatch ? placeholderMatch[1] : questionNumber.toString()
              
              // Split HTML by placeholder to show it inline
              const parts = textContent.split(`[${placeholderNum}]`)
              
              // Get clean answer text for display
              const cleanAnswer = answer ? (() => {
                const tmp = document.createElement('DIV')
                tmp.innerHTML = answer
                return tmp.textContent || tmp.innerText || ''
              })() : ''
              
              return (
                <div 
                  key={question.id} 
                  className="flex items-start gap-3 text-sm mb-4" 
                  data-question-id={questionNumber}
                  ref={(el) => { if (el) questionRefs.current[questionNumber] = el }}
                >
                  <strong className="whitespace-nowrap mt-1 text-base">{questionNumber}</strong>
                  <div className="flex-1">
                    {/* Render content with preserved formatting */}
                    <div className="space-y-2">
                      {parts[0] && renderHtmlWithStyledArrows(parts[0])}
                      {/* Drop zone for answer */}
                      <div
                        onDragOver={!isPreviewMode ? handleDragOver : undefined}
                        onDrop={!isPreviewMode ? (e) => handleDrop(e, question.id) : undefined}
                        tabIndex={0}
                        className={`inline-flex items-center border-2 border-dashed rounded px-3 py-1 min-w-[120px] ${
                          answer ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                        }`}
                      >
                        {answer ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{cleanAnswer}</span>
                            {!isPreviewMode && (
                              <button
                                onClick={() => handleRemove(question.id)}
                                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs font-bold">{placeholderNum}</span>
                        )}
                      </div>
                      {parts[1] && renderHtmlWithStyledArrows(parts[1])}
                    </div>
                  </div>
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
                  draggable={!isUsed && !isPreviewMode}
                  onDragStart={!isPreviewMode ? (e) => handleDragStart(e, option) : undefined}
                  className={`px-4 py-3 border-2 rounded-md text-sm transition-all shadow-sm ${
                    isUsed
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed line-through border-gray-500'
                      : isPreviewMode
                      ? 'bg-gray-200 border-gray-700 cursor-default'
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
    </div>
  )
})

export default SentenceCompletionQuestion

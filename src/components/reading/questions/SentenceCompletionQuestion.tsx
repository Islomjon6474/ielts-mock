'use client'

import { useState, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'

interface SentenceCompletionQuestionProps {
  questions: Question[]
  questionNumbers: number[]
  options: string[]
  imageUrl?: string
}

const SentenceCompletionQuestion = observer(({ 
  questions, 
  questionNumbers,
  options,
  imageUrl
}: SentenceCompletionQuestionProps) => {
  const { readingStore } = useStore()
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  useEffect(() => {
    // Only focus if not in preview mode
    if (readingStore.isPreviewMode) return
    
    const currentQuestionNumber = readingStore.parts[readingStore.currentPart - 1]?.questionRange[0] + readingStore.currentQuestionIndex
    
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
  }, [readingStore.currentQuestionIndex, readingStore.currentPart, questionNumbers, readingStore.isPreviewMode])

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

      {/* Questions and Options - Horizontal Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Side - Questions Section */}
        <div>
        <div className="space-y-1">
          {questions.map((question, index) => {
            const questionNumber = questionNumbers[index]
            const answer = readingStore.getAnswer(question.id) as string || ''

            // In preview mode, get submitted answer for styling
            const submittedAnswer = readingStore.isPreviewMode ? readingStore.getSubmittedAnswer(question.id) : null
            const isCorrect = readingStore.isPreviewMode ? readingStore.isAnswerCorrect(question.id) : null

            // Use submitted answer in preview mode, otherwise use current answer
            const displayAnswer = readingStore.isPreviewMode ? (submittedAnswer as string || '') : answer

            // Parse the text to extract the sentence and placeholder
            const textContent = question.text
            // Extract placeholder like [21], [22], etc.
            const placeholderMatch = textContent.match(/\[(\d+)\]/)
            const placeholderNum = placeholderMatch ? placeholderMatch[1] : questionNumber.toString()

            // Split the text into parts before and after placeholder, REMOVING the placeholder
            const placeholderPattern = /\[(\d+)\]/
            const match = textContent.match(placeholderPattern)
            const beforeText = match ? textContent.substring(0, match.index) : ''
            const afterText = match ? textContent.substring(match.index! + match[0].length) : textContent

            // Get clean answer text for display
            const cleanAnswer = displayAnswer ? (() => {
              const tmp = document.createElement('DIV')
              tmp.innerHTML = displayAnswer
              return tmp.textContent || tmp.innerText || ''
            })() : ''

            // Determine border and background color based on correctness
            let borderColor = displayAnswer ? 'var(--primary)' : 'var(--border-color)'
            let backgroundColor = displayAnswer ? 'var(--secondary)' : 'transparent'

            if (readingStore.isPreviewMode && submittedAnswer) {
              if (isCorrect === true) {
                borderColor = '#52c41a' // Green for correct
                backgroundColor = '#f6ffed' // Light green background
              } else if (isCorrect === false) {
                borderColor = '#ff4d4f' // Red for incorrect
                backgroundColor = '#fff2f0' // Light red background
              }
            }

            // Process arrows in text
            const processArrows = (html: string) => {
              return html
                .replace(/↓/g, '<span style="font-size: 2rem; font-weight: bold; color: #374151; display: inline-block; margin: 0 4px;">↓</span>')
                .replace(/↑/g, '<span style="font-size: 2rem; font-weight: bold; color: #374151; display: inline-block; margin: 0 4px;">↑</span>')
                .replace(/←/g, '<span style="font-size: 2rem; font-weight: bold; color: #374151; display: inline-block; margin: 0 4px;">←</span>')
                .replace(/→/g, '<span style="font-size: 2rem; font-weight: bold; color: #374151; display: inline-block; margin: 0 4px;">→</span>')
            }

            return (
              <div
                key={question.id}
                className="flex items-center flex-wrap gap-2 text-sm mb-2"
                ref={(el) => { if (el) questionRefs.current[questionNumber] = el }}
              >
                <strong className="text-base" style={{ color: 'var(--text-primary)' }}>{questionNumber}</strong>
                {beforeText && <span dangerouslySetInnerHTML={{ __html: processArrows(beforeText) }} style={{ display: 'inline' }} />}
                <div
                  onDragOver={!readingStore.isPreviewMode ? handleDragOver : undefined}
                  onDrop={!readingStore.isPreviewMode ? (e) => handleDrop(e, question.id) : undefined}
                  tabIndex={0}
                  className="inline-flex items-center border-2 border-dashed rounded px-3 py-1 min-w-[120px]"
                  style={{
                    borderColor,
                    backgroundColor,
                    borderWidth: '2px'
                  }}
                >
                  {displayAnswer ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cleanAnswer}</span>
                      {!readingStore.isPreviewMode && (
                        <button
                          onClick={() => handleRemove(question.id)}
                          className="text-xs font-bold"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{placeholderNum}</span>
                  )}
                </div>
                {afterText && <span dangerouslySetInnerHTML={{ __html: processArrows(afterText) }} style={{ display: 'inline' }} />}
              </div>
            )
          })}
        </div>
        </div>

        {/* Right Side - Options Section */}
        <div>
          <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Features</h4>
          <div className="space-y-2">
            {options.map((option, index) => {
              const isUsed = usedOptions.includes(option)
              const cleanOption = stripHtml(option)

              return (
                <div
                  key={index}
                  draggable={!isUsed && !readingStore.isPreviewMode}
                  onDragStart={!readingStore.isPreviewMode ? (e) => handleDragStart(e, option) : undefined}
                  className="px-2 py-1 border-2 rounded text-sm transition-all"
                  style={{
                    backgroundColor: isUsed ? 'var(--secondary)' : 'var(--card-background)',
                    color: isUsed ? 'var(--text-secondary)' : 'var(--text-primary)',
                    borderColor: isUsed ? 'var(--text-secondary)' : 'var(--border-color)',
                    cursor: isUsed ? 'not-allowed' : readingStore.isPreviewMode ? 'default' : 'move',
                    textDecoration: isUsed ? 'line-through' : 'none',
                    opacity: isUsed ? 0.5 : 1
                  }}
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

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
      {title && <h3 style={{ color: 'var(--text-primary)' }} className="font-bold text-base mb-2">{title}</h3>}
      {instruction && <p style={{ color: 'var(--text-primary)' }} className="text-sm mb-4">{instruction}</p>}
      
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

              // Process arrows in text
              const processArrows = (html: string) => {
                return html
                  .replace(/↓/g, '<span style="font-size: 2rem; font-weight: bold; color: #374151; display: inline-block; margin: 0 4px;">↓</span>')
                  .replace(/↑/g, '<span style="font-size: 2rem; font-weight: bold; color: #374151; display: inline-block; margin: 0 4px;">↑</span>')
                  .replace(/←/g, '<span style="font-size: 2rem; font-weight: bold; color: #374151; display: inline-block; margin: 0 4px;">←</span>')
                  .replace(/→/g, '<span style="font-size: 2rem; font-weight: bold; color: #374151; display: inline-block; margin: 0 4px;">→</span>')
              }

              // In preview mode with submitted answers, show submitted answer with correctness styling
              if (isPreviewMode) {
                const submittedAnswer = listeningStore.getSubmittedAnswer(question.id)
                const isCorrect = listeningStore.isAnswerCorrect(question.id)

                // Determine border and background color based on correctness
                let borderColor = 'var(--border-color)'
                let backgroundColor = 'transparent'

                if (submittedAnswer) {
                  if (isCorrect === true) {
                    borderColor = '#52c41a' // Green for correct
                    backgroundColor = '#f6ffed' // Light green background
                  } else if (isCorrect === false) {
                    borderColor = '#ff4d4f' // Red for incorrect
                    backgroundColor = '#fff2f0' // Light red background
                  }
                }

                // Get clean answer text for display
                const cleanAnswer = submittedAnswer ? (() => {
                  const tmp = document.createElement('DIV')
                  tmp.innerHTML = submittedAnswer as string
                  return tmp.textContent || tmp.innerText || ''
                })() : ''

                return (
                  <div
                    key={question.id}
                    className="flex items-center flex-wrap gap-2 text-sm mb-2"
                    data-question-id={questionNumber}
                    ref={(el) => { if (el) questionRefs.current[questionNumber] = el }}
                  >
                    <strong className="text-base">{questionNumber}</strong>
                    {beforeText && <span dangerouslySetInnerHTML={{ __html: processArrows(beforeText) }} style={{ display: 'inline' }} />}
                    <div
                      className="inline-flex items-center border-2 border-dashed rounded px-3 py-1 min-w-[120px]"
                      style={{
                        borderColor,
                        backgroundColor,
                        borderWidth: '2px'
                      }}
                    >
                      {submittedAnswer ? (
                        <span style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">{cleanAnswer}</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-bold">{placeholderNum}</span>
                      )}
                    </div>
                    {afterText && <span dangerouslySetInnerHTML={{ __html: processArrows(afterText) }} style={{ display: 'inline' }} />}
                  </div>
                )
              }

              // Normal mode - editable
              const answer = listeningStore.getAnswer(question.id) as string || ''

              // Get clean answer text for display
              const cleanAnswer = answer ? (() => {
                const tmp = document.createElement('DIV')
                tmp.innerHTML = answer
                return tmp.textContent || tmp.innerText || ''
              })() : ''

              return (
                <div
                  key={question.id}
                  className="flex items-center flex-wrap gap-2 text-sm mb-2"
                  data-question-id={questionNumber}
                  ref={(el) => { if (el) questionRefs.current[questionNumber] = el }}
                >
                  <strong className="text-base">{questionNumber}</strong>
                  {beforeText && <span dangerouslySetInnerHTML={{ __html: processArrows(beforeText) }} style={{ display: 'inline' }} />}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, question.id)}
                    tabIndex={0}
                    style={{
                      borderColor: answer ? 'var(--primary)' : 'var(--border-color)',
                      backgroundColor: answer ? 'var(--secondary)' : 'transparent'
                    }}
                    className="inline-flex items-center border-2 border-dashed rounded px-3 py-1 min-w-[120px]"
                  >
                    {answer ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--text-primary)' }} className="text-sm font-medium">{cleanAnswer}</span>
                        <button
                          onClick={() => handleRemove(question.id)}
                          style={{ color: 'var(--text-secondary)' }}
                          className="hover:opacity-70 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-bold">{placeholderNum}</span>
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
          <h4 style={{ color: 'var(--text-primary)' }} className="font-semibold text-sm mb-3">Features</h4>
          <div className="space-y-2">
            {options.map((option, index) => {
              const isUsed = usedOptions.includes(option)
              const cleanOption = stripHtml(option)

              return (
                <div
                  key={index}
                  draggable={!isUsed && !isPreviewMode}
                  onDragStart={!isPreviewMode ? (e) => handleDragStart(e, option) : undefined}
                  style={{
                    backgroundColor: isUsed ? 'var(--secondary)' : 'var(--card-background)',
                    borderColor: isUsed ? 'var(--text-secondary)' : 'var(--border-color)',
                    color: isUsed ? 'var(--text-secondary)' : 'var(--text-primary)',
                    textDecoration: isUsed ? 'line-through' : 'none',
                    opacity: isUsed ? 0.5 : 1
                  }}
                  className={`px-2 py-1 border-2 rounded text-sm transition-all ${
                    isUsed
                      ? 'cursor-not-allowed'
                      : isPreviewMode
                      ? 'cursor-default'
                      : 'cursor-move hover:opacity-80'
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

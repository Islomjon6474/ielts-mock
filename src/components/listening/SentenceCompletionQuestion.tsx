'use client'

import { useState, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import QuestionMarkingButtons from '@/components/admin/QuestionMarkingButtons'

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
      .replace(/↓/g, '<span style="font-size: 2rem; font-weight: bold; color: var(--text-primary); display: inline-block; margin: 0 4px;">↓</span>')
      .replace(/↑/g, '<span style="font-size: 2rem; font-weight: bold; color: var(--text-primary); display: inline-block; margin: 0 4px;">↑</span>')
      .replace(/←/g, '<span style="font-size: 2rem; font-weight: bold; color: var(--text-primary); display: inline-block; margin: 0 4px;">←</span>')
      .replace(/→/g, '<span style="font-size: 2rem; font-weight: bold; color: var(--text-primary); display: inline-block; margin: 0 4px;">→</span>')

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

              // Process arrows in text and convert block elements to inline
              const processArrows = (html: string) => {
                return html
                  .replace(/↓/g, '<span style="font-size: 2rem; font-weight: bold; color: var(--text-primary); display: inline-block; margin: 0 4px;">↓</span>')
                  .replace(/↑/g, '<span style="font-size: 2rem; font-weight: bold; color: var(--text-primary); display: inline-block; margin: 0 4px;">↑</span>')
                  .replace(/←/g, '<span style="font-size: 2rem; font-weight: bold; color: var(--text-primary); display: inline-block; margin: 0 4px;">←</span>')
                  .replace(/→/g, '<span style="font-size: 2rem; font-weight: bold; color: var(--text-primary); display: inline-block; margin: 0 4px;">→</span>')
              }

              // Convert block elements to inline to preserve flow
              const convertBlockToInline = (html: string) => {
                return html
                  .replace(/<p>/gi, '<span>')
                  .replace(/<\/p>/gi, '</span>')
                  .replace(/<div>/gi, '<span>')
                  .replace(/<\/div>/gi, '</span>')
                  .replace(/<br\s*\/?>/gi, ' ')
              }

              // Split text by placeholder and inject drop zone
              const DROPZONE_MARKER = '__DROPZONE__'
              const processedText = processArrows(convertBlockToInline(textContent)).replace(/\[(\d+)\]/, DROPZONE_MARKER)
              const textParts = processedText.split(DROPZONE_MARKER)

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
                    className="text-sm mb-2"
                    data-question-id={questionNumber}
                    ref={(el) => { if (el) questionRefs.current[questionNumber] = el }}
                    style={{ color: 'var(--text-primary)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <span dangerouslySetInnerHTML={{ __html: textParts[0] }} style={{ display: 'inline' }} />
                    <span
                      className="inline-flex items-center justify-center border-2 border-dashed rounded px-2 min-w-[60px] leading-none"
                      style={{
                        borderColor,
                        backgroundColor,
                        borderWidth: '2px'
                      }}
                    >
                      {submittedAnswer ? (
                        <span style={{ color: 'var(--text-primary)' }} className="text-sm font-medium leading-none">{cleanAnswer}</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-bold leading-none">{placeholderNum}</span>
                      )}
                    </span>
                    {textParts[1] && <span dangerouslySetInnerHTML={{ __html: textParts[1] }} style={{ display: 'inline' }} />}
                    {listeningStore.mockId && listeningStore.sectionId && (
                      <QuestionMarkingButtons
                        mockId={listeningStore.mockId}
                        sectionId={listeningStore.sectionId}
                        questionOrd={questionNumber}
                        isCorrect={isCorrect}
                      />
                    )}
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
                  className="text-sm mb-2"
                  data-question-id={questionNumber}
                  ref={(el) => { if (el) questionRefs.current[questionNumber] = el }}
                  style={{ color: 'var(--text-primary)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.25rem' }}
                >
                  <span dangerouslySetInnerHTML={{ __html: textParts[0] }} style={{ display: 'inline' }} />
                  <span
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, question.id)}
                    tabIndex={0}
                    style={{
                      borderColor: answer ? 'var(--primary)' : 'var(--border-color)',
                      backgroundColor: answer ? 'var(--secondary)' : 'transparent'
                    }}
                    className="inline-flex items-center justify-center border-2 border-dashed rounded px-2 min-w-[60px] leading-none"
                  >
                    {answer ? (
                      <span style={{ color: 'var(--text-primary)' }} className="text-sm font-medium leading-none">
                        {cleanAnswer}
                        <button
                          onClick={() => handleRemove(question.id)}
                          style={{ color: 'var(--text-primary)' }}
                          className="hover:opacity-70 transition-opacity text-xs font-bold ml-2"
                        >
                          ✕
                        </button>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }} className="text-xs font-bold leading-none">{placeholderNum}</span>
                    )}
                  </span>
                  {textParts[1] && <span dangerouslySetInnerHTML={{ __html: textParts[1] }} style={{ display: 'inline' }} />}
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
                <button
                  key={index}
                  draggable={!isUsed && !isPreviewMode}
                  onDragStart={!isPreviewMode ? (e) => handleDragStart(e, option) : undefined}
                  disabled={isUsed || isPreviewMode}
                  style={{
                    backgroundColor: isUsed ? 'var(--secondary)' : 'var(--card-background)',
                    borderColor: isUsed ? 'var(--text-secondary)' : 'var(--border-color)',
                    color: isUsed ? 'var(--text-secondary)' : 'var(--text-primary)',
                    textDecoration: isUsed ? 'line-through' : 'none',
                    opacity: isUsed ? 0.5 : 1,
                    boxShadow: !isUsed ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                  }}
                  className={`w-full px-3 py-1.5 border rounded-md text-xs font-medium transition-all ${
                    isUsed
                      ? 'cursor-not-allowed'
                      : isPreviewMode
                      ? 'cursor-default'
                      : 'cursor-move hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex-1 text-left">{cleanOption}</span>
                    {!isUsed && !isPreviewMode && (
                      <svg
                        className="w-3 h-3 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
})

export default SentenceCompletionQuestion

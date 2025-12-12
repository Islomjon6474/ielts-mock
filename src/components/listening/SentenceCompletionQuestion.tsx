'use client'

import { useState, useEffect, useRef } from 'react'
import { Input, Button } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
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
              // Use global regex to replace ALL occurrences of [number] placeholders
              // Handle various encodings: [27], &#91;27&#93;, &lsqb;27&rsqb;, %5B27%5D
              const DROPZONE_MARKER = '__DROPZONE__'
              let processedText = processArrows(convertBlockToInline(textContent))

              // Replace various encodings of [number] with DROPZONE_MARKER
              // Order matters - more specific patterns first
              processedText = processedText
                // Pattern: entire placeholder wrapped in tags, e.g., <strong>[27]</strong> or <span>[27]</span>
                .replace(/<[^>]*>\[(\d+)\]<\/[^>]*>/g, DROPZONE_MARKER)
                // Pattern: brackets and number each in separate tags, e.g., <b>[</b><b>27</b><b>]</b>
                .replace(/<[^>]*>\[<\/[^>]*>\s*<[^>]*>(\d+)<\/[^>]*>\s*<[^>]*>\]<\/[^>]*>/g, DROPZONE_MARKER)
                // Pattern: opening bracket in tag, rest outside, e.g., <b>[</b>27]
                .replace(/<[^>]*>\[<\/[^>]*>\s*(\d+)\s*\]/g, DROPZONE_MARKER)
                // Pattern: closing bracket in tag, e.g., [27<b>]</b>
                .replace(/\[\s*(\d+)\s*<[^>]*>\]<\/[^>]*>/g, DROPZONE_MARKER)
                // Pattern: number in tag with brackets outside: [<strong>27</strong>]
                .replace(/\[<[^>]*>(\d+)<\/[^>]*>\]/g, DROPZONE_MARKER)
                // Standard format [27]
                .replace(/\[(\d+)\]/g, DROPZONE_MARKER)
                // HTML entity encoded &#91;27&#93;
                .replace(/&#91;(\d+)&#93;/g, DROPZONE_MARKER)
                // Named entity &lsqb;27&rsqb;
                .replace(/&lsqb;(\d+)&rsqb;/g, DROPZONE_MARKER)
                // URL encoded %5B27%5D
                .replace(/%5B(\d+)%5D/gi, DROPZONE_MARKER)

              // Fallback: If no marker was inserted but we know there should be a placeholder,
              // try stripping HTML tags and re-matching
              if (!processedText.includes(DROPZONE_MARKER)) {
                const strippedText = processedText.replace(/<[^>]*>/g, '')
                if (strippedText.match(/\[(\d+)\]/)) {
                  // The placeholder exists but is hidden by complex HTML - use stripped version
                  processedText = strippedText.replace(/\[(\d+)\]/g, DROPZONE_MARKER)
                }
              }

              const textParts = processedText.split(DROPZONE_MARKER)

              // If still no split happened but there should be a placeholder, add marker at end
              const shouldHaveDropzone = textContent.includes('[') && textContent.includes(']')
              const hasDropzone = textParts.length > 1

              // Get answer (preview mode uses submitted, normal mode uses current)
              const submittedAnswer = isPreviewMode ? listeningStore.getSubmittedAnswer(question.id) : null
              const isCorrect = isPreviewMode ? listeningStore.isAnswerCorrect(question.id) : null
              const answer = isPreviewMode ? (submittedAnswer as string || '') : (listeningStore.getAnswer(question.id) as string || '')

              // Determine border and background color
              let borderColor = answer ? 'var(--primary)' : 'var(--border-color)'
              let backgroundColor = answer ? 'var(--secondary)' : 'transparent'

              if (isPreviewMode && submittedAnswer) {
                if (isCorrect === true) {
                  borderColor = '#52c41a' // Green for correct
                  backgroundColor = '#f6ffed' // Light green background
                } else if (isCorrect === false) {
                  borderColor = '#ff4d4f' // Red for incorrect
                  backgroundColor = '#fff2f0' // Light red background
                }
              }

              // Get clean answer text for display
              const cleanAnswer = answer ? (() => {
                const tmp = document.createElement('DIV')
                tmp.innerHTML = answer
                return tmp.textContent || tmp.innerText || ''
              })() : ''

              // Render drop zone component
              const renderDropZone = () => (
                <span
                  onDragOver={!isPreviewMode ? handleDragOver : undefined}
                  onDrop={!isPreviewMode ? (e) => handleDrop(e, question.id) : undefined}
                  className="inline-flex items-center gap-1 mx-1"
                >
                  <Input
                    value={cleanAnswer}
                    onChange={(e) => listeningStore.setAnswer(question.id, e.target.value)}
                    placeholder={placeholderNum}
                    className="text-center"
                    style={{
                      width: '120px',
                      backgroundColor,
                      borderColor,
                      borderWidth: '2px',
                      color: 'var(--text-primary)'
                    }}
                    disabled={isPreviewMode}
                  />
                  {answer && !isPreviewMode && (
                    <Button
                      type="text"
                      shape="circle"
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() => handleRemove(question.id)}
                    />
                  )}
                </span>
              )

              return (
                <div
                  key={question.id}
                  className="text-sm mb-2"
                  data-question-id={questionNumber}
                  ref={(el) => { if (el) questionRefs.current[questionNumber] = el }}
                  style={{ color: 'var(--text-primary)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.25rem' }}
                >
                  {/* Render all text parts with drop zones in between */}
                  {textParts.map((part, partIndex) => (
                    <span key={partIndex} style={{ display: 'contents' }}>
                      <span dangerouslySetInnerHTML={{ __html: part }} style={{ display: 'inline' }} />
                      {/* Add drop zone after each part except the last one */}
                      {partIndex < textParts.length - 1 && renderDropZone()}
                    </span>
                  ))}
                  {/* Fallback: if no dropzone was found but should have one, add at end */}
                  {shouldHaveDropzone && !hasDropzone && renderDropZone()}
                  {isPreviewMode && listeningStore.mockId && listeningStore.sectionId && (
                    <QuestionMarkingButtons
                      mockId={listeningStore.mockId}
                      sectionId={listeningStore.sectionId}
                      questionOrd={questionNumber}
                      isCorrect={isCorrect}
                    />
                  )}
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

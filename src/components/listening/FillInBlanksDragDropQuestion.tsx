'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import QuestionMarkingButtons from '@/components/admin/QuestionMarkingButtons'

interface FillInBlanksDragDropQuestionProps {
  questions: any[]
  questionNumbers: number[]
  options: string[] // Array of options like ["popular", "artistic", "completed", ...]
  instruction?: string
  title?: string
  imageUrl?: string
  isPreviewMode?: boolean
}

const FillInBlanksDragDropQuestion = observer(({
  questions,
  questionNumbers,
  options,
  instruction,
  title,
  imageUrl,
  isPreviewMode = false
}: FillInBlanksDragDropQuestionProps) => {
  const { listeningStore } = useStore()
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate letter labels (A, B, C, ...)
  const getLetterLabel = (index: number) => String.fromCharCode(65 + index)

  // Extract letter from full answer text (e.g., "A encouragement" -> "A")
  const extractLetter = (answer: string) => {
    if (!answer) return ''
    // If it's just a single letter, return it
    if (answer.length === 1 && /^[A-Z]$/.test(answer)) return answer
    // Otherwise, extract the first letter
    const match = answer.match(/^([A-Z])\s/)
    return match ? match[1] : answer.charAt(0).toUpperCase()
  }

  useEffect(() => {
    if (isPreviewMode) return

    const currentQuestionNumber = listeningStore.currentQuestionNumber

    if (questionNumbers.includes(currentQuestionNumber) && containerRef.current) {
      setTimeout(() => {
        const dropZone = containerRef.current?.querySelector(`[data-question="${currentQuestionNumber}"]`) as HTMLElement
        if (dropZone) {
          dropZone.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [listeningStore.currentQuestionNumber, questionNumbers, isPreviewMode])

  const handleDragStart = (e: React.DragEvent, option: string, letter: string) => {
    // Check if option letter is already used
    const isUsed = questionNumbers.some(qNum => {
      const answer = listeningStore.getAnswer(qNum) as string
      return extractLetter(answer) === letter
    })

    if (isUsed) {
      e.preventDefault()
      return
    }

    const fullText = `${letter} ${option}`
    setDraggedItem(fullText)
    e.dataTransfer.setData('text/plain', fullText)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, questionId: number) => {
    e.preventDefault()
    const fullText = e.dataTransfer.getData('text/plain') || draggedItem
    if (fullText) {
      listeningStore.setAnswer(questionId, fullText)
    }
    setDraggedItem(null)
  }

  const handleRemove = (questionId: number) => {
    listeningStore.setAnswer(questionId, '')
  }

  // Get all used option letters
  const usedLetters = questionNumbers
    .map(qNum => extractLetter(listeningStore.getAnswer(qNum) as string))
    .filter(Boolean)

  // Get the first question's text which contains all the blanks
  const passageText = questions[0]?.text || ''

  // Check if text contains HTML (from rich text editor)
  const isHtml = passageText.includes('<') && passageText.includes('>')

  // Convert block elements to inline to preserve text flow
  const convertBlockToInline = (html: string) => {
    return html
      .replace(/<p>/gi, '<span>')
      .replace(/<\/p>/gi, '</span> ')
      .replace(/<div>/gi, '<span>')
      .replace(/<\/div>/gi, '</span> ')
      .replace(/<br\s*\/?>/gi, ' ')
  }

  // Parse the passage and replace [37], [38], etc. with drop zones
  const renderPassageWithDropZones = () => {
    // Split by placeholders like [37], [38], etc.
    const DROPZONE_MARKER = '__DROPZONE__'
    // Convert block elements to inline first
    let processedText = convertBlockToInline(passageText)

    // Create a map of placeholder numbers to question IDs
    const placeholderMap: { [key: number]: number } = {}
    questions.forEach((q, idx) => {
      placeholderMap[questionNumbers[idx]] = q.id
    })

    // Find all placeholder numbers in the text (use original passageText for extraction)
    // Handle both plain text [n] format and HTML data-number="n" format
    const placeholderMatches: number[] = []

    // First, try to extract from HTML data-number attributes
    const htmlRegex = /data-number="(\d+)"/g
    let htmlMatch
    while ((htmlMatch = htmlRegex.exec(passageText)) !== null) {
      placeholderMatches.push(parseInt(htmlMatch[1]))
    }

    // Replace HTML placeholder spans with markers in the processed text
    // Handle various attribute orders: data-placeholder can come before or after data-number
    // Pattern 1: data-placeholder comes first
    processedText = processedText.replace(
      /<span[^>]*data-placeholder[^>]*data-number="(\d+)"[^>]*>[^<]*<\/span>/g,
      DROPZONE_MARKER
    )
    // Pattern 2: data-number comes first
    processedText = processedText.replace(
      /<span[^>]*data-number="(\d+)"[^>]*data-placeholder[^>]*>[^<]*<\/span>/g,
      DROPZONE_MARKER
    )

    // If no HTML placeholders found, also check for plain text [n] format
    if (placeholderMatches.length === 0) {
      const plainRegex = /\[(\d+)\]/g
      let plainMatch
      while ((plainMatch = plainRegex.exec(passageText)) !== null) {
        placeholderMatches.push(parseInt(plainMatch[1]))
      }
    }

    // Always try to replace plain text [n] patterns as well (they might exist alongside HTML)
    processedText = processedText.replace(/\[(\d+)\]/g, DROPZONE_MARKER)

    const textParts = processedText.split(DROPZONE_MARKER)

    return (
      <div
        className="leading-relaxed text-base"
        style={{
          color: 'var(--text-primary)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.25rem'
        }}
      >
        {textParts.map((part: string, partIndex: number) => (
          <span key={partIndex} style={{ display: 'contents' }}>
            {/* Render text part with HTML support */}
            <span dangerouslySetInnerHTML={{ __html: part }} style={{ display: 'inline' }} />

            {/* Add drop zone after each part except the last one */}
            {partIndex < textParts.length - 1 && (() => {
              const placeholderNum = placeholderMatches[partIndex]
              const questionId = placeholderMap[placeholderNum] || placeholderNum

              // Get answer (preview mode uses submitted, normal mode uses current)
              const submittedAnswer = isPreviewMode ? listeningStore.getSubmittedAnswer(questionId) : null
              const isCorrect = isPreviewMode ? listeningStore.isAnswerCorrect(questionId) : null
              const answer = isPreviewMode ? (submittedAnswer as string || '') : (listeningStore.getAnswer(questionId) as string || '')

              // Determine styling based on correctness
              let borderColor = answer ? 'var(--primary)' : 'var(--border-color)'
              let backgroundColor = answer ? 'var(--secondary)' : 'transparent'
              let borderStyle = answer ? 'solid' : 'dashed'

              if (isPreviewMode && submittedAnswer) {
                if (isCorrect === true) {
                  borderColor = '#52c41a'
                  backgroundColor = '#f6ffed'
                } else if (isCorrect === false) {
                  borderColor = '#ff4d4f'
                  backgroundColor = '#fff2f0'
                }
              }

              return (
                <span
                  key={`dropzone-${placeholderNum}`}
                  data-question={placeholderNum}
                  onDragOver={!isPreviewMode ? handleDragOver : undefined}
                  onDrop={!isPreviewMode ? (e) => handleDrop(e, questionId) : undefined}
                  className="inline-flex items-center mx-1"
                >
                  <span
                    className="inline-flex items-center justify-center px-2 py-0.5 rounded font-bold text-sm"
                    style={{
                      border: `2px ${borderStyle} ${borderColor}`,
                      backgroundColor,
                      color: answer ? 'var(--text-primary)' : 'var(--text-secondary)',
                      minHeight: '28px',
                      minWidth: answer ? 'auto' : '60px'
                    }}
                  >
                    {answer || placeholderNum}
                  </span>
                  {answer && !isPreviewMode && (
                    <Button
                      type="text"
                      shape="circle"
                      size="small"
                      icon={<CloseOutlined style={{ fontSize: '10px' }} />}
                      onClick={() => handleRemove(questionId)}
                      style={{ marginLeft: '2px', width: '20px', height: '20px', minWidth: '20px' }}
                    />
                  )}
                  {isPreviewMode && listeningStore.mockId && listeningStore.sectionId && (
                    <QuestionMarkingButtons
                      mockId={listeningStore.mockId}
                      sectionId={listeningStore.sectionId}
                      questionOrd={placeholderNum}
                      isCorrect={isCorrect}
                    />
                  )}
                </span>
              )
            })()}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6" ref={containerRef}>
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

      {/* Passage with inline drop zones */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card-background)', border: '1px solid var(--border-color)' }}>
        {renderPassageWithDropZones()}
      </div>

      {/* Options table - 3 columns like in the IELTS exam */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
        <table className="w-full" style={{ backgroundColor: 'var(--card-background)' }}>
          <tbody>
            {/* Render options in rows of 3 */}
            {Array.from({ length: Math.ceil(options.length / 3) }).map((_, rowIndex) => (
              <tr key={rowIndex} style={{ borderBottom: rowIndex < Math.ceil(options.length / 3) - 1 ? '1px solid var(--border-color)' : 'none' }}>
                {[0, 1, 2].map(colIndex => {
                  const optionIndex = rowIndex * 3 + colIndex
                  if (optionIndex >= options.length) {
                    return <td key={colIndex} className="p-3" style={{ borderRight: colIndex < 2 ? '1px solid var(--border-color)' : 'none' }}></td>
                  }

                  const option = options[optionIndex]
                  const letter = getLetterLabel(optionIndex)
                  const isUsed = usedLetters.includes(letter)

                  return (
                    <td
                      key={colIndex}
                      className="p-3"
                      style={{
                        borderRight: colIndex < 2 ? '1px solid var(--border-color)' : 'none',
                        width: '33.33%'
                      }}
                    >
                      <div
                        draggable={!isUsed && !isPreviewMode}
                        onDragStart={!isPreviewMode ? (e) => handleDragStart(e, option, letter) : undefined}
                        className={`flex items-center gap-2 px-2 py-1 rounded transition-all ${
                          isUsed
                            ? 'opacity-50 cursor-not-allowed'
                            : isPreviewMode
                            ? 'cursor-default'
                            : 'cursor-move hover:bg-opacity-80'
                        }`}
                        style={{
                          backgroundColor: isUsed ? 'var(--secondary)' : 'transparent',
                          textDecoration: isUsed ? 'line-through' : 'none'
                        }}
                      >
                        <span
                          className="font-bold text-sm"
                          style={{ color: isUsed ? 'var(--text-secondary)' : 'var(--primary)' }}
                        >
                          {letter}
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: isUsed ? 'var(--text-secondary)' : 'var(--text-primary)' }}
                        >
                          {option}
                        </span>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

export default FillInBlanksDragDropQuestion

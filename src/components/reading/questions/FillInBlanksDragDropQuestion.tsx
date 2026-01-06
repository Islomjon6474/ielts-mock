'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import QuestionMarkingButtons from '@/components/admin/QuestionMarkingButtons'

interface FillInBlanksDragDropQuestionProps {
  questions: Question[]
  questionNumbers: number[]
  options: string[] // Array of options like ["popular", "artistic", "completed", ...]
  imageUrl?: string
}

const FillInBlanksDragDropQuestion = observer(({
  questions,
  questionNumbers,
  options,
  imageUrl
}: FillInBlanksDragDropQuestionProps) => {
  const { readingStore } = useStore()
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate letter labels (A, B, C, ...)
  const getLetterLabel = (index: number) => String.fromCharCode(65 + index)

  // Create a map of letter to full display text (e.g., "A" -> "A encouragement")
  const getFullOptionText = (letter: string) => {
    const index = letter.charCodeAt(0) - 65
    if (index >= 0 && index < options.length) {
      return `${letter} ${options[index]}`
    }
    return letter
  }

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
    if (readingStore.isPreviewMode) return

    const currentQuestionNumber = readingStore.parts[readingStore.currentPart - 1]?.questionRange[0] + readingStore.currentQuestionIndex

    if (questionNumbers.includes(currentQuestionNumber) && containerRef.current) {
      setTimeout(() => {
        const dropZone = containerRef.current?.querySelector(`[data-question="${currentQuestionNumber}"]`) as HTMLElement
        if (dropZone) {
          dropZone.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [readingStore.currentQuestionIndex, readingStore.currentPart, questionNumbers, readingStore.isPreviewMode])

  const handleDragStart = (e: React.DragEvent, option: string, letter: string) => {
    // Check if option letter is already used
    const isUsed = questionNumbers.some(qNum => {
      const answer = readingStore.getAnswer(qNum) as string
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
      readingStore.setAnswer(questionId, fullText)
    }
    setDraggedItem(null)
  }

  const handleRemove = (questionId: number) => {
    readingStore.setAnswer(questionId, '')
  }

  // Get all used option letters
  const usedLetters = questionNumbers
    .map(qNum => extractLetter(readingStore.getAnswer(qNum) as string))
    .filter(Boolean)

  // Get the first question's text which contains all the blanks
  const passageText = questions[0]?.text || ''

  // Parse the passage and replace [37], [38], etc. with drop zones
  const renderPassageWithDropZones = () => {
    // Split by placeholders like [37], [38], etc.
    const DROPZONE_MARKER = '__DROPZONE__'
    let processedText = passageText

    // Create a map of placeholder numbers to question IDs
    const placeholderMap: { [key: number]: number } = {}
    questions.forEach((q, idx) => {
      placeholderMap[questionNumbers[idx]] = q.id
    })

    // Find all placeholder numbers in the text
    const placeholderMatches: number[] = []
    const regex = /\[(\d+)\]/g
    let match
    while ((match = regex.exec(passageText)) !== null) {
      placeholderMatches.push(parseInt(match[1]))
    }

    // Replace placeholders with markers
    processedText = processedText.replace(/\[(\d+)\]/g, DROPZONE_MARKER)

    const textParts = processedText.split(DROPZONE_MARKER)

    return (
      <div className="leading-relaxed text-base" style={{ color: 'var(--text-primary)' }}>
        {textParts.map((part: string, partIndex: number) => (
          <span key={partIndex}>
            {/* Render text part with HTML support */}
            <span dangerouslySetInnerHTML={{ __html: part }} />

            {/* Add drop zone after each part except the last one */}
            {partIndex < textParts.length - 1 && (() => {
              const placeholderNum = placeholderMatches[partIndex]
              const questionId = placeholderMap[placeholderNum] || placeholderNum
              const answer = readingStore.getAnswer(questionId) as string || ''

              // In preview mode, get submitted answer
              const submittedAnswer = readingStore.isPreviewMode ? readingStore.getSubmittedAnswer(questionId) : null
              const isCorrect = readingStore.isPreviewMode ? readingStore.isAnswerCorrect(questionId) : null
              const displayAnswer = readingStore.isPreviewMode ? (submittedAnswer as string || '') : answer

              // Determine styling based on correctness
              let borderColor = displayAnswer ? 'var(--primary)' : 'var(--border-color)'
              let backgroundColor = displayAnswer ? 'var(--secondary)' : 'transparent'
              let borderStyle = displayAnswer ? 'solid' : 'dashed'

              if (readingStore.isPreviewMode && submittedAnswer) {
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
                  onDragOver={!readingStore.isPreviewMode ? handleDragOver : undefined}
                  onDrop={!readingStore.isPreviewMode ? (e) => handleDrop(e, questionId) : undefined}
                  className="inline-flex items-center mx-1"
                >
                  <span
                    className="inline-flex items-center justify-center px-2 py-0.5 rounded font-bold text-sm"
                    style={{
                      border: `2px ${borderStyle} ${borderColor}`,
                      backgroundColor,
                      color: displayAnswer ? 'var(--text-primary)' : 'var(--text-secondary)',
                      minHeight: '28px',
                      minWidth: displayAnswer ? 'auto' : '60px'
                    }}
                  >
                    {displayAnswer || placeholderNum}
                  </span>
                  {displayAnswer && !readingStore.isPreviewMode && (
                    <Button
                      type="text"
                      shape="circle"
                      size="small"
                      icon={<CloseOutlined style={{ fontSize: '10px' }} />}
                      onClick={() => handleRemove(questionId)}
                      style={{ marginLeft: '2px', width: '20px', height: '20px', minWidth: '20px' }}
                    />
                  )}
                  {readingStore.isPreviewMode && readingStore.mockId && readingStore.sectionId && (
                    <QuestionMarkingButtons
                      mockId={readingStore.mockId}
                      sectionId={readingStore.sectionId}
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
                        draggable={!isUsed && !readingStore.isPreviewMode}
                        onDragStart={!readingStore.isPreviewMode ? (e) => handleDragStart(e, option, letter) : undefined}
                        className={`flex items-center gap-2 px-2 py-1 rounded transition-all ${
                          isUsed
                            ? 'opacity-50 cursor-not-allowed'
                            : readingStore.isPreviewMode
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

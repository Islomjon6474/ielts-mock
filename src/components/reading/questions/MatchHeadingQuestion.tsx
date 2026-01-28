'use client'

import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'
import QuestionMarkingButtons from '@/components/admin/QuestionMarkingButtons'

interface MatchHeadingQuestionProps {
  questions: Question[]
  questionNumbers: number[]
  headings: string[]
  isPreviewMode?: boolean
}

const MatchHeadingQuestion = observer(({ 
  questions, 
  questionNumbers,
  headings,
  isPreviewMode = false
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

    document.body.classList.add('ielts-dragging')
    setDraggedItem(heading)
    e.dataTransfer.setData('heading', heading)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    document.body.classList.remove('ielts-dragging')
    setDraggedItem(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, questionId: number) => {
    e.preventDefault()
    document.body.classList.remove('ielts-dragging')
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

            // In preview mode, get submitted answer for styling
            const submittedAnswer = readingStore.isPreviewMode ? readingStore.getSubmittedAnswer(question.id) : null
            const isCorrect = readingStore.isPreviewMode ? readingStore.isAnswerCorrect(question.id) : null

            // Use submitted answer in preview mode, otherwise use current answer
            const displayAnswer = readingStore.isPreviewMode ? (submittedAnswer as string || '') : answer

            // Parse the text to extract the section and placeholder
            const textContent = question.text
            const placeholderMatch = textContent.match(/\[(\d+)\]/)
            const placeholderNum = placeholderMatch ? placeholderMatch[1] : questionNumber.toString()

            const cleanText = stripHtml(textContent)
            const parts = cleanText.split(`[${placeholderNum}]`)

            // Get clean answer text if answer exists
            const cleanAnswer = displayAnswer ? stripHtml(displayAnswer) : ''

            // Determine border color based on correctness
            let cardBorderColor = 'var(--border-color)'
            let cardBorderWidth = '2px'

            if (readingStore.isPreviewMode && submittedAnswer) {
              if (isCorrect === true) {
                cardBorderColor = '#52c41a' // Green for correct
              } else if (isCorrect === false) {
                cardBorderColor = '#ff4d4f' // Red for incorrect
              }
            }

            return (
              <div key={question.id} className="border-2 rounded-lg p-4" style={{ borderColor: cardBorderColor, backgroundColor: 'var(--card-background)', borderWidth: cardBorderWidth }}>
                <div className="text-sm mb-3">
                  <div
                    className="prose prose-sm max-w-none"
                    style={{ color: 'var(--text-primary)' }}
                    dangerouslySetInnerHTML={{ __html: parts[0] || cleanText }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <strong className="text-sm" style={{ color: 'var(--text-primary)' }}>{questionNumber}.</strong>
                  <div
                    onDragOver={!isPreviewMode ? handleDragOver : undefined}
                    onDrop={!isPreviewMode ? (e) => handleDrop(e, question.id) : undefined}
                    className="flex-1 border-2 border-dashed rounded px-4 py-3 min-h-[50px] flex items-center"
                    style={{
                      borderColor: displayAnswer ? '#60a5fa' : 'var(--border-color)',
                      backgroundColor: displayAnswer ? '#dbeafe' : 'transparent'
                    }}
                  >
                    {displayAnswer ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cleanAnswer}</span>
                        {!isPreviewMode && (
                          <button
                            onClick={() => handleRemove(question.id)}
                            className="text-sm font-bold ml-2"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Drag heading here</span>
                    )}
                  </div>
                  {readingStore.isPreviewMode && readingStore.mockId && readingStore.sectionId && (
                    <QuestionMarkingButtons
                      mockId={readingStore.mockId}
                      sectionId={readingStore.sectionId}
                      questionOrd={questionNumber}
                      isCorrect={isCorrect}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Headings Section */}
      <div>
        <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Available Headings</h4>
        <div className="grid grid-cols-1 gap-3">
          {headings.map((heading, index) => {
            const isUsed = usedHeadings.includes(heading)
            const cleanHeading = stripHtml(heading)

            return (
              <div
                key={index}
                draggable={!isUsed && !isPreviewMode}
                onDragStart={!isPreviewMode ? (e) => handleDragStart(e, heading) : undefined}
                onDragEnd={handleDragEnd}
                className="px-4 py-3 border-2 rounded-md text-sm transition-all shadow-sm"
                style={{
                  backgroundColor: isUsed ? '#d1d5db' : 'var(--card-background)',
                  color: isUsed ? '#6b7280' : 'var(--text-primary)',
                  borderColor: isUsed ? '#9ca3af' : 'var(--border-color)',
                  cursor: isUsed ? 'not-allowed' : isPreviewMode ? 'default' : 'move',
                  textDecoration: isUsed ? 'line-through' : 'none'
                }}
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

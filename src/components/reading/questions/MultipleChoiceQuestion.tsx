'use client'

import { useEffect, useRef } from 'react'
import { Checkbox, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'

interface MultipleChoiceQuestionProps {
  question: Question
  questionNumber: number
}

const MultipleChoiceQuestion = observer(({ question, questionNumber }: MultipleChoiceQuestionProps) => {
  const { readingStore } = useStore()
  const answer = (readingStore.getAnswer(question.id) as string[]) || []
  const maxAnswers = question.maxAnswers || 2
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only focus if not in preview mode
    if (readingStore.isPreviewMode) return
    
    const currentQuestionNumber = readingStore.parts[readingStore.currentPart - 1]?.questionRange[0] + readingStore.currentQuestionIndex
    if (currentQuestionNumber === questionNumber && containerRef.current) {
      setTimeout(() => {
        const checkbox = containerRef.current?.querySelector('input[type="checkbox"]:not([disabled])') as HTMLInputElement
        if (checkbox) {
          checkbox.focus()
        }
      }, 100)
    }
  }, [readingStore.currentQuestionIndex, readingStore.currentPart, questionNumber, readingStore.isPreviewMode])

  const handleChange = (checkedValues: string[]) => {
    // Limit to max answers
    if (checkedValues.length <= maxAnswers) {
      readingStore.setAnswer(question.id, checkedValues)
    }
  }

  // In preview mode, get submitted answer for styling
  const submittedAnswer = readingStore.isPreviewMode ? readingStore.getSubmittedAnswer(question.id) : null
  const isCorrect = readingStore.isPreviewMode ? readingStore.isAnswerCorrect(question.id) : null
  const displayAnswer = readingStore.isPreviewMode && submittedAnswer ? (Array.isArray(submittedAnswer) ? submittedAnswer : [submittedAnswer]) : answer

  return (
    <Card
      className="mb-4"
      ref={containerRef}
      style={{
        backgroundColor: 'var(--card-background)',
        borderColor: readingStore.isPreviewMode && submittedAnswer ?
          (isCorrect ? '#52c41a' : '#ff4d4f') :
          'var(--border-color)',
        borderWidth: readingStore.isPreviewMode && submittedAnswer ? '2px' : '1px'
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="mb-4 font-medium" style={{ color: 'var(--text-primary)' }}><strong>{questionNumber}</strong> {question.text}</p>

          {/* Display image if available */}
          {question.imageUrl && (
            <div className="mb-4">
              <AuthenticatedImage
                src={question.imageUrl}
                alt={`Question ${questionNumber} image`}
                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                className="rounded border"
              />
            </div>
          )}

          <Checkbox.Group
            value={displayAnswer}
            onChange={(checkedValues) => handleChange(checkedValues as string[])}
            className="w-full"
            disabled={readingStore.isPreviewMode}
          >
            <div className="space-y-3">
              {question.options?.map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index) // A, B, C, D...
                return (
                  <div key={index} className="block">
                    <Checkbox
                      value={option}
                      disabled={readingStore.isPreviewMode || (!answer.includes(option) && answer.length >= maxAnswers)}
                      className="whitespace-normal"
                    >
                      <span className="font-semibold mr-2" style={{ color: 'var(--text-primary)' }}>{optionLabel}.</span>
                      <span style={{ color: 'var(--text-primary)' }}>{option}</span>
                    </Checkbox>
                  </div>
                )
              })}
            </div>
          </Checkbox.Group>

          <div className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Selected: {displayAnswer.length} / {maxAnswers}
          </div>
        </div>
      </div>
    </Card>
  )
})

export default MultipleChoiceQuestion

'use client'

import { useEffect, useRef } from 'react'
import { Checkbox, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import QuestionMarkingButtons from '@/components/admin/QuestionMarkingButtons'

interface MultipleChoiceQuestionProps {
  question: any
  questionNumber: number
  isPreviewMode?: boolean
}

const MultipleChoiceQuestion = observer(({ question, questionNumber, isPreviewMode = false }: MultipleChoiceQuestionProps) => {
  const { listeningStore } = useStore()
  const answer = (listeningStore.getAnswer(question.id) as string[]) || []
  const maxAnswers = question.maxAnswers || 2
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentQuestionNumber = listeningStore.currentQuestionNumber
    if (currentQuestionNumber === questionNumber && containerRef.current) {
      setTimeout(() => {
        const checkbox = containerRef.current?.querySelector('input[type="checkbox"]') as HTMLInputElement
        if (checkbox) {
          checkbox.focus()
        }
      }, 100)
    }
  }, [listeningStore.currentQuestionNumber, questionNumber])

  const handleChange = (checkedValues: string[]) => {
    // Limit to max answers
    if (checkedValues.length <= maxAnswers) {
      listeningStore.setAnswer(question.id, checkedValues)
    }
  }

  // In preview mode, get submitted answer for styling
  const submittedAnswer = isPreviewMode ? listeningStore.getSubmittedAnswer(question.id) : null
  const isCorrect = isPreviewMode ? listeningStore.isAnswerCorrect(question.id) : null
  const displayAnswer = isPreviewMode && submittedAnswer ? (Array.isArray(submittedAnswer) ? submittedAnswer : [submittedAnswer]) : answer

  return (
    <Card
      className="mb-4"
      ref={containerRef}
      style={{
        backgroundColor: 'var(--card-background)',
        borderColor: isPreviewMode && submittedAnswer ?
          (isCorrect ? '#52c41a' : '#ff4d4f') :
          'var(--border-color)',
        borderWidth: isPreviewMode && submittedAnswer ? '2px' : '1px'
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p style={{ color: 'var(--text-primary)' }} className="mb-3 font-medium text-sm"><strong>{questionNumber}</strong> {question.text}</p>

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
            disabled={isPreviewMode}
          >
            <div className="space-y-2">
              {question.options?.map((option: string, index: number) => {
                const optionLabel = String.fromCharCode(65 + index) // A, B, C, D...
                return (
                  <div key={index} className="block">
                    <Checkbox
                      value={option}
                      disabled={isPreviewMode || (!answer.includes(option) && answer.length >= maxAnswers)}
                      className="whitespace-normal"
                    >
                      <span className="font-semibold mr-2">{optionLabel}.</span>
                      <span className="text-sm">{option}</span>
                    </Checkbox>
                  </div>
                )
              })}
            </div>
          </Checkbox.Group>

          <div style={{ color: 'var(--text-secondary)' }} className="mt-2 text-xs">
            Selected: {displayAnswer.length} / {maxAnswers}
          </div>
        </div>
        {isPreviewMode && listeningStore.mockId && listeningStore.sectionId && (
          <QuestionMarkingButtons
            mockId={listeningStore.mockId}
            sectionId={listeningStore.sectionId}
            questionOrd={questionNumber}
            isCorrect={isCorrect}
          />
        )}
      </div>
    </Card>
  )
})

export default MultipleChoiceQuestion

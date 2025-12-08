'use client'

import { useEffect, useRef } from 'react'
import { Checkbox, Card, Divider } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import QuestionMarkingButtons from '@/components/admin/QuestionMarkingButtons'

interface MultipleQuestionsMultipleChoiceQuestionProps {
  question: Question
  questionNumber: number
  questionRange?: [number, number] // e.g., [10, 14]
}

const MultipleQuestionsMultipleChoiceQuestion = observer(({ question, questionNumber, questionRange }: MultipleQuestionsMultipleChoiceQuestionProps) => {
  const { readingStore } = useStore()
  const maxAnswers = question.maxAnswers || 2
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate all question numbers in the range
  const questionNumbers = questionRange
    ? Array.from({ length: questionRange[1] - questionRange[0] + 1 }, (_, i) => questionRange[0] + i)
    : [questionNumber]

  console.log('✅ MULTIPLE_QUESTIONS_MULTIPLE_CHOICE Rendering:', {
    questionRange,
    questionNumbers,
    hasOptions: !!question?.options,
    options: question?.options
  })

  // Get answer from the FIRST question (all questions share the same answer)
  const firstQuestionNum = questionNumbers[0]
  const answer = (readingStore.getAnswer(firstQuestionNum) as string[]) || []

  useEffect(() => {
    // Only focus if not in preview mode
    if (readingStore.isPreviewMode) return

    const currentQuestionNumber = readingStore.parts[readingStore.currentPart - 1]?.questionRange[0] + readingStore.currentQuestionIndex
    if (questionNumbers.includes(currentQuestionNumber) && containerRef.current) {
      setTimeout(() => {
        const checkbox = containerRef.current?.querySelector('input[type="checkbox"]:not([disabled])') as HTMLInputElement
        if (checkbox) {
          checkbox.focus()
        }
      }, 100)
    }
  }, [readingStore.currentQuestionIndex, readingStore.currentPart, questionNumbers, readingStore.isPreviewMode])

  const handleChange = (checkedValues: string[]) => {
    // No limit - user can select as many options as they want
    // Save the SAME answer for ALL questions in the range
    questionNumbers.forEach(qNum => {
      readingStore.setAnswer(qNum, checkedValues)
    })
  }

  // In preview mode, check the first question
  const submittedAnswer = readingStore.isPreviewMode ? readingStore.getSubmittedAnswer(firstQuestionNum) : null
  const isCorrect = readingStore.isPreviewMode ? readingStore.isAnswerCorrect(firstQuestionNum) : null
  const displayAnswer = readingStore.isPreviewMode && submittedAnswer
    ? (Array.isArray(submittedAnswer) ? submittedAnswer : [submittedAnswer])
    : answer

  return (
    <Card
      className="mb-4"
      ref={containerRef}
      style={{
        backgroundColor: 'var(--card-background)',
        borderColor: readingStore.isPreviewMode && submittedAnswer
          ? (isCorrect ? '#52c41a' : '#ff4d4f')
          : 'var(--border-color)',
        borderWidth: readingStore.isPreviewMode && submittedAnswer ? '2px' : '1px'
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="mb-4 font-medium" style={{ color: 'var(--text-primary)' }}>
            <strong>Questions {questionNumbers[0]}-{questionNumbers[questionNumbers.length - 1]}</strong>
          </p>

          {/* Display image if available */}
          {question.imageUrl && (
            <div className="mb-4">
              <AuthenticatedImage
                src={question.imageUrl}
                alt={`Questions ${questionNumbers[0]}-${questionNumbers[questionNumbers.length - 1]} image`}
                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                className="rounded border"
              />
            </div>
          )}

          {/* Display instruction/passage if available */}
          {question.text && (
            <div className="mb-4 p-3 bg-gray-50 rounded" style={{ borderLeft: '3px solid var(--primary-color)' }}>
              <div style={{ color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: question.text }} />
            </div>
          )}

          {/* Display options once */}
          {!question?.options || question.options.length === 0 ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600 font-semibold">Error: No options defined for this question</p>
              <p className="text-sm text-red-500 mt-2">Please configure the options in the admin panel.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Options:</h4>
                <div className="space-y-2">
                  {question.options?.map((option, index) => {
                    const optionLabel = String.fromCharCode(65 + index) // A, B, C, D...
                    return (
                      <div key={index} className="flex items-start">
                        <span className="font-semibold mr-2" style={{ color: 'var(--text-primary)', minWidth: '24px' }}>{optionLabel}.</span>
                        <span style={{ color: 'var(--text-primary)' }}>{option}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Divider style={{ margin: '16px 0' }}>Select your answers (applies to all questions {questionNumbers[0]}-{questionNumbers[questionNumbers.length - 1]})</Divider>

              {/* Single checkbox group - same answer for all questions */}
              <Checkbox.Group
                value={displayAnswer}
                onChange={(checkedValues) => handleChange(checkedValues as string[])}
                disabled={readingStore.isPreviewMode}
                className="w-full"
              >
                <div className="flex flex-wrap gap-3">
                  {question.options?.map((option, index) => {
                    const optionLabel = String.fromCharCode(65 + index) // A, B, C, D...
                    return (
                      <Checkbox
                        key={index}
                        value={option}
                        disabled={readingStore.isPreviewMode}
                      >
                        <span className="font-semibold">{optionLabel}</span>
                      </Checkbox>
                    )
                  })}
                </div>
              </Checkbox.Group>

              <div className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Selected: {displayAnswer.length} option{displayAnswer.length !== 1 ? 's' : ''}
              </div>

              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  <strong>Note:</strong> Your selected answers will be applied to ALL questions ({questionNumbers.join(', ')})
                </p>
              </div>
            </>
          )}
        </div>
        {readingStore.isPreviewMode && readingStore.mockId && readingStore.sectionId && (
          <QuestionMarkingButtons
            mockId={readingStore.mockId}
            sectionId={readingStore.sectionId}
            questionOrd={firstQuestionNum}
            isCorrect={isCorrect}
          />
        )}
      </div>
    </Card>
  )
})

export default MultipleQuestionsMultipleChoiceQuestion

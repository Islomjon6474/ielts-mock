'use client'

import { useEffect, useRef } from 'react'
import { Checkbox } from 'antd'
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
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate all question numbers in the range
  const questionNumbers = questionRange
    ? Array.from({ length: questionRange[1] - questionRange[0] + 1 }, (_, i) => questionRange[0] + i)
    : [questionNumber]

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

  const handleChange = (option: string, checked: boolean) => {
    let newAnswer: string[]
    if (checked) {
      newAnswer = [...answer, option]
    } else {
      newAnswer = answer.filter(a => a !== option)
    }
    // Save the SAME answer for ALL questions in the range
    questionNumbers.forEach(qNum => {
      readingStore.setAnswer(qNum, newAnswer)
    })
  }

  // In preview mode, check the first question
  const submittedAnswer = readingStore.isPreviewMode ? readingStore.getSubmittedAnswer(firstQuestionNum) : null
  const isCorrect = readingStore.isPreviewMode ? readingStore.isAnswerCorrect(firstQuestionNum) : null
  const displayAnswer = readingStore.isPreviewMode && submittedAnswer
    ? (Array.isArray(submittedAnswer) ? submittedAnswer : [submittedAnswer])
    : answer

  return (
    <div
      ref={containerRef}
      style={{ color: 'var(--text-primary)' }}
    >
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

      {/* Display instruction/question text with HTML rendering */}
      {question.text && (
        <div
          className="mb-4 text-sm leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
          dangerouslySetInnerHTML={{ __html: question.text }}
        />
      )}

      {/* Options as vertical checkbox list */}
      {!question?.options || question.options.length === 0 ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600 font-semibold">Error: No options defined for this question</p>
          <p className="text-sm text-red-500 mt-2">Please configure the options in the admin panel.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {question.options?.map((option, index) => {
            const isChecked = displayAnswer.includes(option)

            return (
              <label
                key={index}
                className="flex items-start gap-3 cursor-pointer group"
                style={{ opacity: readingStore.isPreviewMode ? 0.9 : 1 }}
              >
                <Checkbox
                  checked={isChecked}
                  onChange={(e) => handleChange(option, e.target.checked)}
                  disabled={readingStore.isPreviewMode}
                  className="mt-0.5"
                />
                <span
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {option}
                </span>
              </label>
            )
          })}
        </div>
      )}

      {/* Preview mode marking buttons */}
      {readingStore.isPreviewMode && readingStore.mockId && readingStore.sectionId && (
        <div className="mt-4 flex justify-end">
          <QuestionMarkingButtons
            mockId={readingStore.mockId}
            sectionId={readingStore.sectionId}
            questionOrd={firstQuestionNum}
            isCorrect={isCorrect}
          />
        </div>
      )}
    </div>
  )
})

export default MultipleQuestionsMultipleChoiceQuestion

'use client'

import { useEffect, useRef } from 'react'
import { Checkbox } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import QuestionMarkingButtons from '@/components/admin/QuestionMarkingButtons'

interface MultipleQuestionsMultipleChoiceQuestionProps {
  question: any
  questionNumber: number
  questionRange?: [number, number] // e.g., [10, 14]
  isPreviewMode?: boolean
}

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

const MultipleQuestionsMultipleChoiceQuestion = observer(({ question, questionNumber, questionRange, isPreviewMode = false }: MultipleQuestionsMultipleChoiceQuestionProps) => {
  const { listeningStore } = useStore()
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate all question numbers in the range
  const questionNumbers = questionRange
    ? Array.from({ length: questionRange[1] - questionRange[0] + 1 }, (_, i) => questionRange[0] + i)
    : [questionNumber]

  // Get all selected options (letter labels) by collecting answers from each question in range
  const selectedLabels: string[] = []
  questionNumbers.forEach(qNum => {
    const ans = listeningStore.getAnswer(qNum) as string
    if (ans && typeof ans === 'string' && ans.trim()) {
      selectedLabels.push(ans)
    }
  })

  useEffect(() => {
    const currentQuestionNumber = listeningStore.currentQuestionNumber
    if (questionNumbers.includes(currentQuestionNumber) && containerRef.current) {
      setTimeout(() => {
        const checkbox = containerRef.current?.querySelector('input[type="checkbox"]') as HTMLInputElement
        if (checkbox) {
          checkbox.focus()
        }
      }, 100)
    }
  }, [listeningStore.currentQuestionNumber, questionNumbers])

  const handleChange = (optionIndex: number, checked: boolean) => {
    const optionLabel = OPTION_LABELS[optionIndex]

    let newSelectedLabels: string[]
    if (checked) {
      // Add the new label and sort alphabetically
      newSelectedLabels = [...selectedLabels, optionLabel].sort()
    } else {
      newSelectedLabels = selectedLabels.filter(a => a !== optionLabel)
    }

    // Distribute answers: Q3 gets first label, Q4 gets second label, etc.
    // Each question gets ONE answer (letter label)
    questionNumbers.forEach((qNum, idx) => {
      const answerForThisQuestion = newSelectedLabels[idx] || ''
      listeningStore.setAnswer(qNum, answerForThisQuestion)
    })
  }

  // In preview mode, collect submitted answers from all questions
  const getPreviewLabels = (): string[] => {
    if (!isPreviewMode) return selectedLabels
    const labels: string[] = []
    questionNumbers.forEach(qNum => {
      const ans = listeningStore.getSubmittedAnswer(qNum) as string
      if (ans && typeof ans === 'string' && ans.trim()) {
        labels.push(ans)
      }
    })
    return labels
  }
  const displayLabels = getPreviewLabels()

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
          {question.options?.map((optionText: string, index: number) => {
            const optionLabel = OPTION_LABELS[index]
            const isChecked = displayLabels.includes(optionLabel)

            return (
              <label
                key={index}
                className="flex items-start gap-3 cursor-pointer group"
                style={{ opacity: isPreviewMode ? 0.9 : 1 }}
              >
                <Checkbox
                  checked={isChecked}
                  onChange={(e) => handleChange(index, e.target.checked)}
                  disabled={isPreviewMode}
                  className="mt-0.5"
                />
                <span
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {optionText}
                </span>
              </label>
            )
          })}
        </div>
      )}

      {/* Preview mode marking buttons for each question in range */}
      {isPreviewMode && listeningStore.mockId && listeningStore.sectionId && (
        <div className="mt-4 space-y-2">
          {questionNumbers.map(qNum => (
            <div key={qNum} className="flex items-center justify-between">
              <span className="text-sm font-medium">Q{qNum}: {listeningStore.getSubmittedAnswer(qNum) || '-'}</span>
              <QuestionMarkingButtons
                mockId={listeningStore.mockId!}
                sectionId={listeningStore.sectionId!}
                questionOrd={qNum}
                isCorrect={listeningStore.isAnswerCorrect(qNum)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

export default MultipleQuestionsMultipleChoiceQuestion

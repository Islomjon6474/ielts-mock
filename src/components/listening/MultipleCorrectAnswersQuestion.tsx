'use client'

import { Input } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'

interface MultipleCorrectAnswersQuestionProps {
  question: any
  questionNumber: number
  isPreviewMode?: boolean
}

const MultipleCorrectAnswersQuestion = observer(({
  question,
  questionNumber,
  isPreviewMode = false
}: MultipleCorrectAnswersQuestionProps) => {
  const { listeningStore } = useStore()

  // Handle answer change
  const handleAnswerChange = (value: string) => {
    listeningStore.setAnswer(questionNumber, value)
  }

  // Parse HTML content if the question text contains HTML
  const isHtml = question.text.includes('<') && question.text.includes('>')

  // In preview mode with submitted answers, show submitted answer with correctness styling
  if (isPreviewMode) {
    const submittedAnswer = listeningStore.getSubmittedAnswer(questionNumber)
    const isCorrect = listeningStore.isAnswerCorrect(questionNumber)

    // Determine border and background color based on correctness
    let borderColor = 'var(--input-border)'
    let backgroundColor = 'var(--input-background)'

    if (submittedAnswer) {
      if (isCorrect === true) {
        borderColor = '#52c41a' // Green for correct
        backgroundColor = '#f6ffed' // Light green background
      } else if (isCorrect === false) {
        borderColor = '#ff4d4f' // Red for incorrect
        backgroundColor = '#fff2f0' // Light red background
      }
    }

    return (
      <div className="border-b pb-4 mb-4" data-question-id={questionNumber}>
        <div className="space-y-3">
          {/* Display image if available */}
          {question.imageUrl && (
            <div className="mb-3">
              <AuthenticatedImage
                src={question.imageUrl}
                alt={`Question ${questionNumber} image`}
                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                className="rounded border"
              />
            </div>
          )}

          {/* Question text */}
          <div className="mb-3">
            <span className="font-semibold mr-2">{questionNumber}.</span>
            {isHtml ? (
              <span dangerouslySetInnerHTML={{ __html: question.text }} />
            ) : (
              <span>{question.text}</span>
            )}
          </div>

          {/* Answer input - disabled in preview */}
          <div className="flex items-center gap-3">
            <span className="text-gray-600 text-sm font-medium">Your answer:</span>
            <Input
              className="flex-1 max-w-md"
              placeholder="Type your answer here"
              value={submittedAnswer as string || ''}
              style={{
                backgroundColor,
                borderColor,
                borderWidth: '2px',
                color: 'var(--text-primary)'
              }}
              disabled={true}
            />
          </div>
        </div>
      </div>
    )
  }

  // Normal mode - editable
  const currentAnswer = listeningStore.getAnswer(questionNumber) as string | undefined

  return (
    <div className="border-b pb-4 mb-4" data-question-id={questionNumber}>
      <div className="space-y-3">
        {/* Display image if available */}
        {question.imageUrl && (
          <div className="mb-3">
            <AuthenticatedImage
              src={question.imageUrl}
              alt={`Question ${questionNumber} image`}
              style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
              className="rounded border"
            />
          </div>
        )}

        {/* Question text */}
        <div className="mb-3">
          <span className="font-semibold mr-2">{questionNumber}.</span>
          {isHtml ? (
            <span dangerouslySetInnerHTML={{ __html: question.text }} />
          ) : (
            <span>{question.text}</span>
          )}
        </div>

        {/* Answer input */}
        <div className="flex items-center gap-3">
          <span className="text-gray-600 text-sm font-medium">Your answer:</span>
          <Input
            className="flex-1 max-w-md"
            placeholder="Type your answer here"
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            disabled={false}
          />
        </div>
      </div>
    </div>
  )
})

export default MultipleCorrectAnswersQuestion

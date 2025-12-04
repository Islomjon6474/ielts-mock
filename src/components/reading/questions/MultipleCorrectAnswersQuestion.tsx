'use client'

import { Input, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import QuestionMarkingButtons from '@/components/admin/QuestionMarkingButtons'

interface MultipleCorrectAnswersQuestionProps {
  question: Question
  questionNumber: number
}

const MultipleCorrectAnswersQuestion = observer(({
  question,
  questionNumber
}: MultipleCorrectAnswersQuestionProps) => {
  const { readingStore } = useStore()

  // Get the current answer for this question
  const currentAnswer = readingStore.getAnswer(questionNumber) as string | undefined

  // Handle answer change
  const handleAnswerChange = (value: string) => {
    readingStore.setAnswer(questionNumber, value)
  }

  // Parse HTML content if the question text contains HTML
  const isHtml = question.text.includes('<') && question.text.includes('>')

  // In preview mode, get submitted answer for styling
  const submittedAnswer = readingStore.isPreviewMode ? readingStore.getSubmittedAnswer(questionNumber) : null
  const isCorrect = readingStore.isPreviewMode ? readingStore.isAnswerCorrect(questionNumber) : null

  // Determine border and background color based on correctness
  let borderColor = 'var(--input-border)'
  let backgroundColor = 'var(--input-background)'

  if (readingStore.isPreviewMode && submittedAnswer) {
    if (isCorrect === true) {
      borderColor = '#52c41a' // Green for correct
      backgroundColor = '#f6ffed' // Light green background
    } else if (isCorrect === false) {
      borderColor = '#ff4d4f' // Red for incorrect
      backgroundColor = '#fff2f0' // Light red background
    }
  }

  return (
    <Card className="mb-4" style={{ backgroundColor: 'var(--card-background)', borderColor: 'var(--border-color)' }}>
      <div className="space-y-4">
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

        {/* Question text */}
        <div className="mb-4">
          <span className="font-semibold mr-2" style={{ color: 'var(--text-primary)' }}>{questionNumber}.</span>
          {isHtml ? (
            <span dangerouslySetInnerHTML={{ __html: question.text }} style={{ color: 'var(--text-primary)' }} />
          ) : (
            <span style={{ color: 'var(--text-primary)' }}>{question.text}</span>
          )}
        </div>

        {/* Answer input */}
        <div className="flex items-center gap-3">
          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Your answer:</span>
          <Input
            className="flex-1 max-w-md"
            placeholder="Type your answer here"
            value={readingStore.isPreviewMode ? (submittedAnswer as string || '') : (currentAnswer || '')}
            onChange={(e) => handleAnswerChange(e.target.value)}
            disabled={readingStore.isPreviewMode}
            size="large"
            style={{
              backgroundColor,
              borderColor,
              borderWidth: readingStore.isPreviewMode && submittedAnswer ? '2px' : '1px',
              color: 'var(--text-primary)'
            }}
          />
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
    </Card>
  )
})

export default MultipleCorrectAnswersQuestion

'use client'

import { Input, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'

interface ImageInputsQuestionProps {
  question: Question
  questionNumber: number
}

const ImageInputsQuestion = observer(({ question, questionNumber }: ImageInputsQuestionProps) => {
  const { readingStore } = useStore()
  const answer = readingStore.getAnswer(question.id) as string | undefined

  const handleChange = (value: string) => {
    readingStore.setAnswer(question.id, value)
  }

  // In preview mode, get submitted answer for styling
  const submittedAnswer = readingStore.isPreviewMode ? readingStore.getSubmittedAnswer(question.id) : null
  const isCorrect = readingStore.isPreviewMode ? readingStore.isAnswerCorrect(question.id) : null

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
    <div className="mb-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="mb-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}><strong>{questionNumber}</strong> {question.text}</p>

          <Input
            value={readingStore.isPreviewMode ? (submittedAnswer as string || '') : (answer || '')}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Answer"
            className="max-w-md"
            disabled={readingStore.isPreviewMode}
            style={{
              backgroundColor,
              borderColor,
              borderWidth: readingStore.isPreviewMode && submittedAnswer ? '2px' : '1px',
              color: 'var(--text-primary)'
            }}
          />
        </div>
      </div>
    </div>
  )
})

export default ImageInputsQuestion

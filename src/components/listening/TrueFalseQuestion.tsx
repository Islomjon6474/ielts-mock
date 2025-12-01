'use client'

import { useEffect, useRef } from 'react'
import { Radio, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'

interface TrueFalseQuestionProps {
  question: any
  questionNumber: number
  type?: 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN'
  isPreviewMode?: boolean
}

const TrueFalseQuestion = observer(({ question, questionNumber, type = 'TRUE_FALSE_NOT_GIVEN', isPreviewMode = false }: TrueFalseQuestionProps) => {
  const { listeningStore } = useStore()
  const storedAnswer = listeningStore.getAnswer(question.id) as string
  const answer = storedAnswer?.replace(/_/g, ' ')
  const containerRef = useRef<HTMLDivElement>(null)
    // Convert stored answer (with underscores) to display format (with spaces)

  useEffect(() => {
    const currentQuestionNumber = listeningStore.currentQuestionNumber
    if (currentQuestionNumber === questionNumber && containerRef.current) {
      setTimeout(() => {
        const radio = containerRef.current?.querySelector('input[type="radio"]') as HTMLInputElement
        if (radio) {
          radio.focus()
        }
      }, 100)
    }
  }, [listeningStore.currentQuestionNumber, questionNumber])

  const options = type === 'YES_NO_NOT_GIVEN'
    ? ['YES', 'NO', 'NOT GIVEN']
    : ['TRUE', 'FALSE', 'NOT GIVEN']

  // In preview mode, get submitted answer for styling
  const submittedAnswer = isPreviewMode ? listeningStore.getSubmittedAnswer(question.id) as string : null
  const isCorrect = isPreviewMode ? listeningStore.isAnswerCorrect(question.id) : null

  // Convert submitted answer format (with underscores) to display format (with spaces)
  const displaySubmittedAnswer = submittedAnswer?.replace(/_/g, ' ')

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
          <p style={{ color: 'var(--text-primary)' }} className="mb-3 text-sm"><strong>{questionNumber}</strong> {question.text}</p>

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

          <Radio.Group
            value={isPreviewMode ? displaySubmittedAnswer : answer}
            onChange={(e) => {
              // Normalize the value by replacing spaces with underscores to match admin format
              const normalizedValue = e.target.value.replace(/ /g, '_')
              listeningStore.setAnswer(question.id, normalizedValue)
            }}
            className="flex gap-4"
            disabled={isPreviewMode}
          >
            {options.map((opt: string) => (
              <Radio key={opt} value={opt} className="text-sm">
                {opt}
              </Radio>
            ))}
          </Radio.Group>
        </div>
      </div>
    </Card>
  )
})

export default TrueFalseQuestion

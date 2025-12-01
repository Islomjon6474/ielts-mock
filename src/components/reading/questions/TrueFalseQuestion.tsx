'use client'

import { useEffect, useRef } from 'react'
import { Radio, Space, Card } from 'antd'
import { observer } from 'mobx-react-lite'
import { useStore } from '@/stores/StoreContext'
import { Question } from '@/stores/ReadingStore'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'

interface TrueFalseQuestionProps {
  question: Question
  questionNumber: number
  type?: 'TRUE_FALSE_NOT_GIVEN' | 'YES_NO_NOT_GIVEN'
}

const TrueFalseQuestion = observer(({ question, questionNumber, type = 'TRUE_FALSE_NOT_GIVEN' }: TrueFalseQuestionProps) => {
  const { readingStore } = useStore()
  const storedAnswer = readingStore.getAnswer(question.id) as string | undefined
  // Convert stored answer (with underscores) to display format (with spaces)
  const answer = storedAnswer?.replace(/_/g, ' ')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only focus if not in preview mode
    if (readingStore.isPreviewMode) return
    
    const currentQuestionNumber = readingStore.parts[readingStore.currentPart - 1]?.questionRange[0] + readingStore.currentQuestionIndex
    if (currentQuestionNumber === questionNumber && containerRef.current) {
      setTimeout(() => {
        const radio = containerRef.current?.querySelector('input[type="radio"]:not([disabled])') as HTMLInputElement
        if (radio) {
          radio.focus()
        }
      }, 100)
    }
  }, [readingStore.currentQuestionIndex, readingStore.currentPart, questionNumber, readingStore.isPreviewMode])

  const handleChange = (value: string) => {
    // Normalize the value by replacing spaces with underscores to match admin format
    const normalizedValue = value.replace(/ /g, '_')
    readingStore.setAnswer(question.id, normalizedValue)
  }

  const isYesNo = type === 'YES_NO_NOT_GIVEN'
  const options = isYesNo
    ? ['YES', 'NO', 'NOT GIVEN']
    : ['TRUE', 'FALSE', 'NOT GIVEN']

  // In preview mode, get submitted answer for styling
  const submittedAnswer = readingStore.isPreviewMode ? readingStore.getSubmittedAnswer(question.id) as string : null
  const isCorrect = readingStore.isPreviewMode ? readingStore.isAnswerCorrect(question.id) : null

  // Convert submitted answer format (with underscores) to display format (with spaces)
  const displaySubmittedAnswer = submittedAnswer?.replace(/_/g, ' ')

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
          <p className="mb-4" style={{ color: 'var(--text-primary)' }}><strong>{questionNumber}</strong> {question.text}</p>

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
            value={readingStore.isPreviewMode ? displaySubmittedAnswer : answer}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full"
            disabled={readingStore.isPreviewMode}
          >
            <Space direction="vertical" className="w-full">
              {options.map(option => (
                <Radio key={option} value={option}>
                  <span style={{ color: 'var(--text-primary)' }}>{option}</span>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>
      </div>
    </Card>
  )
})

export default TrueFalseQuestion
